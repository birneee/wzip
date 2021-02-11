test:
	node index.js --version
	node index.js --help
	node index.js -c -i ../../testdata/lorum.txt
	node index.js -c -i ../../testdata/lorum.txt -o ../../tmp/lorum.gz
	node index.js -d -i ../../tmp/lorum.gz -o ../../tmp/lorum2.txt
	cmp ../../testdata/lorum.txt ../../tmp/lorum2.txt
