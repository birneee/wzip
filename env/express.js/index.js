const fs = require('fs');
const express = require('express');
const {WASI} = require('@wasmer/wasi/lib/index.cjs.js');
const {WasmFs} = require('@wasmer/wasmfs/lib/index.cjs.js');
const wasmTransformer = require("@wasmer/wasm-transformer");
const concat = require('concat-stream');

const WZIP_URL = "../../target/wasm32-wasi/release/wzip.wasm";

const app = express();
const port = 3000;

const wasmBinary = new Uint8Array(fs.readFileSync(WZIP_URL));
const wasmLoweredBinary = wasmTransformer.lowerI64Imports(wasmBinary);
const wasmModule = WebAssembly.compile(wasmLoweredBinary);

app.use(function (req, res, next) {
    req.pipe(concat(function (data) {
        req.body = data;
        next();
    }));
});

app.post('/', async (req, res) => {
    let data = new Uint8Array(req.body);
    let result = arrayBufferToBuffer(await wzip(data));
    res.header("Content-Type", "application/octet-stream");
    res.end(result, 'binary');
});

async function wzip(data) {
    let wasmFs = new WasmFs();
    let wasi = new WASI({
        args: ['wzip'],
        bindings: {
            ...WASI.defaultBindings,
            fs: wasmFs.fs
        }
    });
    let instance = await WebAssembly.instantiate(await wasmModule, {
        wasi_unstable: wasi.wasiImport
    });
    wasmFs.fs.writeFileSync("/dev/stdin", data);
    wasi.start(instance);
    wasmFs.fs.unlinkSync("/dev/stdin");
    return wasmFs.fs.readFileSync("/dev/stdout");
}

app.listen(port, () => console.log(`Listening on port ${port}`));

function arrayBufferToBuffer(arrayBuffer) {
    var buf = Buffer.alloc(arrayBuffer.byteLength);
    var view = new Uint8Array(arrayBuffer);
    for (var i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
    }
    return buf;
}