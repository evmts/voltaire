//! Build script for voltaire-rs.
//!
//! When the "native" feature is enabled, links against the Voltaire native library.

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
        println!("cargo:rustc-link-lib=static=primitives_c");

        // Also link C runtime
        #[cfg(target_os = "macos")]
        println!("cargo:rustc-link-lib=framework=Security");

        #[cfg(target_os = "linux")]
        println!("cargo:rustc-link-lib=c");
    }

    // Rebuild if build script changes
    println!("cargo:rerun-if-changed=build.rs");
}
