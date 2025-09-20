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
        // Force LLVM backend: native Zig backend on Linux x86 doesn't support tail calls yet
        .use_llvm = true,
    });
    
    exe.root_module.addImport("evm", evm_mod);
    exe.root_module.addImport("primitives", primitives_mod);
    exe.root_module.addImport("clap", clap_dep.module("clap"));
    exe.linkLibrary(c_kzg_lib);
    exe.linkLibrary(blst_lib);
    exe.linkLibC();
    
    if (bn254_lib) |bn254| {
        exe.linkLibrary(bn254);
        exe.addIncludePath(b.path("lib/ark"));
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
        // Force LLVM backend: native Zig backend on Linux x86 doesn't support tail calls yet
        .use_llvm = true,
    });
    
    exe.root_module.addImport("evm", evm_mod);
    exe.root_module.addImport("primitives", primitives_mod);
    exe.root_module.addImport("clap", clap_dep.module("clap"));
    exe.linkLibrary(c_kzg_lib);
    exe.linkLibrary(blst_lib);
    exe.linkLibC();
    
    if (bn254_lib) |bn254| {
        exe.linkLibrary(bn254);
        exe.addIncludePath(b.path("lib/ark"));
    }

    b.installArtifact(exe);
    return exe;
}

pub fn createTestStep(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    evm_mod: *std.Build.Module,
    primitives_mod: *std.Build.Module,
    c_kzg_lib: *std.Build.Step.Compile,
    blst_lib: *std.Build.Step.Compile,
    bn254_lib: ?*std.Build.Step.Compile,
) *std.Build.Step {
    const test_exe = b.addTest(.{
        .root_module = b.createModule(.{
            .root_source_file = b.path("bench/evms/zig/src/test_runner.zig"),
            .target = target,
            .optimize = optimize,
        }),
        // Force LLVM backend: native Zig backend on Linux x86 doesn't support tail calls yet
        .use_llvm = true,
    });
    
    // Add the Runner module
    const runner_mod = b.createModule(.{
        .root_source_file = b.path("bench/evms/zig/src/Runner.zig"),
    });
    runner_mod.addImport("evm", evm_mod);
    runner_mod.addImport("primitives", primitives_mod);
    
    test_exe.root_module.addImport("Runner", runner_mod);
    test_exe.root_module.addImport("evm", evm_mod);
    test_exe.root_module.addImport("primitives", primitives_mod);
    
    test_exe.linkLibrary(c_kzg_lib);
    test_exe.linkLibrary(blst_lib);
    test_exe.linkLibC();
    
    if (bn254_lib) |bn254| {
        test_exe.linkLibrary(bn254);
        test_exe.addIncludePath(b.path("lib/ark"));
    }
    
    const test_step = b.step("test-runner", "Run EVM runner tests");
    test_step.dependOn(&b.addRunArtifact(test_exe).step);
    
    return test_step;
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