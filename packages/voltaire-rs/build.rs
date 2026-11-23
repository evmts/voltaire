//! Build script for voltaire-rs.
//!
//! When the "native" feature is enabled, links against the Voltaire native shared library
//! (`libprimitives_c.so` / `libprimitives_c.dylib`).

fn main() {
    // Only link native library when feature is enabled
    #[cfg(feature = "native")]
    {
        println!("cargo:rerun-if-env-changed=VOLTAIRE_LIB_DIR");
        let lib_dir = std::env::var_os("VOLTAIRE_LIB_DIR")
            .map(std::path::PathBuf::from)
            .unwrap_or_else(|| {
                let manifest_dir = std::env::var_os("CARGO_MANIFEST_DIR").unwrap();
                std::path::PathBuf::from(manifest_dir).join("../../zig-out/lib")
            });
        println!("cargo:rustc-link-search=native={}", lib_dir.display());
        // Link the shared library: it carries blst, c-kzg-4844, libwally-core
        // and crypto_wrappers. The static archive does not bundle them.
        println!("cargo:rustc-link-lib=dylib=primitives_c");

        // build.rs runs on the host; read the target OS from Cargo.
        let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();

        // Embed the library directory as an rpath so tests and binaries run
        // without LD_LIBRARY_PATH / DYLD_LIBRARY_PATH.
        if target_os == "linux" || target_os == "macos" {
            println!("cargo:rustc-link-arg=-Wl,-rpath,{}", lib_dir.display());
        }

        // Also link C runtime
        if target_os == "macos" {
            println!("cargo:rustc-link-lib=framework=Security");
        }
        if target_os == "linux" {
            println!("cargo:rustc-link-lib=c");
        }
    }

    // Rebuild if build script changes
    println!("cargo:rerun-if-changed=build.rs");
}
