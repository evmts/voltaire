//! Build script for voltaire-rs.
//!
//! When the "native" feature is enabled, links against the Voltaire native library.

fn main() {
    // Only link native library when feature is enabled
    #[cfg(feature = "native")]
    {
        // Look for the library in the parent voltaire-zig package
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let voltaire_zig = std::path::Path::new(&manifest_dir)
            .parent()
            .unwrap()
            .join("voltaire-zig")
            .join("zig-out")
            .join("lib");

        if voltaire_zig.exists() {
            println!("cargo:rustc-link-search=native={}", voltaire_zig.display());
            println!("cargo:rustc-link-lib=static=voltaire");
        } else {
            // Try system paths
            println!("cargo:rustc-link-lib=voltaire");
        }

        // Also link C runtime
        #[cfg(target_os = "macos")]
        println!("cargo:rustc-link-lib=framework=Security");

        #[cfg(target_os = "linux")]
        println!("cargo:rustc-link-lib=c");
    }

    // Rebuild if build script changes
    println!("cargo:rerun-if-changed=build.rs");
}
