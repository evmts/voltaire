use std::env;
use std::path::{Path, PathBuf};

fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=wrapper.h");
    
    let out_dir = env::var("OUT_DIR").unwrap();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    
    // For docs.rs, we need to handle the special case where we can't link the library
    if env::var("DOCS_RS").is_ok() {
        // docs.rs can't build our Zig library, so we generate bindings but skip linking
        println!("cargo:warning=Building on docs.rs - library linking skipped");
        generate_bindings(&out_dir, &manifest_dir);
        return;
    }
    
    // Determine the target platform
    let target = env::var("TARGET").unwrap();
    let lib_name = if cfg!(target_os = "windows") {
        "guillotine_ffi_static.lib"
    } else {
        "libguillotine_ffi_static.a"
    };
    
    // Check for pre-compiled library in package
    let precompiled_dir = match target.as_str() {
        "x86_64-unknown-linux-gnu" => "lib/linux-x64",
        "aarch64-unknown-linux-gnu" => "lib/linux-arm64",
        "x86_64-pc-windows-msvc" => "lib/windows-x64",
        "x86_64-apple-darwin" => "lib/macos-x64",
        "aarch64-apple-darwin" => "lib/macos-arm64",
        _ => "",
    };
    
    let precompiled_path = Path::new(&manifest_dir).join(precompiled_dir).join(lib_name);
    
    let library_found = if precompiled_path.exists() {
        // Use pre-compiled library
        println!("cargo:rustc-link-search=native={}", precompiled_path.parent().unwrap().display());
        println!("cargo:rustc-link-lib=static=guillotine_ffi_static");
        true
    } else {
        // Try to use locally built library (for development)
        let project_root = Path::new(&manifest_dir).parent().unwrap().parent().unwrap();
        let zig_lib_path = project_root.join("zig-out/lib");
        
        if zig_lib_path.exists() {
            println!("cargo:rustc-link-search=native={}", zig_lib_path.display());
            
            // Check for static library first, then dynamic
            if zig_lib_path.join(lib_name).exists() {
                println!("cargo:rustc-link-lib=static=guillotine_ffi_static");
                true
            } else if zig_lib_path.join("libguillotine_ffi.dylib").exists() {
                println!("cargo:rustc-link-lib=dylib=guillotine_ffi");
                true
            } else {
                false
            }
        } else {
            false
        }
    };
    
    if !library_found {
        // This is a hard error - we cannot function without the library
        panic!(
            "\n\n\
            ========================================\n\
            ERROR: Guillotine FFI library not found!\n\
            ========================================\n\
            \n\
            This package requires the Guillotine EVM library to be built.\n\
            \n\
            For published packages:\n\
              Pre-compiled libraries should be in: {}\n\
            \n\
            For development:\n\
              1. Clone the repository: https://github.com/evmts/guillotine\n\
              2. Install Zig: https://ziglang.org/download/\n\
              3. Run: zig build static\n\
              4. The library will be in zig-out/lib/\n\
            \n\
            Platform: {}\n\
            Expected library: {}\n\
            ",
            precompiled_path.display(),
            target,
            lib_name
        );
    }
    
    // Link C++ standard library (required by some dependencies)
    if cfg!(target_os = "macos") {
        println!("cargo:rustc-link-lib=c++");
    } else if cfg!(target_os = "linux") {
        println!("cargo:rustc-link-lib=stdc++");
    }
    
    // Generate bindings
    generate_bindings(&out_dir, &manifest_dir);
}

fn generate_bindings(out_dir: &str, manifest_dir: &str) {
    // Check if we're in the development repo or a published package
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
    
    // Add include paths only if we're in the development repo
    if src_path.exists() {
        builder = builder
            .clang_arg(format!("-I{}", src_path.display()))
            .clang_arg(format!("-I{}/primitives", src_path.display()))
            .clang_arg(format!("-I{}/evm", src_path.display()));
    }
    
    let bindings = builder
        .generate()
        .expect("Unable to generate bindings - make sure wrapper.h is valid");
    
    let out_path = PathBuf::from(out_dir);
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}