const std = @import("std");

pub fn createSpecsCli(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    modules: anytype,
    config_options_mod: *std.Build.Module,
    c_kzg_lib: *std.Build.Step.Compile,
    blst_lib: *std.Build.Step.Compile,
    bn254_lib: ?*std.Build.Step.Compile,
) void {
    const clap_dep = b.dependency("clap", .{ .target = target, .optimize = optimize });
    const specs_cli = b.addExecutable(.{
        .name = "specs-cli",
        .root_module = b.createModule(.{
            .root_source_file = b.path("specs/cli.zig"),
            .target = target,
            .optimize = optimize,
        }),
        .use_llvm = true,
    });

    specs_cli.root_module.addImport("clap", clap_dep.module("clap"));
    specs_cli.root_module.addImport("guillotine", modules.evm_mod);
    specs_cli.root_module.addImport("primitives", modules.primitives_mod);
    specs_cli.root_module.addImport("crypto", modules.crypto_mod);
    specs_cli.root_module.addImport("build_options", config_options_mod);

    specs_cli.linkLibrary(c_kzg_lib);
    specs_cli.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| specs_cli.linkLibrary(bn254);
    specs_cli.linkLibC();

    const install_specs_cli = b.addInstallArtifact(specs_cli, .{});
    const specs_cli_step = b.step("specs-cli", "Build the Ethereum specs test runner CLI");
    specs_cli_step.dependOn(&install_specs_cli.step);
}

pub fn createBunSpecsRunner(b: *std.Build) void {
    const bun_check = b.addSystemCommand(&[_][]const u8{ "which", "bun" });
    bun_check.addCheck(.{ .expect_stdout_match = "bun" });

    const run_bun_specs = b.addSystemCommand(&[_][]const u8{ "bun", "test" });
    run_bun_specs.setCwd(b.path("specs/bun-runner"));
    run_bun_specs.step.dependOn(&bun_check.step);

    // Add options for controlling the spec tests
    const spec_max_files = b.option([]const u8, "spec-max-files", "Maximum number of spec files to run (default: all)");
    const spec_isolated = b.option(bool, "spec-isolated", "Run tests in isolated mode to handle panics (default: true)") orelse true;
    const spec_pattern = b.option([]const u8, "spec-pattern", "Pattern to match test files (default: *.json)");
    const spec_args = b.option([]const []const u8, "spec-args", "Additional arguments to pass to bun test");

    // Set environment variables based on options
    if (spec_max_files) |max_files| {
        run_bun_specs.setEnvironmentVariable("MAX_SPEC_FILES", max_files);
    } else {
        run_bun_specs.setEnvironmentVariable("MAX_SPEC_FILES", "10000"); // Large number to run all
    }

    run_bun_specs.setEnvironmentVariable("RUN_ISOLATED", if (spec_isolated) "true" else "false");

    if (spec_pattern) |pattern| {
        run_bun_specs.setEnvironmentVariable("SPEC_PATTERN", pattern);
    }

    // Choose which test file to run based on isolation mode
    if (spec_isolated) {
        run_bun_specs.addArg("ethereum-specs-safe.test.ts");
    } else {
        run_bun_specs.addArg("ethereum-specs.test.ts");
    }

    // Add any additional arguments passed through
    if (spec_args) |args| {
        for (args) |arg| {
            run_bun_specs.addArg(arg);
        }
    }

    const bun_specs_step = b.step("specs", "Run Bun execution spec tests (use -Dspec-max-files=N, -Dspec-isolated=false, -Dspec-pattern='*.json', -Dspec-args for options)");
    bun_specs_step.dependOn(&run_bun_specs.step);
}