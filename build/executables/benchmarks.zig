const std = @import("std");

pub fn createDebugRunner(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    evm_mod: *std.Build.Module,
    primitives_mod: *std.Build.Module,
) ?*std.Build.Step.Compile {
    // Check if debug runner exists
    std.fs.cwd().access("bench/evms/zig/src/debug.zig", .{}) catch return null;
    
    const exe = b.addExecutable(.{
        .name = "debug-runner",
        .root_module = b.createModule(.{
            .root_source_file = b.path("bench/evms/zig/src/debug.zig"),
            .target = target,
            .optimize = .Debug,
        }),
        // Force LLVM backend: native Zig backend on Linux x86 doesn't support tail calls yet
        .use_llvm = true,
    });
    
    exe.root_module.addImport("evm", evm_mod);
    exe.root_module.addImport("primitives", primitives_mod);
    
    b.installArtifact(exe);
    return exe;
}

pub fn createCrashDebugger(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    evm_mod: *std.Build.Module,
    primitives_mod: *std.Build.Module,
) ?*std.Build.Step.Compile {
    // Check if crash debug exists
    std.fs.cwd().access("src/crash-debug.zig", .{}) catch return null;
    
    const exe = b.addExecutable(.{
        .name = "crash-debug",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/crash-debug.zig"),
            .target = target,
        }),
        // Force LLVM backend: native Zig backend on Linux x86 doesn't support tail calls yet
        .use_llvm = true,
    });
    
    exe.root_module.addImport("evm", evm_mod);
    exe.root_module.addImport("primitives", primitives_mod);
    
    b.installArtifact(exe);
    return exe;
}

pub fn createSimpleCrashTest(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    evm_mod: *std.Build.Module,
    primitives_mod: *std.Build.Module,
) ?*std.Build.Step.Compile {
    // Check if simple crash test exists
    std.fs.cwd().access("src/simple-crash-test.zig", .{}) catch return null;
    
    const exe = b.addExecutable(.{
        .name = "simple-crash-test",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/simple-crash-test.zig"),
            .target = target,
            .optimize = .Debug,
        }),
        // Force LLVM backend: native Zig backend on Linux x86 doesn't support tail calls yet
        .use_llvm = true,
    });
    
    exe.root_module.addImport("evm", evm_mod);
    exe.root_module.addImport("primitives", primitives_mod);
    
    b.installArtifact(exe);
    return exe;
}

pub fn createPoopRunner(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    build_evm_runner_step: *std.Build.Step,
) *std.Build.Step.Compile {
    const exe = b.addExecutable(.{
        .name = "poop-runner",
        .root_module = b.createModule(.{
            .root_source_file = b.path("bench/poop_runner.zig"),
            .target = target,
            .optimize = .ReleaseFast,
        }),
        // Force LLVM backend: native Zig backend on Linux x86 doesn't support tail calls yet
        .use_llvm = true,
    });

    b.installArtifact(exe);
    
    const run_poop_cmd = b.addRunArtifact(exe);
    run_poop_cmd.step.dependOn(build_evm_runner_step);
    if (b.args) |args| {
        run_poop_cmd.addArgs(args);
    }

    const poop_step = b.step("poop", "Run poop benchmark on snailtracer (Linux only)");
    poop_step.dependOn(&run_poop_cmd.step);
    
    return exe;
}

pub fn createOrchestrator(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    clap_dep: *std.Build.Dependency,
) *std.Build.Step.Compile {
    const exe = b.addExecutable(.{
        .name = "orchestrator",
        .root_module = b.createModule(.{
            .root_source_file = b.path("bench/src/main.zig"),
            .target = target,
            .optimize = .ReleaseFast,
        }),
        // Force LLVM backend: native Zig backend on Linux x86 doesn't support tail calls yet
        .use_llvm = true,
    });
    
    exe.root_module.addImport("clap", clap_dep.module("clap"));
    b.installArtifact(exe);

    const run_orchestrator_cmd = b.addRunArtifact(exe);
    if (b.args) |args| {
        run_orchestrator_cmd.addArgs(args);
    }

    const orchestrator_step = b.step("orchestrator", "Run the benchmark orchestrator");
    orchestrator_step.dependOn(&run_orchestrator_cmd.step);

    const build_orchestrator_step = b.step("build-orchestrator", "Build the benchmark orchestrator (ReleaseFast)");
    build_orchestrator_step.dependOn(&b.addInstallArtifact(exe, .{}).step);
    
    return exe;
}

pub fn createBenchmarkSteps(
    debug_runner: ?*std.Build.Step.Compile,
    crash_debugger: ?*std.Build.Step.Compile,
    simple_crash_test: ?*std.Build.Step.Compile,
    b: *std.Build,
) void {
    if (debug_runner) |exe| {
        const build_debug_runner_step = b.step("build-debug-runner", "Build the debug EVM runner");
        build_debug_runner_step.dependOn(&b.addInstallArtifact(exe, .{}).step);
    }
    
    if (crash_debugger) |exe| {
        const run_crash_debug_cmd = b.addRunArtifact(exe);
        const crash_debug_step = b.step("crash-debug", "Run crash debugging tool");
        crash_debug_step.dependOn(&run_crash_debug_cmd.step);
    }
    
    if (simple_crash_test) |exe| {
        const run_simple_crash_test_cmd = b.addRunArtifact(exe);
        const simple_crash_test_step = b.step("simple-crash-test", "Run simple crash test");
        simple_crash_test_step.dependOn(&run_simple_crash_test_cmd.step);
    }
}