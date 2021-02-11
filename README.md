<img src="wzip.png" width="200">

# WZIP<br/>GZIP + WASI

gzip implemented in Rust, able to be utilized in various environments

## Screenshots

<img src="screenshots/1_idle.png" width="47%" align="left" style="padding:5px">
<img src="screenshots/2_hover.png" width="47%" align="left" style="padding:5px">
<img src="screenshots/3_process.png" width="47%" align="left" style="padding:5px">
<img src="screenshots/4_download.png" width="47%" style="padding:5px">


## Install wasi compiler target
```rustup target add wasm32-wasi```

## Compile
```make```

## Environments
the `env` folder contains examples embeddings in different environments. All examples use the exact same `wzip.wasm` binary. 

- Browser
- Node.js CLI
- Node.js + Express.js
- Wasmtime

## Run with wasmtime
```wasmtime ./target/wasm32-wasi/release/wzip.wasm```