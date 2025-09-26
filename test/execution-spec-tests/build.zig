const std = @import("std");

pub fn createExecutionSpecTests(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    modules: anytype,
    c_kzg_lib: *std.Build.Step.Compile,
    blst_lib: *std.Build.Step.Compile,
    bn254_lib: ?*std.Build.Step.Compile,
    fetch_fixtures_step: *std.Build.Step,
) void {
    const spec_path = b.option([]const u8, "spec-path", "Path to specific test file or directory");

    // MinimalEvm version
    {
        const minimal_evm_options = b.addOptions();
        minimal_evm_options.addOption([]const u8, "runner_type", "minimal_evm");

        const exec_spec_tests = b.addExecutable(.{
            .name = "execution-spec-tests-minimal-evm",
            .root_module = b.createModule(.{
                .root_source_file = b.path("test/execution-spec-tests/main.zig"),
                .target = target,
                .optimize = optimize,
            }),
            .use_llvm = true,
        });

        // Add required imports
        exec_spec_tests.root_module.addImport("primitives", modules.primitives_mod);
        exec_spec_tests.root_module.addImport("crypto", modules.crypto_mod);
        exec_spec_tests.root_module.addImport("evm", modules.evm_mod);
        exec_spec_tests.root_module.addImport("build_options", minimal_evm_options.createModule());

        // Link libraries
        exec_spec_tests.linkLibrary(c_kzg_lib);
        exec_spec_tests.linkLibrary(blst_lib);
        if (bn254_lib) |bn254| exec_spec_tests.linkLibrary(bn254);
        exec_spec_tests.linkLibC();

        const run_exec_spec_tests = b.addRunArtifact(exec_spec_tests);

        // Make tests depend on fixture downloading
        run_exec_spec_tests.step.dependOn(fetch_fixtures_step);

        const exec_spec_step = b.step("test-execution-spec-minimal-evm", "Run execution spec tests with MinimalEvm");
        exec_spec_step.dependOn(&run_exec_spec_tests.step);

        // Backwards compatibility alias
        const exec_spec_alias = b.step("test-execution-spec", "Run execution spec tests with MinimalEvm (legacy alias)");
        exec_spec_alias.dependOn(&run_exec_spec_tests.step);

        // Use the shared spec-path option
        if (spec_path) |path| {
            run_exec_spec_tests.addArg(path);
        }
    }

    // Guillotine version
    {
        const guillotine_options = b.addOptions();
        guillotine_options.addOption([]const u8, "runner_type", "guillotine");

        const exec_spec_tests_main = b.addExecutable(.{
            .name = "execution-spec-tests-guillotine",
            .root_module = b.createModule(.{
                .root_source_file = b.path("test/execution-spec-tests/main.zig"),
                .target = target,
                .optimize = optimize,
            }),
            .use_llvm = true,
        });

        // Add required imports
        exec_spec_tests_main.root_module.addImport("primitives", modules.primitives_mod);
        exec_spec_tests_main.root_module.addImport("crypto", modules.crypto_mod);
        exec_spec_tests_main.root_module.addImport("evm", modules.evm_mod);
        exec_spec_tests_main.root_module.addImport("build_options", guillotine_options.createModule());

        // Link libraries
        exec_spec_tests_main.linkLibrary(c_kzg_lib);
        exec_spec_tests_main.linkLibrary(blst_lib);
        if (bn254_lib) |bn254| exec_spec_tests_main.linkLibrary(bn254);
        exec_spec_tests_main.linkLibC();

        const run_exec_spec_tests_main = b.addRunArtifact(exec_spec_tests_main);

        // Make tests depend on fixture downloading
        run_exec_spec_tests_main.step.dependOn(fetch_fixtures_step);

        const exec_spec_main_step = b.step("test-execution-spec-guillotine", "Run execution spec tests with Guillotine EVM");
        exec_spec_main_step.dependOn(&run_exec_spec_tests_main.step);

        // Use the shared spec-path option
        if (spec_path) |path| {
            run_exec_spec_tests_main.addArg(path);
        }
    }
}

pub fn createFetchFixturesStep(b: *std.Build) *std.Build.Step {
    const fetch_fixtures_step = b.step("fetch-test-fixtures", "Download Ethereum execution spec test fixtures");
    const fetch_fixtures_cmd = b.addSystemCommand(&.{ "python3", "scripts/fetch_test_fixtures.py" });
    fetch_fixtures_step.dependOn(&fetch_fixtures_cmd.step);
    return fetch_fixtures_step;
}