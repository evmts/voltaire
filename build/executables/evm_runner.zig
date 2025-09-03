const std = @import("std");

pub fn createEvmRunner(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    evm_mod: *std.Build.Module,
    primitives_mod: *std.Build.Module,
    c_kzg_lib: *std.Build.Step.Compile,
    blst_lib: *std.Build.Step.Compile,
    bn254_lib: ?*std.Build.Step.Compile,
    clap_dep: *std.Build.Dependency,
) *std.Build.Step.Compile {
    const exe = b.addExecutable(.{
        .name = "evm-runner",
        .root_module = b.createModule(.{
            .root_source_file = b.path("bench/evms/zig/src/main.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });
    
    exe.root_module.addImport("evm", evm_mod);
    exe.root_module.addImport("primitives", primitives_mod);
    exe.root_module.addImport("clap", clap_dep.module("clap"));
    exe.linkLibrary(c_kzg_lib);
    exe.linkLibrary(blst_lib);
    exe.linkLibC();
    
    if (bn254_lib) |bn254| {
        exe.linkLibrary(bn254);
        exe.addIncludePath(b.path("src/bn254_wrapper"));
    }

    b.installArtifact(exe);
    return exe;
}

pub fn createEvmRunnerSmall(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    evm_mod: *std.Build.Module,
    primitives_mod: *std.Build.Module,
    c_kzg_lib: *std.Build.Step.Compile,
    blst_lib: *std.Build.Step.Compile,
    bn254_lib: ?*std.Build.Step.Compile,
    clap_dep: *std.Build.Dependency,
) *std.Build.Step.Compile {
    const exe = b.addExecutable(.{
        .name = "evm-runner-small",
        .root_module = b.createModule(.{
            .root_source_file = b.path("bench/evms/zig/src/main.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });
    
    exe.root_module.addImport("evm", evm_mod);
    exe.root_module.addImport("primitives", primitives_mod);
    exe.root_module.addImport("clap", clap_dep.module("clap"));
    exe.linkLibrary(c_kzg_lib);
    exe.linkLibrary(blst_lib);
    exe.linkLibC();
    
    if (bn254_lib) |bn254| {
        exe.linkLibrary(bn254);
        exe.addIncludePath(b.path("src/bn254_wrapper"));
    }

    b.installArtifact(exe);
    return exe;
}

pub fn createRunSteps(b: *std.Build, exe: *std.Build.Step.Compile, exe_small: *std.Build.Step.Compile) void {
    const run_evm_runner_cmd = b.addRunArtifact(exe);
    if (b.args) |args| {
        run_evm_runner_cmd.addArgs(args);
    }

    const evm_runner_step = b.step("evm-runner", "Run the EVM benchmark runner");
    evm_runner_step.dependOn(&run_evm_runner_cmd.step);

    const build_evm_runner_step = b.step("build-evm-runner", "Build the EVM benchmark runner");
    build_evm_runner_step.dependOn(&b.addInstallArtifact(exe, .{}).step);

    const build_evm_runner_small_step = b.step("build-evm-runner-small", "Build the EVM benchmark runner (ReleaseSmall)");
    build_evm_runner_small_step.dependOn(&b.addInstallArtifact(exe_small, .{}).step);

    const release_step = b.step("release", "Build release artifacts (evm-runner, evm-runner-small)");
    release_step.dependOn(build_evm_runner_step);
    release_step.dependOn(build_evm_runner_small_step);
}