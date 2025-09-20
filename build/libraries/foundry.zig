const std = @import("std");

pub fn createFoundryLibrary(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    rust_build_step: ?*std.Build.Step,
    rust_target: ?[]const u8,
) ?*std.Build.Step.Compile {
    // Check if the Rust source exists
    std.fs.cwd().access("lib/foundry-compilers/src/lib.rs", .{}) catch {
        std.debug.print("Warning: foundry-compilers Rust source not found, skipping\n", .{});
        return null;
    };

    // Create a static library wrapper for Zig
    const foundry_lib = b.addLibrary(.{
        .name = "foundry_wrapper",
        .linkage = .static,
        .root_module = b.createModule(.{
            .root_source_file = null, // No Zig source, just linking Rust lib
            .target = target,
            .optimize = optimize,
        }),
    });

    // Determine the correct path based on target
    const rust_target_dir = if (rust_target) |target_triple|
        b.fmt("target/{s}/release", .{target_triple})
    else
        "target/release";

    // Add the Rust static library
    foundry_lib.addObjectFile(b.path(b.fmt("{s}/libfoundry_wrapper.a", .{rust_target_dir})));
    foundry_lib.addIncludePath(b.path("lib/foundry-compilers"));

    // Link necessary system libraries
    foundry_lib.linkLibC();
    if (target.result.os.tag == .linux) {
        foundry_lib.linkSystemLibrary("m");
        foundry_lib.linkSystemLibrary("pthread");
        foundry_lib.linkSystemLibrary("dl");
    } else if (target.result.os.tag == .macos) {
        foundry_lib.linkSystemLibrary("c++");
        foundry_lib.linkFramework("Security");
        foundry_lib.linkFramework("SystemConfiguration");
        foundry_lib.linkFramework("CoreFoundation");
    }

    // The rust_build_step should handle the workspace build
    // We just need to depend on it, not create our own cargo build
    if (rust_build_step) |step| {
        foundry_lib.step.dependOn(step);
    } else {
        // If no rust_build_step provided, create our own
        const cargo_build = b.addSystemCommand(&.{
            "cargo",
            "build",
            "--release",
            "--workspace",
        });

        if (rust_target) |target_triple| {
            cargo_build.addArg("--target");
            cargo_build.addArg(target_triple);
        }
        
        foundry_lib.step.dependOn(&cargo_build.step);
    }

    return foundry_lib;
}

pub fn createRustBuildStep(b: *std.Build, rust_target: ?[]const u8) *std.Build.Step {
    const rust_build = b.step("build-rust-workspace", "Build Rust workspace libraries");
    
    const cargo_build = b.addSystemCommand(&.{
        "cargo",
        "build",
        "--release",
        "--workspace",
    });
    
    if (rust_target) |target_triple| {
        cargo_build.addArg("--target");
        cargo_build.addArg(target_triple);
    }
    
    rust_build.dependOn(&cargo_build.step);
    return rust_build;
}