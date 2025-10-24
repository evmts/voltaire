const std = @import("std");
const lib_build = @import("lib/build.zig");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // STEP 1: Verify vendored dependencies exist
    lib_build.checkVendoredDeps();

    // STEP 2: Verify Cargo is installed for Rust dependencies
    lib_build.checkCargoInstalled();

    // STEP 3: Build Rust crate (crypto_wrappers: bn254 + keccak FFI)
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

    // Crypto tests (Hardfork accessed through primitives module)
    const crypto_mod = b.createModule(.{
        .root_source_file = b.path("src/crypto/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    crypto_mod.addImport("c_kzg", c_kzg_mod);

    // Primitives module (includes Hardfork)
    const primitives_mod = b.createModule(.{
        .root_source_file = b.path("src/primitives/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    primitives_mod.addImport("crypto", crypto_mod);

    // Now add primitives to crypto (circular dependency resolved by Zig's lazy evaluation)
    crypto_mod.addImport("primitives", primitives_mod);

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

    // Crypto tests
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

    // ABI encoding/decoding example
    const abi_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/abi.zig"),
        .target = target,
        .optimize = optimize,
    });
    abi_example_mod.addImport("primitives", primitives_mod);

    const abi_example = b.addExecutable(.{
        .name = "abi_example",
        .root_module = abi_example_mod,
    });
    abi_example.linkLibrary(c_kzg_lib);
    abi_example.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| abi_example.linkLibrary(bn254);
    if (keccak_lib) |keccak| abi_example.linkLibrary(keccak);
    abi_example.linkLibC();

    const run_abi_example = b.addRunArtifact(abi_example);
    const example_abi_step = b.step("example-abi", "Run the ABI encoding/decoding example");
    example_abi_step.dependOn(&run_abi_example.step);

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

    // Address primitive example
    const address_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/address.zig"),
        .target = target,
        .optimize = optimize,
    });
    address_example_mod.addImport("primitives", primitives_mod);

    const address_example = b.addExecutable(.{
        .name = "address_example",
        .root_module = address_example_mod,
    });
    address_example.linkLibrary(c_kzg_lib);
    address_example.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| address_example.linkLibrary(bn254);
    if (keccak_lib) |keccak| address_example.linkLibrary(keccak);
    address_example.linkLibC();

    const run_address_example = b.addRunArtifact(address_example);
    const example_address_step = b.step("example-address", "Run the Address primitive example");
    example_address_step.dependOn(&run_address_example.step);

    // Hex utilities example
    const hex_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/hex.zig"),
        .target = target,
        .optimize = optimize,
    });
    hex_example_mod.addImport("primitives", primitives_mod);

    const hex_example = b.addExecutable(.{
        .name = "hex_example",
        .root_module = hex_example_mod,
    });
    hex_example.linkLibrary(c_kzg_lib);
    hex_example.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| hex_example.linkLibrary(bn254);
    if (keccak_lib) |keccak| hex_example.linkLibrary(keccak);
    hex_example.linkLibC();

    const run_hex_example = b.addRunArtifact(hex_example);
    const example_hex_step = b.step("example-hex", "Run the Hex utilities example");
    example_hex_step.dependOn(&run_hex_example.step);

    // RLP encoding/decoding example
    const rlp_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/rlp.zig"),
        .target = target,
        .optimize = optimize,
    });
    rlp_example_mod.addImport("primitives", primitives_mod);

    const rlp_example = b.addExecutable(.{
        .name = "rlp_example",
        .root_module = rlp_example_mod,
    });
    rlp_example.linkLibrary(c_kzg_lib);
    rlp_example.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| rlp_example.linkLibrary(bn254);
    if (keccak_lib) |keccak| rlp_example.linkLibrary(keccak);
    rlp_example.linkLibC();

    const run_rlp_example = b.addRunArtifact(rlp_example);
    const example_rlp_step = b.step("example-rlp", "Run the RLP encoding/decoding example");
    example_rlp_step.dependOn(&run_rlp_example.step);

    // EIP-712 typed data signing example
    const eip712_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/eip712.zig"),
        .target = target,
        .optimize = optimize,
    });
    eip712_example_mod.addImport("crypto", crypto_mod);
    eip712_example_mod.addImport("primitives", primitives_mod);

    const eip712_example = b.addExecutable(.{
        .name = "eip712_example",
        .root_module = eip712_example_mod,
    });
    eip712_example.linkLibrary(c_kzg_lib);
    eip712_example.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| eip712_example.linkLibrary(bn254);
    if (keccak_lib) |keccak| eip712_example.linkLibrary(keccak);
    eip712_example.linkLibC();

    const run_eip712_example = b.addRunArtifact(eip712_example);
    const example_eip712_step = b.step("example-eip712", "Run the EIP-712 typed data signing example");
    example_eip712_step.dependOn(&run_eip712_example.step);

    // Transaction operations example
    const transaction_example_mod = b.createModule(.{
        .root_source_file = b.path("examples/transaction.zig"),
        .target = target,
        .optimize = optimize,
    });
    transaction_example_mod.addImport("primitives", primitives_mod);
    transaction_example_mod.addImport("crypto", crypto_mod);

    const transaction_example = b.addExecutable(.{
        .name = "transaction_example",
        .root_module = transaction_example_mod,
    });
    transaction_example.linkLibrary(c_kzg_lib);
    transaction_example.linkLibrary(blst_lib);
    if (bn254_lib) |bn254| transaction_example.linkLibrary(bn254);
    if (keccak_lib) |keccak| transaction_example.linkLibrary(keccak);
    transaction_example.linkLibC();

    const run_transaction_example = b.addRunArtifact(transaction_example);
    const example_transaction_step = b.step("example-transaction", "Run the transaction operations example");
    example_transaction_step.dependOn(&run_transaction_example.step);
}
