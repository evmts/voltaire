const std = @import("std");

// Returns the path to the Rust crypto_wrappers static library
// Best practice: Don't wrap Rust .a files in Zig libraries - link them directly to executables
// See: https://github.com/dajuguan/zigbuild-examples
pub fn getRustLibraryPath(
    b: *std.Build,
    rust_target: ?[]const u8,
) std.Build.LazyPath {
    // Cargo always builds in release mode (see lib/build.zig createCargoBuildStep)
    const profile_dir = "release";

    const lib_path = if (rust_target) |target_triple|
        b.fmt("target/{s}/{s}/libcrypto_wrappers.a", .{ target_triple, profile_dir })
    else
        b.fmt("target/{s}/libcrypto_wrappers.a", .{profile_dir});

    return b.path(lib_path);
}
