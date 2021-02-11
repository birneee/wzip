use std::env;
use std::fs::File;
use std::io::{BufRead, BufReader, copy, Read, stdin, stdout, Write};

use clap::{App, Arg};
use flate2::Compression;
use flate2::read::{GzDecoder, GzEncoder};

fn main() {
    let args = App::new("wzip")
        .version(env!("CARGO_PKG_VERSION"))
        .author(env!("CARGO_PKG_AUTHORS"))
        .about("gzip implemented in Rust, able to be utilized in various environments \n\nIf neither -d nor -c flag is set, wzip evaluates the MIME type of the input file.")
        .arg(
            Arg::with_name("decompress")
                .short("d")
                .long("decompress")
                .conflicts_with("compress")
                .help("Decompress"),
        )
        .arg(
            Arg::with_name("compress")
                .short("c")
                .long("compress")
                .conflicts_with("decompress")
                .help("Compress"),
        )
        .arg(
            Arg::with_name("input")
                .short("i")
                .long("input")
                .value_name("FILE")
                .takes_value(true)
                .help("Input file. Default stdin."),
        )
        .arg(
            Arg::with_name("output")
                .short("o")
                .long("output")
                .value_name("FILE")
                .takes_value(true)
                .help("Output file. Default stdout."),
        )
        .get_matches();

    let input: Box<dyn Read> = if args.is_present("input") {
        Box::new(File::open(args.value_of("input").unwrap()).unwrap())
    } else {
        Box::new(stdin())
    };

    let output: Box<dyn Write> = if args.is_present("output") {
        Box::new(File::create(args.value_of("output").unwrap()).unwrap())
    } else {
        Box::new(stdout())
    };

    if args.is_present("decompress") {
        decompress(input, output)
    } else if args.is_present("compress") {
        compress(input, output, Compression::default());
    } else {
        let mut buf_reader = BufReader::new(input);
        if tree_magic::match_u8("application/gzip", buf_reader.fill_buf().unwrap()) {
            decompress(buf_reader, output);
        } else {
            compress(buf_reader, output, Compression::default());
        }
    }
}

fn decompress<R: Read, W: Write>(input: R, mut output: W) {
    let mut decoder = GzDecoder::new(input);
    copy(&mut decoder, &mut output).unwrap();
}

fn compress<R: Read, W: Write>(input: R, mut output: W, level: Compression) {
    let mut encoder = GzEncoder::new(input, level);
    copy(&mut encoder, &mut output).unwrap();
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::fs::{File, metadata};
    use std::io::{copy, Read};
    use std::path::Path;
    use std::str::from_utf8;

    use file_diff::diff_files;
    use flate2::Compression;
    use flate2::read::{GzDecoder, GzEncoder};

    fn deflate_bytes(bytes: Vec<u8>) -> Vec<u8> {
        let mut encoder = GzEncoder::new(bytes.as_slice(), Compression::default());
        let mut buffer: Vec<u8> = Vec::new();
        encoder.read_to_end(&mut buffer).unwrap();
        return buffer;
    }

    fn inflate_bytes(bytes: Vec<u8>) -> Vec<u8> {
        let mut decoder = GzDecoder::new(bytes.as_slice());
        let mut buffer: Vec<u8> = Vec::new();
        decoder.read_to_end(&mut buffer).unwrap();
        return buffer;
    }

    fn deflate_file(input: File, mut output: File) {
        let mut encoder = GzEncoder::new(input, Compression::default());
        copy(&mut encoder, &mut output).unwrap();
    }

    fn inflate_file(input: File, mut output: File) {
        let mut decoder = GzDecoder::new(input);
        copy(&mut decoder, &mut output).unwrap();
    }

    #[test]
    fn test_string() {
        let data = b"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua";
        println!("data: {}", from_utf8(data).unwrap());
        println!("size: {} bytes", data.len());
        let compressed_data = deflate_bytes(data.to_vec());
        println!("compressed size: {} bytes", compressed_data.len());
        println!("compressed data: {:X?}", compressed_data);
        let uncompressed_data = inflate_bytes(compressed_data);
        println!(
            "uncompressed data: {}",
            from_utf8(&uncompressed_data).unwrap()
        );

        assert_eq!(
            from_utf8(data).unwrap(),
            from_utf8(&uncompressed_data).unwrap()
        );
    }

    #[test]
    fn test_file() {
        let path = "./testdata/lorum.txt";
        let compressed_path = "./tmp/lorum.gz";
        let uncompressed_path = "./tmp/lorum2.txt";

        fs::create_dir_all(
            Path::new(compressed_path)
                .parent()
                .unwrap()
                .to_str()
                .unwrap(),
        )
            .unwrap();
        fs::create_dir_all(
            Path::new(uncompressed_path)
                .parent()
                .unwrap()
                .to_str()
                .unwrap(),
        )
            .unwrap();

        deflate_file(
            File::open(path).unwrap(),
            File::create(compressed_path).unwrap(),
        );

        println!("size: {} bytes", metadata(path).unwrap().len());
        println!(
            "compressed size: {} bytes",
            metadata(compressed_path).unwrap().len()
        );

        inflate_file(
            File::open(compressed_path).unwrap(),
            File::create(uncompressed_path).unwrap(),
        );

        assert!(diff_files(
            &mut File::open(path).unwrap(),
            &mut File::open(uncompressed_path).unwrap(),
        ));
    }
}
