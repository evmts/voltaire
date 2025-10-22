const std = @import("std");
const lib_build = @import("lib/build.zig");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // STEP 1: Verify all required submodules are initialized
    lib_build.checkSubmodules();

    // STEP 2: Verify Cargo is installed for Rust dependencies
    lib_build.checkCargoInstalled();

    // STEP 3: Build Rust workspace (bn254_wrapper, keccak_wrapper)
    const cargo_build_step = lib_build.createCargoBuildStep(b, optimize);

    // Build crypto C/Rust libraries that primitives + crypto depend on
    const blst_lib = lib_build.BlstLib.createBlstLibrary(b, target, optimize);
    const c_kzg_lib = lib_build.CKzgLib.createCKzgLibrary(b, target, optimize, blst_lib);
    const bn254_lib = lib_build.Bn254Lib.createBn254Library(b, target, optimize, .{ .enable_tracy = false }, cargo_build_step, null);
    const keccak_lib = lib_build.KeccakLib.createKeccakLibrary(b, target, optimize, .{}, cargo_build_step, null);

    // Install crypto libraries
    b.installArtifact(blst_lib);
    b.installArtifact(c_kzg_lib);
    if (bn254_lib) |bn254| b.installArtifact(bn254);
    if (keccak_lib) |keccak| b.installArtifact(keccak);

    // Create c_kzg module for crypto tests
    const c_kzg_mod = b.addModule("c_kzg", .{
        .root_source_file = b.path("lib/c-kzg.zig"),
        .target = target,
        .optimize = optimize,
    });

    // Primitives module (includes Hardfork)
    const primitives_mod = b.createModule(.{
        .root_source_file = b.path("src/primitives/root.zig"),
        .target = target,
        .optimize = optimize,
    });

    // Primitives tests
    const primitives_tests = b.addTest(.{
        .name = "primitives-tests",
        .root_module = primitives_mod,
    });
    primitives_tests.linkLibrary(c_kzg_lib);
    primitives_tests.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| primitives_tests.linkLibrary(bn254);
    if (keccak_lib) |keccak| primitives_tests.linkLibrary(keccak);
    primitives_tests.linkLibC();

    // Crypto tests (Hardfork accessed through primitives module)
    const crypto_mod = b.createModule(.{
        .root_source_file = b.path("src/crypto/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    crypto_mod.addImport("c_kzg", c_kzg_mod);
    crypto_mod.addImport("primitives", primitives_mod);

    const crypto_tests = b.addTest(.{
        .name = "crypto-tests",
        .root_module = crypto_mod,
    });
    crypto_tests.linkLibrary(c_kzg_lib);
    crypto_tests.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| crypto_tests.linkLibrary(bn254);
    if (keccak_lib) |keccak| crypto_tests.linkLibrary(keccak);
    crypto_tests.linkLibC();

    // Precompiles module
    const precompiles_mod = b.createModule(.{
        .root_source_file = b.path("src/precompiles/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    precompiles_mod.addImport("primitives", primitives_mod);
    precompiles_mod.addImport("crypto", crypto_mod);

    const precompiles_tests = b.addTest(.{
        .name = "precompiles-tests",
        .root_module = precompiles_mod,
    });
    precompiles_tests.linkLibrary(c_kzg_lib);
    precompiles_tests.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| precompiles_tests.linkLibrary(bn254);
    if (keccak_lib) |keccak| precompiles_tests.linkLibrary(keccak);
    precompiles_tests.linkLibC();

    const run_primitives_tests = b.addRunArtifact(primitives_tests);
    const run_crypto_tests = b.addRunArtifact(crypto_tests);
    const run_precompiles_tests = b.addRunArtifact(precompiles_tests);

    const test_step = b.step("test", "Run all tests (primitives + crypto + precompiles)");
    test_step.dependOn(&run_primitives_tests.step);
    test_step.dependOn(&run_crypto_tests.step);
    test_step.dependOn(&run_precompiles_tests.step);

    // Example: Keccak-256 hashing demonstration
    const keccak256_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/keccak256.zig"),
        .target = target,
        .optimize = optimize,
    });
    keccak256_example_mod.addImport("crypto", crypto_mod);

    const keccak256_example = b.addExecutable(.{
        .name = "keccak256_example",
        .root_module = keccak256_example_mod,
    });
    keccak256_example.linkLibrary(c_kzg_lib);
    keccak256_example.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| keccak256_example.linkLibrary(bn254);
    if (keccak_lib) |keccak| keccak256_example.linkLibrary(keccak);
    keccak256_example.linkLibC();

    const run_keccak256_example = b.addRunArtifact(keccak256_example);
    const example_keccak256_step = b.step("example-keccak256", "Run the Keccak-256 hashing example");
    example_keccak256_step.dependOn(&run_keccak256_example.step);
}

    // secp256k1 ECDSA signature operations example
    const secp256k1_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/secp256k1.zig"),
        .target = target,
        .optimize = optimize,
    });
    secp256k1_example_mod.addImport("crypto", crypto_mod);
    secp256k1_example_mod.addImport("primitives", primitives_mod);

    const secp256k1_example = b.addExecutable(.{
        .name = "secp256k1_example",
        .root_module = secp256k1_example_mod,
    });
    secp256k1_example.linkLibrary(c_kzg_lib);
    secp256k1_example.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| secp256k1_example.linkLibrary(bn254);
    if (keccak_lib) |keccak| secp256k1_example.linkLibrary(keccak);
    secp256k1_example.linkLibC();

    const run_secp256k1_example = b.addRunArtifact(secp256k1_example);
    const example_secp256k1_step = b.step("example-secp256k1", "Run the secp256k1 ECDSA signature operations example");
    example_secp256k1_step.dependOn(&run_secp256k1_example.step);
}
