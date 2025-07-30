use std::env;
use std::path::PathBuf;

fn main() {
    // Generate C bindings
    let crate_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let output_path = PathBuf::from(&crate_dir).join("revm_wrapper.h");

    cbindgen::Builder::new()
        .with_config(cbindgen::Config::from_file("cbindgen.toml").unwrap())
        .with_crate(crate_dir)
        .generate()
        .expect("Unable to generate bindings")
        .write_to_file(output_path);
}