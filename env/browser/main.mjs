import WASI from './node_modules/@wasmer/wasi/lib/index.esm.js';
import WasmFs from './node_modules/@wasmer/wasmfs/lib/index.esm.js';

const WZIP_URL = '../../target/wasm32-wasi/release/wzip.wasm';

const wasmModule = WebAssembly.compileStreaming(fetch(WZIP_URL));

async function main() {
    let dragenterCounter = 0;
    let dropZone = document.getElementById('drop_zone');
    dropZone.ondragenter = event => {
        event.preventDefault();
        dragenterCounter++;
        dropZone.classList.add('drag');
    };
    dropZone.ondragleave = event => {
        event.preventDefault();
        dragenterCounter--;
        if (dragenterCounter === 0)
            dropZone.classList.remove('drag');
    };
    dropZone.ondrop = event => {
        event.preventDefault();
        dropZone.classList.remove('drag');
        if (event.dataTransfer.items.length === 1) {
            let item = event.dataTransfer.items[0];
            if (item.kind === 'file') {
                dropZone.classList.add('process');
                let file = item.getAsFile();
                let reader = new FileReader();
                reader.onload = async event => {
                    let data = new Uint8Array(event.target.result);
                    let result = await wzip(await wasmModule, [], data);
                    let blob = new Blob([result]);
                    let url = window.URL.createObjectURL(blob);
                    dropZone.classList.remove('process');
                    downloadURI(url, getOutputFileName(file.name, data))
                };
                reader.readAsArrayBuffer(file);
            }
        }
    };
    dropZone.ondragover = event => {
        event.preventDefault();
    };
}

async function compress(module, data) {
    return wzip(module, ['-c'], data);
}

async function decompress(module, data) {
    return wzip(module, ['-d'], data);
}

async function wzip(module, args, data) {
    let fs = new WasmFs().fs;
    let wasi = new WASI({
        args: ['wzip'].concat(args),
        bindings: {
            ...WASI.defaultBindings,
            fs: fs
        }
    });
    let instance = await WebAssembly.instantiate(module, {
        wasi_unstable: wasi.wasiImport
    });
    fs.writeFileSync('/dev/stdin', data);
    wasi.start(instance);
    fs.unlinkSync('/dev/stdin');
    return fs.readFileSync('/dev/stdout');
}

window.onload = main;

function isMimeTypeGzip(data) {
    const magicNumber = [0x1f, 0x8B, 0x08];
    let header = new Uint16Array(data).slice(0, 3);
    return arrayEqual(magicNumber, header);
}

function getOutputFileName(inputFileName, inputData) {
    if (isMimeTypeGzip(inputData)) {
        if (inputFileName.length > 3 && inputFileName.endsWith('.gz')) {
            return inputFileName.substring(0, inputFileName.length - 3);
        }
        return inputFileName;
    } else {
        return inputFileName + '.gz'
    }
}

function arrayEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function downloadURI(url, name) {
    var link = document.createElement('a');
    link.download = name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}