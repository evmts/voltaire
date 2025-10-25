const std = @import("std");

pub fn createBn254Library(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    config: anytype,
    workspace_build_step: ?*std.Build.Step,
    rust_target: ?[]const u8,
) ?*std.Build.Step.Compile {
    _ = config;

    const lib = b.addLibrary(.{
        .name = "crypto_wrappers",
        .use_llvm = true,
        .root_module = b.createModule(.{
            .target = target,
            .optimize = optimize,
        }),
    });

    const profile_dir = switch (optimize) {
        .Debug => "debug",
        .ReleaseSafe, .ReleaseSmall => "release",
        .ReleaseFast => "release-fast",
    };
    // Cargo builds to target/ at repo root (single crate now)
    const lib_path = if (rust_target) |target_triple|
        b.fmt("target/{s}/{s}/libcrypto_wrappers.a", .{ target_triple, profile_dir })
    else
        b.fmt("target/{s}/libcrypto_wrappers.a", .{profile_dir});

    lib.addObjectFile(b.path(lib_path));
    lib.linkLibC();
    lib.addIncludePath(b.path("lib"));

    if (workspace_build_step) |build_step| {
        lib.step.dependOn(build_step);
    }

    return lib;
}
