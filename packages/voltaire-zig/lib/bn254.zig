const std = @import("std");

// Returns the path to the Rust crypto_wrappers static library
// Best practice: Don't wrap Rust .a files in Zig libraries - link them directly to executables
// See: https://github.com/dajuguan/zigbuild-examples
pub fn getRustLibraryPath(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
) std.Build.LazyPath {
    // Cargo always builds in release mode (see lib/build.zig createCargoBuildStep)
    const profile_dir = "release";

    // Check if this is a WASM target
    const is_wasm = target.result.cpu.arch == .wasm32 or target.result.cpu.arch == .wasm64;
    if (is_wasm) {
        return b.path(b.fmt("target/wasm32-unknown-unknown/{s}/libcrypto_wrappers.a", .{profile_dir}));
    }
    // Native and cross builds always pass --target to Cargo so Rust artifacts
    // live in a target-specific directory and cannot collide across Zig targets.
    else {
        const rust_target = rustTargetTriple(target);
        return b.path(b.fmt("target/{s}/{s}/libcrypto_wrappers.a", .{ rust_target, profile_dir }));
    }
}

fn rustTargetTriple(target: std.Build.ResolvedTarget) []const u8 {
    return switch (target.result.os.tag) {
        .linux => switch (target.result.abi) {
            .gnu => switch (target.result.cpu.arch) {
                .x86_64 => "x86_64-unknown-linux-gnu",
                .aarch64 => "aarch64-unknown-linux-gnu",
                else => unsupportedRustTarget("unsupported Linux GNU Rust architecture"),
            },
            .musl => switch (target.result.cpu.arch) {
                .x86_64 => "x86_64-unknown-linux-musl",
                .aarch64 => "aarch64-unknown-linux-musl",
                else => unsupportedRustTarget("unsupported Linux musl Rust architecture"),
            },
            else => unsupportedRustTarget("unsupported Linux Rust ABI"),
        },
        .macos => switch (target.result.cpu.arch) {
            .x86_64 => "x86_64-apple-darwin",
            .aarch64 => "aarch64-apple-darwin",
            else => unsupportedRustTarget("unsupported macOS Rust architecture"),
        },
        .windows => switch (target.result.cpu.arch) {
            .x86_64 => "x86_64-pc-windows-gnu",
            .x86 => "i686-pc-windows-gnu",
            .aarch64 => "aarch64-pc-windows-gnu",
            else => unsupportedRustTarget("unsupported Windows Rust architecture"),
        },
        else => unsupportedRustTarget("unsupported Rust target OS"),
    };
}

fn unsupportedRustTarget(message: []const u8) noreturn {
    std.debug.print("error: {s}\n", .{message});
    std.process.exit(1);
}
