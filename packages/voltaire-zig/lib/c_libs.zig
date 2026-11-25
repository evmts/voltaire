const std = @import("std");

// Import individual library build configurations
pub const BlstLib = @import("blst.zig");
pub const CKzgLib = @import("c-kzg.zig");
pub const Bn254Lib = @import("bn254.zig");

// Re-export the main functions for convenience
pub const createBlstLibrary = BlstLib.createBlstLibrary;
pub const createCKzgLibrary = CKzgLib.createCKzgLibrary;
pub const getRustLibraryPath = Bn254Lib.getRustLibraryPath;

pub fn checkCargoInstalled(b: *std.Build) void {
    if (b.findProgram(.{ .names = &.{"cargo"} }) == null) {
        std.debug.print("\n", .{});
        std.debug.print("❌ ERROR: Cargo (Rust build tool) is not installed!\n", .{});
        std.debug.print("\n", .{});
        std.debug.print("This project requires Rust libraries (bn254_wrapper, keccak_wrapper).\n", .{});
        std.debug.print("\n", .{});
        std.debug.print("To install Rust and Cargo, visit:\n", .{});
        std.debug.print("  https://rustup.rs/\n", .{});
        std.debug.print("\n", .{});
        std.debug.print("Or run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\n", .{});
        std.debug.print("\n", .{});
        std.process.exit(1);
    }
}

pub fn createCargoBuildStep(b: *std.Build, optimize: std.builtin.OptimizeMode, target: std.Build.ResolvedTarget) *std.Build.Step {
    const cargo_build = b.addSystemCommand(&[_][]const u8{"cargo"});
    cargo_build.addArg("build");

    // Always build Rust in release mode for FFI libraries
    // Rust debug mode doesn't provide significant benefits when called from Zig,
    // and release mode works correctly across all platforms
    _ = optimize;
    cargo_build.addArg("--release");

    const is_wasm = target.result.cpu.arch == .wasm32 or target.result.cpu.arch == .wasm64;
    if (Bn254Lib.needsExplicitTarget(target)) {
        cargo_build.addArg("--target");
        cargo_build.addArg(Bn254Lib.rustTargetTriple(target));
        // Native assembly dependencies cannot be reused across target architectures.
        cargo_build.addArg("--no-default-features");
        cargo_build.addArg("--features");
        cargo_build.addArg("portable");
    }

    // Set working directory to the primitives package root (where Cargo.toml lives)
    cargo_build.setCwd(b.path("."));

    if (is_wasm) {
        const filter_wasm_archive = b.addSystemCommand(&[_][]const u8{
            "python3",
            "scripts/filter-wasm-archive.py",
        });
        filter_wasm_archive.addFileArg(Bn254Lib.getRustLibraryPath(b, target));
        filter_wasm_archive.setCwd(b.path("."));
        filter_wasm_archive.step.dependOn(&cargo_build.step);
        return &filter_wasm_archive.step;
    }

    return &cargo_build.step;
}

pub fn checkVendoredDeps(b: *std.Build) void {
    // Verify vendored c-kzg-4844 dependencies exist relative to build root
    const deps = [_]struct {
        path: []const u8,
        name: []const u8,
    }{
        .{ .path = "packages/voltaire-zig/lib/c-kzg-4844/src", .name = "c-kzg-4844 source" },
        .{ .path = "packages/voltaire-zig/lib/c-kzg-4844/blst/src", .name = "blst source" },
    };

    var missing = false;

    for (deps) |dep| {
        std.Io.Dir.cwd().access(b.graph.io, dep.path, .{}) catch {
            if (!missing) {
                std.debug.print("\n", .{});
                std.debug.print("❌ ERROR: Required vendored dependencies are missing!\n", .{});
                std.debug.print("\n", .{});
                missing = true;
            }
            std.debug.print("  • {s}\n", .{dep.name});
        };
    }

    if (missing) {
        std.debug.print("\n", .{});
        std.debug.print("Vendored dependencies should be present in lib/c-kzg-4844/\n", .{});
        std.debug.print("This may indicate a corrupted clone or checkout.\n", .{});
        std.debug.print("\n", .{});
        std.process.exit(1);
    }
}
