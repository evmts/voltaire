use std::env;
use std::path::PathBuf;

fn main() {
    // Generate C bindings
    let crate_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let output_path = PathBuf::from(&crate_dir).join("revm_wrapper.h");

    cbindgen::Builder::new()
        .with_config(cbindgen::Config::from_file("cbindgen.toml").unwrap())
        .with_crate(&crate_dir)
        .generate()
        .expect("Unable to generate bindings")
        .write_to_file(output_path);

    let project_dir = PathBuf::from(&crate_dir).parent().unwrap().parent().unwrap().to_path_buf();

    // Tell cargo to look for the library in zig-out/lib
    println!("cargo:rustc-link-search={}/zig-out/lib", project_dir.display());

    // NOTE: Removed bn254_wrapper linking to avoid circular dependencies in workspace
    // Link to the correct bn254_wrapper based on profile
    // let profile = env::var("PROFILE").unwrap();
    // let target_dir = if profile == "release" { "release" } else { "debug" };
    // let target_triple = env::var("TARGET").unwrap();
    // println!("cargo:rustc-link-search={}/target/{}/{}", project_dir.display(), target_triple, target_dir);
    // println!("cargo:rustc-link-search={}/target/{}", project_dir.display(), target_dir);
    // println!("cargo:rustc-link-lib=static=bn254_wrapper");
}
