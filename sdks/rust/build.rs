use std::env;
use std::path::{Path, PathBuf};
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=wrapper.h");
    println!("cargo:rerun-if-changed=../../src");
    println!("cargo:rerun-if-changed=../../build.zig");
    
    let out_dir = env::var("OUT_DIR").unwrap();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    
    // For docs.rs, we need to handle the special case where we can't build
    if env::var("DOCS_RS").is_ok() {
        println!("cargo:warning=Building on docs.rs - compilation skipped");
        generate_bindings(&out_dir, &manifest_dir);
        return;
    }
    
    // Determine if we're in the Guillotine repository or a published crate
    let project_root = Path::new(&manifest_dir)
        .parent().unwrap()  // sdks/
        .parent().unwrap(); // Guillotine root
    
    let src_dir = project_root.join("src");
    let build_zig = project_root.join("build.zig");
    
    let build_dir = if src_dir.exists() && build_zig.exists() {
        // Local development - build from source in repo
        println!("cargo:warning=Building from local Guillotine source");
        project_root.to_path_buf()
    } else {
        // Published crate - need to clone/download source
        println!("cargo:warning=Downloading Guillotine source for build");
        download_and_prepare_source(&out_dir)
    };
    
    // Build the static library from source
    build_guillotine_library(&build_dir);
    
    // Link the built library
    let zig_out = build_dir.join("zig-out").join("lib");
    println!("cargo:rustc-link-search=native={}", zig_out.display());
    println!("cargo:rustc-link-lib=static=guillotine_ffi_static");
    
    // Link system libraries
    if cfg!(target_os = "macos") {
        println!("cargo:rustc-link-lib=c++");
    } else if cfg!(target_os = "linux") {
        println!("cargo:rustc-link-lib=stdc++");
    }
    
    // Generate bindings
    generate_bindings(&out_dir, &manifest_dir);
}

fn download_and_prepare_source(out_dir: &str) -> PathBuf {
    let guillotine_dir = Path::new(out_dir).join("guillotine-src");
    
    // Skip if already downloaded
    if guillotine_dir.join("build.zig").exists() {
        return guillotine_dir;
    }
    
    // Clone the repository (shallow clone for speed)
    let status = Command::new("git")
        .args(&[
            "clone",
            "--depth", "1",
            "--recursive",
            "https://github.com/evmts/guillotine.git",
            guillotine_dir.to_str().unwrap()
        ])
        .status()
        .expect("Failed to clone Guillotine repository. Is git installed?");
    
    if !status.success() {
        panic!("Failed to download Guillotine source code");
    }
    
    guillotine_dir
}

fn build_guillotine_library(project_dir: &Path) {
    // Get Rust build profile information
    let profile = env::var("PROFILE").unwrap_or_else(|_| "debug".to_string());
    // Check for Zig compiler
    let zig_version = Command::new("zig")
        .arg("version")
        .output();
    
    if zig_version.is_err() {
        panic!(
            "\n\n\
            ========================================\n\
            ERROR: Zig compiler not found!\n\
            ========================================\n\
            \n\
            This package requires Zig to build the Guillotine EVM.\n\
            \n\
            Please install Zig 0.15.1 or later:\n\
              https://ziglang.org/download/\n\
            \n\
            On macOS:    brew install zig\n\
            On Ubuntu:   snap install zig --classic\n\
            On Windows:  winget install zig.zig\n\
            "
        );
    }
    
    // Map Rust profile to Zig optimization mode
    let profile = env::var("PROFILE").unwrap_or_else(|_| "debug".to_string());
    let opt_level = env::var("OPT_LEVEL").unwrap_or_else(|_| "0".to_string());
    let debug = env::var("DEBUG").unwrap_or_else(|_| "true".to_string());
    
    let zig_optimize = match (profile.as_str(), opt_level.as_str(), debug.as_str()) {
        ("release", "3", _) => "ReleaseFast",     // cargo build --release (default)
        ("release", "s" | "z", _) => "ReleaseSmall", // cargo build --release with opt-level = "s" or "z"
        ("release", _, _) => "ReleaseSafe",       // cargo build --release with opt-level = 1 or 2
        _ => "Debug",                              // cargo build (debug mode)
    };
    
    println!("cargo:warning=Building Guillotine with Zig (optimization: {}) - this may take a few minutes on first build", zig_optimize);
    
    // Build the static library with Zig
    let output = Command::new("zig")
        .current_dir(project_dir)
        .args(&["build", "static", &format!("-Doptimize={}", zig_optimize)])
        .output()
        .expect("Failed to execute zig build");
    
    if !output.status.success() {
        eprintln!("Zig build output:");
        eprintln!("{}", String::from_utf8_lossy(&output.stdout));
        eprintln!("{}", String::from_utf8_lossy(&output.stderr));
        panic!("Failed to build Guillotine library");
    }
    
    // Also build the Rust dependencies (bn254, revm wrappers)
    println!("cargo:warning=Building Rust crypto dependencies");
    
    // Build Rust dependencies with matching profile
    let cargo_args = if profile == "release" {
        vec!["build", "--release"]
    } else {
        vec!["build"]
    };
    
    let cargo_output = Command::new("cargo")
        .current_dir(project_dir)
        .args(&cargo_args)
        .env("CARGO_TARGET_DIR", project_dir.join("target"))
        .output()
        .expect("Failed to execute cargo build");
    
    if !cargo_output.status.success() {
        eprintln!("Cargo build output:");
        eprintln!("{}", String::from_utf8_lossy(&cargo_output.stdout));
        eprintln!("{}", String::from_utf8_lossy(&cargo_output.stderr));
        panic!("Failed to build Rust dependencies");
    }
    
    // Link the Rust crypto libraries from the appropriate profile directory
    let rust_profile_dir = if profile == "release" { "release" } else { "debug" };
    let target_dir = project_dir.join("target").join(rust_profile_dir);
    println!("cargo:rustc-link-search=native={}", target_dir.display());
    println!("cargo:rustc-link-lib=static=bn254_wrapper");
    println!("cargo:rustc-link-lib=static=revm_wrapper");
}

fn generate_bindings(out_dir: &str, manifest_dir: &str) {
    let project_root = Path::new(manifest_dir).parent().unwrap().parent().unwrap();
    let src_path = project_root.join("src");
    
    let mut builder = bindgen::Builder::default()
        .header("wrapper.h")
        .allowlist_function("guillotine_.*")
        .allowlist_type("BlockInfoFFI")
        .allowlist_type("CallParams")
        .allowlist_type("EvmResult")
        .allowlist_type("EvmHandle")
        .allowlist_type("LogEntry")
        .allowlist_type("SelfDestructRecord")
        .allowlist_type("StorageAccessRecord");
    
    // Add include paths if we have access to source
    if src_path.exists() {
        builder = builder
            .clang_arg(format!("-I{}", src_path.display()))
            .clang_arg(format!("-I{}/primitives", src_path.display()))
            .clang_arg(format!("-I{}/evm", src_path.display()));
    }
    
    let bindings = builder
        .generate()
        .expect("Unable to generate bindings");
    
    let out_path = PathBuf::from(out_dir);
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}