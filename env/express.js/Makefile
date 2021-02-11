test:
	curl --data-binary "@../../testdata/lorum.txt" -X POST http://localhost:3000 -o ../../tmp/lorum.gz
	curl --data-binary "@../../tmp/lorum.gz" -X POST http://localhost:3000 -o ../../tmp/lorum2.txt
	cmp ../../testdata/lorum.txt ../../tmp/lorum2.txt
