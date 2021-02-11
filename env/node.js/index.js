const fs = require('fs');
const {WASI} = require('@wasmer/wasi/lib/index.cjs.js');
const wasmTransformer = require("@wasmer/wasm-transformer");
const path = require('path');
const yargs = require('yargs');

const WZIP_URL = '../../target/wasm32-wasi/release/wzip.wasm';

async function main() {
    await wzip(process.argv.splice(2));
}

async function decompress(inputFile, outputFile) {
    await wzip(['-d', '-i', inputFile, '-o', outputFile])
}

async function compress(inputFile, outputFile) {
    await wzip(['-c', '-i', inputFile, '-o', outputFile])
}

async function wzip(args) {
    let wasi = new WASI({
        preopenDirectories: getRequiredPreopenDirectories(args),
        args: ['wzip'].concat(args),
        env: {},
        bindings: {
            ...WASI.defaultBindings,
            fs: fs
        }
    });
    let binary = new Uint8Array(fs.readFileSync(WZIP_URL));
    let loweredBinary = wasmTransformer.lowerI64Imports(binary);
    let module = await WebAssembly.compile(loweredBinary);
    let instance = await WebAssembly.instantiate(module, {
        wasi_unstable: wasi.wasiImport
    });
    wasi.start(instance);
}

function getRequiredPreopenDirectories(args) {
    let parsedArgs = yargv = yargs(args)
        .option('input', {
            alias: 'i',
            type: 'string',
        })
        .option('output', {
            alias: 'o',
            type: 'string',
        })
        .help(false)
        .version(false)
        .argv;
    let preopenDirectories = {};
    if (parsedArgs.input) {
        preopenDirectories[parsedArgs.input] = parsedArgs.input;
    }
    if (parsedArgs.output) {
        preopenDirectories[path.dirname(parsedArgs.output)] = path.dirname(parsedArgs.output);
    }
    return preopenDirectories;
}

main().then(() => console.log('done'));
