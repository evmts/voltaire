const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // Create primitives module
    const primitives_module = b.createModule(.{
        .root_source_file = b.path("../src/primitives/root.zig"),
    });

    // Create address module
    const address_module = b.createModule(.{
        .root_source_file = b.path("../src/primitives/address/address.zig"),
    });

    // Create RLP module
    const rlp_module = b.createModule(.{
        .root_source_file = b.path("../src/primitives/rlp/rlp.zig"),
    });

    // Add imports to primitives module
    primitives_module.addImport("Address", address_module);
    primitives_module.addImport("Rlp", rlp_module);

    // Add RLP to address module
    address_module.addImport("Rlp", rlp_module);

    // Hash example
    const hash_exe = b.addExecutable(.{
        .name = "hash_example",
        .root_source_file = b.path("hash_example.zig"),
        .target = target,
        .optimize = optimize,
    });

    hash_exe.root_module.addImport("primitives", primitives_module);
    b.installArtifact(hash_exe);

    const hash_cmd = b.addRunArtifact(hash_exe);
    hash_cmd.step.dependOn(b.getInstallStep());
    if (b.args) |args| {
        hash_cmd.addArgs(args);
    }

    const hash_step = b.step("hash", "Run the hash example");
    hash_step.dependOn(&hash_cmd.step);

    // Hex example
    const hex_exe = b.addExecutable(.{
        .name = "hex_example",
        .root_source_file = b.path("hex_example.zig"),
        .target = target,
        .optimize = optimize,
    });

    hex_exe.root_module.addImport("primitives", primitives_module);
    b.installArtifact(hex_exe);

    const hex_cmd = b.addRunArtifact(hex_exe);
    hex_cmd.step.dependOn(b.getInstallStep());
    if (b.args) |args| {
        hex_cmd.addArgs(args);
    }

    const hex_step = b.step("hex", "Run the hex example");
    hex_step.dependOn(&hex_cmd.step);

    // Numeric example
    const numeric_exe = b.addExecutable(.{
        .name = "numeric_example",
        .root_source_file = b.path("numeric_example.zig"),
        .target = target,
        .optimize = optimize,
    });

    numeric_exe.root_module.addImport("primitives", primitives_module);
    b.installArtifact(numeric_exe);

    const numeric_cmd = b.addRunArtifact(numeric_exe);
    numeric_cmd.step.dependOn(b.getInstallStep());
    if (b.args) |args| {
        numeric_cmd.addArgs(args);
    }

    const numeric_step = b.step("numeric", "Run the numeric example");
    numeric_step.dependOn(&numeric_cmd.step);

    // ABI example
    const abi_exe = b.addExecutable(.{
        .name = "abi_example",
        .root_source_file = b.path("abi_example.zig"),
        .target = target,
        .optimize = optimize,
    });

    abi_exe.root_module.addImport("primitives", primitives_module);
    b.installArtifact(abi_exe);

    const abi_cmd = b.addRunArtifact(abi_exe);
    abi_cmd.step.dependOn(b.getInstallStep());
    if (b.args) |args| {
        abi_cmd.addArgs(args);
    }

    const abi_step = b.step("abi", "Run the ABI example");
    abi_step.dependOn(&abi_cmd.step);

    // Simple ABI test
    const simple_abi_exe = b.addExecutable(.{
        .name = "simple_abi_test",
        .root_source_file = b.path("simple_abi_test.zig"),
        .target = target,
        .optimize = optimize,
    });

    simple_abi_exe.root_module.addImport("primitives", primitives_module);
    b.installArtifact(simple_abi_exe);

    const simple_abi_cmd = b.addRunArtifact(simple_abi_exe);
    simple_abi_cmd.step.dependOn(b.getInstallStep());
    if (b.args) |args| {
        simple_abi_cmd.addArgs(args);
    }

    const simple_abi_step = b.step("simple_abi", "Run the simple ABI test");
    simple_abi_step.dependOn(&simple_abi_cmd.step);

    // Simple crypto example
    const simple_crypto_exe = b.addExecutable(.{
        .name = "simple_crypto_test",
        .root_source_file = b.path("simple_crypto_test.zig"),
        .target = target,
        .optimize = optimize,
    });

    simple_crypto_exe.root_module.addImport("primitives", primitives_module);
    b.installArtifact(simple_crypto_exe);

    const simple_crypto_cmd = b.addRunArtifact(simple_crypto_exe);
    simple_crypto_cmd.step.dependOn(b.getInstallStep());
    if (b.args) |args| {
        simple_crypto_cmd.addArgs(args);
    }

    const simple_crypto_step = b.step("simple_crypto", "Run the simple crypto test");
    simple_crypto_step.dependOn(&simple_crypto_cmd.step);

    // Default run command (hash example for backward compatibility)
    const run_step = b.step("run", "Run the hash example");
    run_step.dependOn(&hash_cmd.step);
}
