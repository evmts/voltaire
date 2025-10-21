const std = @import("std");
const lib_build = @import("lib/build.zig");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // Build crypto C libraries that primitives + crypto depend on
    const blst_lib = lib_build.BlstLib.createBlstLibrary(b, target, optimize);
    const c_kzg_lib = lib_build.CKzgLib.createCKzgLibrary(b, target, optimize, blst_lib);

    const bn254_lib = lib_build.Bn254Lib.createBn254Library(b, target, optimize, .{ .enable_tracy = false }, null, null);

    // Install crypto libraries
    b.installArtifact(blst_lib);
    b.installArtifact(c_kzg_lib);
    if (bn254_lib) |bn254| b.installArtifact(bn254);

    // Create c_kzg module for crypto tests
    const c_kzg_mod = b.addModule("c_kzg", .{
        .root_source_file = b.path("lib/c-kzg.zig"),
        .target = target,
        .optimize = optimize,
    });

    // Primitives tests
    const primitives_tests = b.addTest(.{
        .name = "primitives-tests",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/primitives/root.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });
    primitives_tests.linkLibrary(c_kzg_lib);
    primitives_tests.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| primitives_tests.linkLibrary(bn254);
    primitives_tests.linkLibC();

    // Crypto tests
    const crypto_mod = b.createModule(.{
        .root_source_file = b.path("src/crypto/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    crypto_mod.addImport("c_kzg", c_kzg_mod);

    const crypto_tests = b.addTest(.{
        .name = "crypto-tests",
        .root_module = crypto_mod,
    });
    crypto_tests.linkLibrary(c_kzg_lib);
    crypto_tests.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| crypto_tests.linkLibrary(bn254);
    crypto_tests.linkLibC();

    const run_primitives_tests = b.addRunArtifact(primitives_tests);
    const run_crypto_tests = b.addRunArtifact(crypto_tests);

    const test_step = b.step("test", "Run primitives and crypto tests");
    test_step.dependOn(&run_primitives_tests.step);
    test_step.dependOn(&run_crypto_tests.step);
}
