default: ./target/release/wzip ./target/wasm32-wasi/release/wzip.wasm ./target/wasm32-wasi/release/wzip_optimized.wasm ./target/wasm32-wasi/release/wzip_simd.wasm

setup:
	rustup target add wasm32-wasi

./target/release/wzip: ./src/main.rs Cargo.toml
	cargo build --release

./target/wasm32-wasi/release/wzip.wasm: ./src/main.rs Cargo.toml
	cargo build --release --target wasm32-wasi

./target/wasm32-wasi/release/wzip_simd.wasm: ./target/wasm32-wasi/release/wzip.wasm
	cargo rustc --release --target wasm32-wasi -- -o ./target/wasm32-wasi/release/wzip_simd -C target-feature=+simd128

./target/wasm32-wasi/release/wzip_optimized.wasm: ./target/wasm32-wasi/release/wzip.wasm
	wasm-opt -o ./target/wasm32-wasi/release/wzip_optimized.wasm ./target/wasm32-wasi/release/wzip.wasm
	wasm-strip ./target/wasm32-wasi/release/wzip_optimized.wasm

optimize: ./target/wasm32-wasi/release/wzip_optimized.wasm

test:
	cargo test -- --nocapture

run: ./target/wasm32-wasi/debug/gzip-wasi-web.wasm
	wasmtime --dir=. ./target/wasm32-wasi/release/wzip.wasm

clean:
	rm -r ./target
	rm -r ./tmp