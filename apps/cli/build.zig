const std = @import("std");

pub fn createCliSteps(b: *std.Build) *std.Build.Step {
    // Build the Go CLI binary
    const cli_build_cmd = b.addSystemCommand(&[_][]const u8{
        "go", "build", "-o", "guillotine-cli", ".",
    });
    cli_build_cmd.setCwd(b.path("apps/cli"));

    // The Go CLI depends on the FFI library being built
    cli_build_cmd.step.dependOn(b.getInstallStep());

    const cli_build_step = b.step("cli", "Build the Guillotine CLI");
    cli_build_step.dependOn(&cli_build_cmd.step);

    // Install the CLI binary to zig-out/bin
    const cli_install_cmd = b.addSystemCommand(&[_][]const u8{
        "cp", "apps/cli/guillotine-cli", "zig-out/bin/guillotine-cli",
    });
    cli_install_cmd.step.dependOn(&cli_build_cmd.step);

    const cli_install_step = b.step("cli-install", "Install the Guillotine CLI to zig-out/bin");
    cli_install_step.dependOn(&cli_install_cmd.step);

    // Test the CLI
    const cli_test_cmd = b.addSystemCommand(&[_][]const u8{
        "go", "test", "./...", "-v",
    });
    cli_test_cmd.setCwd(b.path("apps/cli"));
    cli_test_cmd.step.dependOn(&cli_build_cmd.step);

    const cli_test_step = b.step("cli-test", "Test the Guillotine CLI");
    cli_test_step.dependOn(&cli_test_cmd.step);

    // Clean the CLI build artifacts
    const cli_clean_cmd = b.addSystemCommand(&[_][]const u8{
        "rm", "-f", "apps/cli/guillotine-cli",
    });

    const cli_clean_step = b.step("cli-clean", "Clean CLI build artifacts");
    cli_clean_step.dependOn(&cli_clean_cmd.step);

    // Development mode - build and run with live reload
    const cli_dev_cmd = b.addSystemCommand(&[_][]const u8{
        "go", "run", ".",
    });
    cli_dev_cmd.setCwd(b.path("apps/cli"));
    cli_dev_cmd.step.dependOn(b.getInstallStep());

    const cli_dev_step = b.step("cli-dev", "Run CLI in development mode");
    cli_dev_step.dependOn(&cli_dev_cmd.step);

    // Format the Go code
    const cli_fmt_cmd = b.addSystemCommand(&[_][]const u8{
        "go", "fmt", "./...",
    });
    cli_fmt_cmd.setCwd(b.path("apps/cli"));

    const cli_fmt_step = b.step("cli-fmt", "Format CLI Go code");
    cli_fmt_step.dependOn(&cli_fmt_cmd.step);

    // Lint the Go code
    const cli_lint_cmd = b.addSystemCommand(&[_][]const u8{
        "golangci-lint", "run",
    });
    cli_lint_cmd.setCwd(b.path("apps/cli"));

    const cli_lint_step = b.step("cli-lint", "Lint CLI Go code");
    cli_lint_step.dependOn(&cli_lint_cmd.step);

    // Update Go dependencies
    const cli_deps_cmd = b.addSystemCommand(&[_][]const u8{
        "go", "mod", "tidy",
    });
    cli_deps_cmd.setCwd(b.path("apps/cli"));

    const cli_deps_step = b.step("cli-deps", "Update CLI Go dependencies");
    cli_deps_step.dependOn(&cli_deps_cmd.step);

    // Release build - optimized binary with version info
    const cli_release_cmd = b.addSystemCommand(&[_][]const u8{
        "go",
        "build",
        "-o",
        "zig-out/bin/guil",
        "-trimpath",
        "-ldflags=-s -w",
        ".",
    });
    cli_release_cmd.setCwd(b.path("apps/cli"));
    cli_release_cmd.step.dependOn(b.getInstallStep());

    const cli_release_step = b.step("cli-release", "Build optimized release binary");
    cli_release_step.dependOn(&cli_release_cmd.step);

    // GoReleaser build (for testing release configuration locally)
    const cli_goreleaser_snapshot_cmd = b.addSystemCommand(&[_][]const u8{
        "goreleaser", "release", "--snapshot", "--clean", "--skip=publish",
    });
    cli_goreleaser_snapshot_cmd.setCwd(b.path("apps/cli"));
    cli_goreleaser_snapshot_cmd.step.dependOn(b.getInstallStep());

    const cli_goreleaser_step = b.step("cli-goreleaser-test", "Test GoReleaser configuration locally");
    cli_goreleaser_step.dependOn(&cli_goreleaser_snapshot_cmd.step);

    // Return the main build step
    return cli_build_step;
}

// Helper to create the CLI executable with proper library paths
pub fn createCliExecutable(
    b: *std.Build,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
) void {
    _ = target;
    _ = optimize;

    // Set up environment for building the Go CLI
    const cli_env_setup = b.addSystemCommand(&[_][]const u8{
        "sh", "-c",
        \\if [[ "$OSTYPE" == "darwin"* ]]; then
        \\    export DYLD_LIBRARY_PATH="${PWD}/zig-out/lib:${DYLD_LIBRARY_PATH}"
        \\else
        \\    export LD_LIBRARY_PATH="${PWD}/zig-out/lib:${LD_LIBRARY_PATH}"
        \\fi
    });

    const cli_build_cmd = b.addSystemCommand(&[_][]const u8{
        "go", "build",
        "-o", "zig-out/bin/guillotine-cli",
        "./apps/cli",
    });
    cli_build_cmd.step.dependOn(&cli_env_setup.step);
    cli_build_cmd.step.dependOn(b.getInstallStep());

    const cli_step = b.step("cli-build", "Build and install the Guillotine CLI");
    cli_step.dependOn(&cli_build_cmd.step);
}