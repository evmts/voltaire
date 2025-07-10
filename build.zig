const std = @import("std");

pub fn build(b: *std.Build) void {
    // Standard target options allows the person running `zig build` to choose
    // what target to build for. Here we do not override the defaults, which
    // means any target is allowed, and the default is native. Other options
    // for restricting supported target set are available.
    const target = b.standardTargetOptions(.{});

    // Standard optimization options allow the person running `zig build` to select
    // between Debug, ReleaseSafe, ReleaseFast, and ReleaseSmall. Here we do not
    // set a preferred release mode, allowing the user to decide how to optimize.
    const optimize = b.standardOptimizeOption(.{});

    const lib_mod = b.createModule(.{
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    const address_mod = b.createModule(.{
        .root_source_file = b.path("src/address/address.zig"),
        .target = target,
        .optimize = optimize,
    });
    
    const rlp_mod = b.createModule(.{
        .root_source_file = b.path("src/rlp/rlp.zig"),
        .target = target,
        .optimize = optimize,
    });
    
    // Add Rlp import to address module
    address_mod.addImport("Rlp", rlp_mod);
    // Create the main evm module that exports everything
    const evm_mod = b.createModule(.{
        .root_source_file = b.path("src/evm/root.zig"),
        .target = target,
        .optimize = optimize,
        .stack_check = false,
        .single_threaded = true,
    });
    evm_mod.addImport("Address", address_mod);
    evm_mod.addImport("Rlp", rlp_mod);
    
    // Add Address to lib_mod so tests can access it
    lib_mod.addImport("Address", address_mod);
    lib_mod.addImport("evm", evm_mod);

    const exe_mod = b.createModule(.{ .root_source_file = b.path("src/main.zig"), .target = target, .optimize = optimize });
    exe_mod.addImport("Guillotine_lib", lib_mod);
    const lib = b.addLibrary(.{
        .linkage = .static,
        .name = "Guillotine",
        .root_module = lib_mod,
    });

    // This declares intent for the library to be installed into the standard
    // location when the user invokes the "install" step (the default step when
    // running `zig build`).
    b.installArtifact(lib);

    // This creates another `std.Build.Step.Compile`, but this one builds an executable
    // rather than a static library.
    const exe = b.addExecutable(.{
        .name = "Guillotine",
        .root_module = exe_mod,
    });

    // This declares intent for the executable to be installed into the
    // standard location when the user invokes the "install" step (the default
    // step when running `zig build`).
    b.installArtifact(exe);

    // This *creates* a Run step in the build graph, to be executed when another
    // step is evaluated that depends on it. The next line below will establish
    // such a dependency.
    const run_cmd = b.addRunArtifact(exe);
    run_cmd.step.dependOn(b.getInstallStep());

    // This allows the user to pass arguments to the application in the build
    // command itself, like this: `zig build run -- arg1 arg2 etc`
    if (b.args) |args| {
        run_cmd.addArgs(args);
    }

    // This creates a build step. It will be visible in the `zig build --help` menu,
    // and can be selected like this: `zig build run`
    // This will evaluate the `run` step rather than the default, which is "install".
    const run_step = b.step("run", "Run the app");
    run_step.dependOn(&run_cmd.step);

    // Creates a step for unit testing. This only builds the test executable
    // but does not run it.
    const lib_unit_tests = b.addTest(.{
        .root_module = lib_mod,
    });

    const run_lib_unit_tests = b.addRunArtifact(lib_unit_tests);

    const exe_unit_tests = b.addTest(.{
        .root_module = exe_mod,
    });

    const run_exe_unit_tests = b.addRunArtifact(exe_unit_tests);

    // Add EVM module tests
    const evm_test = b.addTest(.{
        .name = "evm-test",
        .root_source_file = b.path("src/evm/evm.zig"),
        .target = target,
        .optimize = optimize,
    });
    evm_test.root_module.addImport("Address", address_mod);
    evm_test.root_module.addImport("evm", evm_mod);
    evm_test.root_module.addImport("Rlp", rlp_mod);

    const run_evm_test = b.addRunArtifact(evm_test);
    const evm_test_step = b.step("test-evm", "Run EVM tests");
    evm_test_step.dependOn(&run_evm_test.step);

    // Add Memory tests
    const memory_test = b.addTest(.{
        .name = "memory-test",
        .root_source_file = b.path("test/evm/memory_test.zig"),
        .target = target,
        .optimize = optimize,
    });
    memory_test.root_module.addImport("evm", evm_mod);
    memory_test.root_module.addImport("Address", address_mod);

    const run_memory_test = b.addRunArtifact(memory_test);
    const memory_test_step = b.step("test-memory", "Run Memory tests");
    memory_test_step.dependOn(&run_memory_test.step);

    // Add Stack tests
    const stack_test = b.addTest(.{
        .name = "stack-test",
        .root_source_file = b.path("test/evm/stack_test.zig"),
        .target = target,
        .optimize = optimize,
    });
    stack_test.root_module.addImport("evm", evm_mod);

    const run_stack_test = b.addRunArtifact(stack_test);
    const stack_test_step = b.step("test-stack", "Run Stack tests");
    stack_test_step.dependOn(&run_stack_test.step);

    // Add Stack validation tests
    const stack_validation_test = b.addTest(.{
        .name = "stack-validation-test",
        .root_source_file = b.path("test/evm/stack_validation_test.zig"),
        .target = target,
        .optimize = optimize,
        .single_threaded = true,
    });
    stack_validation_test.root_module.stack_check = false;
    stack_validation_test.root_module.addImport("evm", evm_mod);

    const run_stack_validation_test = b.addRunArtifact(stack_validation_test);
    const stack_validation_test_step = b.step("test-stack-validation", "Run Stack validation tests");
    stack_validation_test_step.dependOn(&run_stack_validation_test.step);

    // Add Jump table tests
    const jump_table_test = b.addTest(.{
        .name = "jump-table-test",
        .root_source_file = b.path("test/evm/jump_table_test.zig"),
        .target = target,
        .optimize = optimize,
        .single_threaded = true,
    });
    jump_table_test.root_module.stack_check = false;
    jump_table_test.root_module.addImport("Address", address_mod);
    jump_table_test.root_module.addImport("evm", evm_mod);
    jump_table_test.root_module.addImport("Rlp", rlp_mod);

    const run_jump_table_test = b.addRunArtifact(jump_table_test);
    const jump_table_test_step = b.step("test-jump-table", "Run Jump table tests");
    jump_table_test_step.dependOn(&run_jump_table_test.step);

    // Add Opcodes tests
    const opcodes_test = b.addTest(.{
        .name = "opcodes-test",
        .root_source_file = b.path("test/evm/opcodes/opcodes_test.zig"),
        .target = target,
        .optimize = optimize,
        .single_threaded = true,
    });
    opcodes_test.root_module.stack_check = false;
    opcodes_test.root_module.addImport("Address", address_mod);
    opcodes_test.root_module.addImport("evm", evm_mod);

    const run_opcodes_test = b.addRunArtifact(opcodes_test);
    const opcodes_test_step = b.step("test-opcodes", "Run Opcodes tests");
    opcodes_test_step.dependOn(&run_opcodes_test.step);

    // Create test_helpers module for opcode tests
    const test_helpers_mod = b.addModule("test_helpers", .{
        .root_source_file = b.path("test/evm/opcodes/test_helpers.zig"),
        .target = target,
        .optimize = optimize,
    });
    test_helpers_mod.stack_check = false;
    test_helpers_mod.single_threaded = true;
    test_helpers_mod.addImport("Address", address_mod);
    test_helpers_mod.addImport("evm", evm_mod);

    // Add VM opcode tests
    const vm_opcode_test = b.addTest(.{
        .name = "vm-opcode-test",
        .root_source_file = b.path("test/evm/vm_opcode_test.zig"),
        .target = target,
        .optimize = optimize,
        .single_threaded = true,
    });
    vm_opcode_test.root_module.stack_check = false;
    vm_opcode_test.root_module.addImport("Address", address_mod);
    vm_opcode_test.root_module.addImport("evm", evm_mod);

    const run_vm_opcode_test = b.addRunArtifact(vm_opcode_test);
    const vm_opcode_test_step = b.step("test-vm-opcodes", "Run VM opcode tests");
    vm_opcode_test_step.dependOn(&run_vm_opcode_test.step);

    // Add Integration tests
    const integration_test = b.addTest(.{
        .name = "integration-test",
        .root_source_file = b.path("test/evm/integration/package.zig"),
        .target = target,
        .optimize = optimize,
        .single_threaded = true,
    });
    integration_test.root_module.stack_check = false;
    integration_test.root_module.addImport("Address", address_mod);
    integration_test.root_module.addImport("evm", evm_mod);
    integration_test.root_module.addImport("test_helpers", test_helpers_mod);

    const run_integration_test = b.addRunArtifact(integration_test);
    const integration_test_step = b.step("test-integration", "Run Integration tests");
    integration_test_step.dependOn(&run_integration_test.step);

    // Add Gas Accounting tests
    const gas_test = b.addTest(.{
        .name = "gas-test",
        .root_source_file = b.path("test/evm/gas/gas_accounting_test.zig"),
        .target = target,
        .optimize = optimize,
        .single_threaded = true,
    });
    gas_test.root_module.stack_check = false;
    gas_test.root_module.addImport("Address", address_mod);
    gas_test.root_module.addImport("evm", evm_mod);
    gas_test.root_module.addImport("test_helpers", test_helpers_mod);

    const run_gas_test = b.addRunArtifact(gas_test);
    const gas_test_step = b.step("test-gas", "Run Gas Accounting tests");
    gas_test_step.dependOn(&run_gas_test.step);

    // Add Static Call Protection tests
    const static_protection_test = b.addTest(.{
        .name = "static-protection-test",
        .root_source_file = b.path("test/evm/static_call_protection_test.zig"),
        .target = target,
        .optimize = optimize,
        .single_threaded = true,
    });
    static_protection_test.root_module.stack_check = false;
    static_protection_test.root_module.addImport("Address", address_mod);
    static_protection_test.root_module.addImport("evm", evm_mod);

    const run_static_protection_test = b.addRunArtifact(static_protection_test);
    const static_protection_test_step = b.step("test-static-protection", "Run Static Call Protection tests");
    static_protection_test_step.dependOn(&run_static_protection_test.step);

    // Add Precompile SHA256 tests
    const sha256_test = b.addTest(.{
        .name = "sha256-test",
        .root_source_file = b.path("test/evm/precompiles/sha256_test.zig"),
        .target = target,
        .optimize = optimize,
    });
    sha256_test.root_module.stack_check = false;
    sha256_test.root_module.addImport("Address", address_mod);
    sha256_test.root_module.addImport("evm", evm_mod);

    const run_sha256_test = b.addRunArtifact(sha256_test);
    const sha256_test_step = b.step("test-sha256", "Run SHA256 precompile tests");
    sha256_test_step.dependOn(&run_sha256_test.step);

    // Add RIPEMD160 precompile tests
    const ripemd160_test = b.addTest(.{
        .name = "ripemd160-test",
        .root_source_file = b.path("test/evm/precompiles/ripemd160_test.zig"),
        .target = target,
        .optimize = optimize,
    });
    ripemd160_test.root_module.stack_check = false;
    ripemd160_test.root_module.addImport("Address", address_mod);
    ripemd160_test.root_module.addImport("evm", evm_mod);

    const run_ripemd160_test = b.addRunArtifact(ripemd160_test);
    const ripemd160_test_step = b.step("test-ripemd160", "Run RIPEMD160 precompile tests");
    ripemd160_test_step.dependOn(&run_ripemd160_test.step);

    // Add E2E Simple tests
    const e2e_simple_test = b.addTest(.{
        .name = "e2e-simple-test",
        .root_source_file = b.path("test/evm/e2e_simple_test.zig"),
        .target = target,
        .optimize = optimize,
        .single_threaded = true,
    });
    e2e_simple_test.root_module.stack_check = false;
    e2e_simple_test.root_module.addImport("Address", address_mod);
    e2e_simple_test.root_module.addImport("evm", evm_mod);

    const run_e2e_simple_test = b.addRunArtifact(e2e_simple_test);
    const e2e_simple_test_step = b.step("test-e2e-simple", "Run E2E simple tests");
    e2e_simple_test_step.dependOn(&run_e2e_simple_test.step);

    // Add E2E Error Handling tests
    const e2e_error_test = b.addTest(.{
        .name = "e2e-error-test",
        .root_source_file = b.path("test/evm/e2e_error_handling_test.zig"),
        .target = target,
        .optimize = optimize,
        .single_threaded = true,
    });
    e2e_error_test.root_module.stack_check = false;
    e2e_error_test.root_module.addImport("Address", address_mod);
    e2e_error_test.root_module.addImport("evm", evm_mod);

    const run_e2e_error_test = b.addRunArtifact(e2e_error_test);
    const e2e_error_test_step = b.step("test-e2e-error", "Run E2E error handling tests");
    e2e_error_test_step.dependOn(&run_e2e_error_test.step);

    // Add E2E Data Structures tests
    const e2e_data_test = b.addTest(.{
        .name = "e2e-data-test",
        .root_source_file = b.path("test/evm/e2e_data_structures_test.zig"),
        .target = target,
        .optimize = optimize,
        .single_threaded = true,
    });
    e2e_data_test.root_module.stack_check = false;
    e2e_data_test.root_module.addImport("Address", address_mod);
    e2e_data_test.root_module.addImport("evm", evm_mod);

    const run_e2e_data_test = b.addRunArtifact(e2e_data_test);
    const e2e_data_test_step = b.step("test-e2e-data", "Run E2E data structures tests");
    e2e_data_test_step.dependOn(&run_e2e_data_test.step);

    // Add E2E Inheritance tests
    const e2e_inheritance_test = b.addTest(.{
        .name = "e2e-inheritance-test",
        .root_source_file = b.path("test/evm/e2e_inheritance_test.zig"),
        .target = target,
        .optimize = optimize,
        .single_threaded = true,
    });
    e2e_inheritance_test.root_module.stack_check = false;
    e2e_inheritance_test.root_module.addImport("Address", address_mod);
    e2e_inheritance_test.root_module.addImport("evm", evm_mod);

    const run_e2e_inheritance_test = b.addRunArtifact(e2e_inheritance_test);
    const e2e_inheritance_test_step = b.step("test-e2e-inheritance", "Run E2E inheritance tests");
    e2e_inheritance_test_step.dependOn(&run_e2e_inheritance_test.step);

    // Add combined E2E test step
    const e2e_all_test_step = b.step("test-e2e", "Run all E2E tests");
    e2e_all_test_step.dependOn(&run_e2e_simple_test.step);
    e2e_all_test_step.dependOn(&run_e2e_error_test.step);
    e2e_all_test_step.dependOn(&run_e2e_data_test.step);
    e2e_all_test_step.dependOn(&run_e2e_inheritance_test.step);

    // Similar to creating the run step earlier, this exposes a `test` step to
    // the `zig build --help` menu, providing a way for the user to request
    // running the unit tests.
    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&run_lib_unit_tests.step);
    test_step.dependOn(&run_exe_unit_tests.step);
    test_step.dependOn(&run_evm_test.step);
    test_step.dependOn(&run_memory_test.step);
    test_step.dependOn(&run_stack_test.step);
    test_step.dependOn(&run_stack_validation_test.step);
    test_step.dependOn(&run_jump_table_test.step);
    test_step.dependOn(&run_opcodes_test.step);
    test_step.dependOn(&run_vm_opcode_test.step);
    test_step.dependOn(&run_integration_test.step);
    test_step.dependOn(&run_gas_test.step);
    test_step.dependOn(&run_static_protection_test.step);
    test_step.dependOn(&run_sha256_test.step);
    test_step.dependOn(&run_ripemd160_test.step);
    test_step.dependOn(&run_e2e_simple_test.step);
    test_step.dependOn(&run_e2e_error_test.step);
    test_step.dependOn(&run_e2e_data_test.step);
    test_step.dependOn(&run_e2e_inheritance_test.step);
}
