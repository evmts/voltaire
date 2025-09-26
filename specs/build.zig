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

