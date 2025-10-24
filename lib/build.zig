const std = @import("std");

// Import individual library build configurations
pub const BlstLib = @import("blst.zig");
pub const CKzgLib = @import("c-kzg.zig");
pub const Bn254Lib = @import("bn254.zig");
pub const KeccakLib = @import("keccak.zig");

// Re-export the main functions for convenience
pub const createBlstLibrary = BlstLib.createBlstLibrary;
pub const createCKzgLibrary = CKzgLib.createCKzgLibrary;
pub const createBn254Library = Bn254Lib.createBn254Library;
pub const createKeccakLibrary = KeccakLib.createKeccakLibrary;

pub fn checkCargoInstalled() void {
    const result = std.process.Child.run(.{
        .allocator = std.heap.page_allocator,
        .argv = &[_][]const u8{ "cargo", "--version" },
    }) catch {
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
    };
    defer {
        std.heap.page_allocator.free(result.stdout);
        std.heap.page_allocator.free(result.stderr);
    }

    if (result.term.Exited != 0) {
        std.debug.print("\n", .{});
        std.debug.print("❌ ERROR: Cargo command failed!\n", .{});
        std.debug.print("\n", .{});
        std.debug.print("Please ensure Cargo is properly installed and in your PATH.\n", .{});
        std.debug.print("\n", .{});
        std.process.exit(1);
    }
}

pub fn createCargoBuildStep(b: *std.Build, optimize: std.builtin.OptimizeMode) *std.Build.Step {
    const cargo_build = b.addSystemCommand(&[_][]const u8{"cargo"});
    cargo_build.addArg("build");

    // Map Zig optimize mode to Cargo profile
    const profile_args = switch (optimize) {
        .Debug => &[_][]const u8{},
        .ReleaseSafe, .ReleaseSmall => &[_][]const u8{ "--release" },
        .ReleaseFast => &[_][]const u8{ "--profile", "release-fast" },
    };

    for (profile_args) |arg| {
        cargo_build.addArg(arg);
    }

    // No additional args needed - single package at repo root

    return &cargo_build.step;
}

pub fn checkVendoredDeps() void {
    // Verify vendored c-kzg-4844 dependencies exist
    const deps = [_]struct {
        path: []const u8,
        name: []const u8,
    }{
        .{ .path = "lib/c-kzg-4844/src", .name = "c-kzg-4844 source" },
        .{ .path = "lib/c-kzg-4844/blst/src", .name = "blst source" },
    };

    var missing = false;

    for (deps) |dep| {
        std.fs.cwd().access(dep.path, .{}) catch {
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