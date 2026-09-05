const std = @import("std");
const builtin = @import("builtin");

/// Cargo target used by native and cross-platform crypto builds.
pub fn rustTargetTriple(target: std.Build.ResolvedTarget) []const u8 {
    const t = target.result;
    if (t.cpu.arch == .wasm32 or t.cpu.arch == .wasm64) return "wasm32-unknown-unknown";
    return switch (t.os.tag) {
        .macos => switch (t.cpu.arch) {
            .aarch64 => "aarch64-apple-darwin",
            .x86_64 => "x86_64-apple-darwin",
            else => @panic("Unsupported macOS Rust target"),
        },
        .linux => switch (t.cpu.arch) {
            .aarch64 => if (t.abi == .musl) "aarch64-unknown-linux-musl" else "aarch64-unknown-linux-gnu",
            .x86_64 => if (t.abi == .musl) "x86_64-unknown-linux-musl" else "x86_64-unknown-linux-gnu",
            else => @panic("Unsupported Linux Rust target"),
        },
        .freebsd => switch (t.cpu.arch) {
            .aarch64 => "aarch64-unknown-freebsd",
            .x86_64 => "x86_64-unknown-freebsd",
            else => @panic("Unsupported FreeBSD Rust target"),
        },
        .windows => switch (t.cpu.arch) {
            .aarch64 => if (t.abi == .msvc) "aarch64-pc-windows-msvc" else "aarch64-pc-windows-gnu",
            .x86_64 => if (t.abi == .msvc) "x86_64-pc-windows-msvc" else "x86_64-pc-windows-gnu",
            .x86 => if (t.abi == .msvc) "i686-pc-windows-msvc" else "i686-pc-windows-gnu",
            else => @panic("Unsupported Windows Rust target"),
        },
        else => @panic("Unsupported Rust target OS"),
    };
}

pub fn needsExplicitTarget(target: std.Build.ResolvedTarget) bool {
    const t = target.result;
    return t.cpu.arch == .wasm32 or t.cpu.arch == .wasm64 or
        t.os.tag != builtin.target.os.tag or t.cpu.arch != builtin.target.cpu.arch or
        t.abi != builtin.target.abi;
}

/// Link the archive Cargo built for this target, never a host archive during cross compilation.
pub fn getRustLibraryPath(b: *std.Build, target: std.Build.ResolvedTarget) std.Build.LazyPath {
    const filename = if (target.result.os.tag == .windows and target.result.abi == .msvc)
        "crypto_wrappers.lib"
    else
        "libcrypto_wrappers.a";
    if (needsExplicitTarget(target)) {
        return b.path(b.fmt("target/{s}/release/{s}", .{ rustTargetTriple(target), filename }));
    }
    return b.path(b.fmt("target/release/{s}", .{filename}));
}
