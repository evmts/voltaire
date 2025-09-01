const std = @import("std");
const Config = @import("../config.zig");

pub fn createBn254Library(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    config: Config.BuildOptions,
    workspace_build_step: ?*std.Build.Step,
    rust_target: ?[]const u8,
) ?*std.Build.Step.Compile {
    if (config.no_bn254 or rust_target == null) return null;

    const lib = b.addLibrary(.{
        .name = "bn254_wrapper",
        .root_module = b.createModule(.{
            .target = target,
            .optimize = optimize,
        }),
    });

    const profile_dir = if (optimize == .Debug) "debug" else "release";
    const lib_path = if (rust_target) |target_triple|
        b.fmt("target/{s}/{s}/libbn254_wrapper.a", .{ target_triple, profile_dir })
    else
        b.fmt("target/{s}/libbn254_wrapper.a", .{profile_dir});

    lib.addObjectFile(b.path(lib_path));
    lib.linkLibC();
    lib.addIncludePath(b.path("src/bn254_wrapper"));

    if (workspace_build_step) |build_step| {
        lib.step.dependOn(build_step);
    }

    return lib;
}