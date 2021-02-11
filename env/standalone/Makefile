test:
	wasmtime ../../target/wasm32-wasi/release/wzip.wasm -- -c < ../../testdata/lorum.txt > ../../tmp/lorum.gz
	wasmtime ../../target/wasm32-wasi/release/wzip.wasm -- -d < ../../tmp/lorum.gz > ../../tmp/lorum2.txt
	cmp ../../testdata/lorum.txt ../../tmp/lorum2.txt
	wasmtime --dir=../../testdata --dir=../../tmp ../../target/wasm32-wasi/release/wzip.wasm -- -c -i ../../testdata/lorum.txt -o ../../tmp/lorum.gz
	wasmtime --dir=../../tmp ../../target/wasm32-wasi/release/wzip.wasm -- -d -i ../../tmp/lorum.gz -o ../../tmp/lorum2.txt
	cmp ../../testdata/lorum.txt ../../tmp/lorum2.txt
