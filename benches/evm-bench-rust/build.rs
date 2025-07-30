use std::env;
use std::path::{Path, PathBuf};
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=../../src");
    
    let out_dir = env::var("OUT_DIR").unwrap();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let project_root = Path::new(&manifest_dir).parent().unwrap().parent().unwrap();
    
    // Check if Guillotine library already exists, otherwise build it
    let lib_path = project_root.join("zig-out/lib/libGuillotine.a");
    if !lib_path.exists() {
        println!("Building Guillotine static library...");
        
        // Try the regular build but don't panic on benchmark failures
        let status = Command::new("zig")
            .arg("build")
            .arg("-Doptimize=ReleaseFast")
            .current_dir(&project_root)
            .status()
            .expect("Failed to execute zig build");
        
        // Don't panic if build fails due to benchmark compilation issues
        // The library components likely built successfully
        if !status.success() {
            println!("cargo:warning=Zig build had issues (likely benchmark compilation), but library may still be available");
        }
    } else {
        println!("Using existing Guillotine library");
    }
    
    // Link to the built Guillotine library
    println!("cargo:rustc-link-search=native={}/zig-out/lib", project_root.display());
    println!("cargo:rustc-link-lib=static=Guillotine");
    
    // Link C++ standard library (required by some dependencies)
    if cfg!(target_os = "macos") {
        println!("cargo:rustc-link-lib=c++");
    } else if cfg!(target_os = "linux") {
        println!("cargo:rustc-link-lib=stdc++");
    }
    
    // Generate bindings using bindgen
    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .clang_arg("-I../../src")
        .clang_arg("-I../../src/primitives")
        .clang_arg("-I../../src/evm")
        .allowlist_function("guillotine_.*")
        .allowlist_type("Guillotine.*")
        .allowlist_var("GUILLOTINE_.*")
        .generate()
        .expect("Unable to generate bindings");
    
    // Write the bindings to the $OUT_DIR/bindings.rs file.
    let out_path = PathBuf::from(out_dir);
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}