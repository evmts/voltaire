const std = @import("std");

pub fn createRevmLibrary(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    workspace_build_step: ?*std.Build.Step,
    rust_target: ?[]const u8,
) ?*std.Build.Step.Compile {
    if (rust_target == null) return null;

    const lib = b.addLibrary(.{
        .name = "revm_wrapper",
        .root_module = b.createModule(.{
            .target = target,
            .optimize = optimize,
        }),
    });

    const profile_dir = if (optimize == .Debug) "debug" else "release";
    // REVM is built in workspace root, not with target triple subdirectory
    const lib_path = b.fmt("target/{s}/librevm_wrapper.a", .{profile_dir});

    lib.addObjectFile(b.path(lib_path));
    lib.linkLibC();
    lib.addIncludePath(b.path("lib/revm"));

    if (workspace_build_step) |build_step| {
        lib.step.dependOn(build_step);
    }

    return lib;
}

pub fn createRustBuildStep(
    b: *std.Build,
    optimize: std.builtin.OptimizeMode,
    rust_target: ?[]const u8,
) ?*std.Build.Step {
    if (rust_target == null) return null;

    const rust_cmd = b.addSystemCommand(&[_][]const u8{
        "cargo",     "build",
        "--profile", if (optimize == .Debug) "dev" else "release",
    });
    
    if (rust_target) |target_triple| {
        rust_cmd.addArgs(&[_][]const u8{ "--target", target_triple });
    }
    
    return &rust_cmd.step;
}