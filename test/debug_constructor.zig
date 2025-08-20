const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== DEBUG: SIMPLE CONSTRUCTOR TEST ===\n", .{});

    // Simple constructor that should return runtime code
    // Constructor: PUSH1 0x05, PUSH1 0x0C, PUSH1 0x00, CODECOPY, PUSH1 0x05, PUSH1 0x00, RETURN
    // Runtime: PUSH1 0x42, PUSH1 0x00, MSTORE, PUSH1 0x20, PUSH1 0x00, RETURN
    const deployment_code = [_]u8{
        // Constructor (returns 5 bytes of runtime starting at offset 12)
        0x60, 0x05,  // PUSH1 0x05 (size = 5)
        0x60, 0x0C,  // PUSH1 0x0C (offset = 12) 
        0x60, 0x00,  // PUSH1 0x00 (destOffset = 0)
        0x39,        // CODECOPY
        0x60, 0x05,  // PUSH1 0x05 (size = 5)
        0x60, 0x00,  // PUSH1 0x00 (offset = 0)
        0xF3,        // RETURN
        // Runtime code (5 bytes)
        0x60, 0x42,  // PUSH1 0x42
        0x60, 0x00,  // PUSH1 0x00  
        0x00,        // STOP
    };

    std.debug.print("Deployment code: ", .{});
    for (deployment_code) |b| {
        std.debug.print("{x:0>2} ", .{b});
    }
    std.debug.print("\n", .{});
    std.debug.print("Expected runtime: 60 42 60 00 00 (5 bytes)\n\n", .{});

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    const stderr = std.io.getStdErr().writer();
    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, 0, false, stderr.any());
    defer vm.deinit();

    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy
    std.debug.print("--- DEPLOYING ---\n", .{});
    const deploy_result = try vm.create_contract(caller, 0, &deployment_code, 1_000_000);
    
    std.debug.print("\nDeploy success: {}\n", .{deploy_result.success});
    std.debug.print("Deploy gas_left: {}\n", .{deploy_result.gas_left});
    
    if (deploy_result.output) |output| {
        std.debug.print("Returned runtime code length: {} bytes\n", .{output.len});
        if (output.len > 0) {
            std.debug.print("Runtime code: ", .{});
            for (output) |b| {
                std.debug.print("{x:0>2} ", .{b});
            }
            std.debug.print("\n", .{});
        }
    } else {
        std.debug.print("No output returned!\n", .{});
    }

    // Check what's actually stored at the contract address
    const deployed_code = vm.state.get_code(deploy_result.address);
    std.debug.print("\nCode at deployed address: {} bytes\n", .{deployed_code.len});
    if (deployed_code.len > 0) {
        std.debug.print("Stored code: ", .{});
        for (deployed_code) |b| {
            std.debug.print("{x:0>2} ", .{b});
        }
        std.debug.print("\n", .{});
    }
}