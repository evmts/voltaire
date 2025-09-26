const std = @import("std");
const build_pkg = @import("build/main.zig");
const lib_build = @import("lib/build.zig");
const kzg_build = @import("src/kzg/build.zig");

// Import build modules from their locations
const TestsBuild = @import("test/build.zig");
const SpecsBuild = @import("specs/build.zig");
const BenchmarksBuild = @import("benchmarks/build.zig");
const ScriptsBuild = @import("scripts/build.zig");

pub fn build(b: *std.Build) void {
    lib_build.checkSubmodules();

    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const test_filters = b.option(
        []const []const u8,
        "test-filter",
        "Filter for tests. Only applies to Zig tests. Example: -Dtest-filter='trace validation'",
    ) orelse &[0][]const u8{};

    kzg_build.ensureTrustedSetup(b);

    const config = build_pkg.Config.createBuildOptions(b, target);
    const rust_target = build_pkg.Config.getRustTarget(target);

    const zbench_dep = b.dependency("zbench", .{ .target = target, .optimize = optimize });

    // Build libraries
    const blst_lib = lib_build.createBlstLibrary(b, target, optimize);
    b.installArtifact(blst_lib);
    const c_kzg_lib = lib_build.createCKzgLibrary(b, target, optimize, blst_lib);
    b.installArtifact(c_kzg_lib);
    const rust_build_step = lib_build.createRustBuildStep(b, rust_target, optimize);
    const bn254_lib = lib_build.createBn254Library(b, target, optimize, config.options, rust_build_step, rust_target);
    if (bn254_lib) |bn254| b.installArtifact(bn254);
    const foundry_lib = lib_build.createFoundryLibrary(b, target, optimize, rust_build_step, rust_target);

    // Create modules
    const modules = build_pkg.Modules.createModules(b, target, optimize, config.options_mod, zbench_dep, c_kzg_lib, blst_lib, bn254_lib, foundry_lib);

    // Main executable
    const guillotine_exe = build_pkg.GuillotineExe.createExecutable(b, modules.exe_mod);
    _ = build_pkg.GuillotineExe.createRunStep(b, guillotine_exe);

    // Asset generation for devtool
    const npm_check = b.addSystemCommand(&[_][]const u8{ "which", "npm" });
    npm_check.addCheck(.{ .expect_stdout_match = "npm" });

    const npm_install = b.addSystemCommand(&[_][]const u8{ "npm", "install" });
    npm_install.setCwd(b.path("apps/devtool"));
    npm_install.step.dependOn(&npm_check.step);

    const npm_build = b.addSystemCommand(&[_][]const u8{ "npm", "run", "build" });
    npm_build.setCwd(b.path("apps/devtool"));
    npm_build.step.dependOn(&npm_install.step);

    const asset_generator = build_pkg.AssetGenerator;
    const generate_assets = asset_generator.GenerateAssetsStep.init(b, "apps/devtool/dist", "apps/devtool/assets.zig");
    generate_assets.step.dependOn(&npm_build.step);

    const devtool_exe = build_pkg.DevtoolExe.createDevtoolExecutable(b, target, optimize, modules.lib_mod, modules.evm_mod, modules.primitives_mod, modules.provider_mod, &generate_assets.step);
    build_pkg.DevtoolExe.createDevtoolSteps(b, devtool_exe, target);

    // Shared library for FFI bindings
    const shared_lib_mod = b.createModule(.{
        .root_source_file = b.path("src/evm_c_api.zig"),
        .target = target,
        .optimize = optimize,
    });
    shared_lib_mod.addImport("evm", modules.evm_mod);
    shared_lib_mod.addImport("primitives", modules.primitives_mod);
    shared_lib_mod.addImport("crypto", modules.crypto_mod);
    shared_lib_mod.addImport("build_options", config.options_mod);

    const shared_lib = b.addLibrary(.{
        .name = "guillotine_ffi",
        .linkage = .dynamic,
        .root_module = shared_lib_mod,
        .use_llvm = true,
    });
    shared_lib.linkLibrary(c_kzg_lib);
    shared_lib.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| shared_lib.linkLibrary(bn254);
    shared_lib.linkLibC();
    // Export all symbols for Linux to ensure BLS symbols are available
    shared_lib.rdynamic = true;

    b.installArtifact(shared_lib);

    const shared_lib_step = b.step("shared", "Build shared library for FFI");
    shared_lib_step.dependOn(&b.addInstallArtifact(shared_lib, .{}).step);

    // Organize library references for tests (needs shared_lib)
    const test_libs = .{
        .c_kzg_lib = c_kzg_lib,
        .blst_lib = blst_lib,
        .bn254_lib = bn254_lib,
        .shared_lib = shared_lib,
    };

    // Tests - delegated to test/build.zig
    TestsBuild.createAllTests(b, target, optimize, modules, config, test_libs, test_filters);

    // Benchmarks - delegated to benchmarks/build.zig (only needs part of libs)
    const benchmark_libs = .{
        .c_kzg_lib = c_kzg_lib,
        .blst_lib = blst_lib,
        .bn254_lib = bn254_lib,
    };
    BenchmarksBuild.createBenchmarks(b, target, optimize, modules, config.options_mod, benchmark_libs, zbench_dep);

    // Scripts/Tools - delegated to scripts/build.zig
    ScriptsBuild.createAnalyzerTools(b, target, optimize, modules);

    // Specs CLI - delegated to specs/build.zig
    SpecsBuild.createSpecsCli(b, target, optimize, modules, config.options_mod, c_kzg_lib, blst_lib, bn254_lib);
    // Note: createBunSpecsRunner is now called from test/build.zig to include in test step

    // Language bindings - create build steps
    const wasm_step = build_pkg.WasmBindings.createWasmSteps(b, optimize, config.options_mod);
    const python_step = build_pkg.PythonBindings.createPythonSteps(b);
    const go_step = build_pkg.GoBindings.createGoSteps(b);
    const ts_step = build_pkg.TypeScriptBindings.createTypeScriptSteps(b);
    const bun_step = build_pkg.BunBindings.createBunSteps(b);
    const cli_step = build_pkg.CliExe.createCliSteps(b);

    // Create an 'all' step that builds everything including SDKs
    const all_step = b.step("all", "Build everything including all SDKs and apps");
    all_step.dependOn(b.getInstallStep());
    all_step.dependOn(wasm_step);
    all_step.dependOn(python_step);
    all_step.dependOn(go_step);
    all_step.dependOn(ts_step);
    all_step.dependOn(bun_step);
    all_step.dependOn(cli_step);
}