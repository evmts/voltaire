const std = @import("std");

// Analyze the 10k hashes bytecode to understand what it does
test "analyze 10k hashes bytecode" {
    // The bytecode from the file (constructor + runtime)
    const bytecode_hex = "6080604052348015600e575f5ffd5b50609780601a5f395ff3fe6080604052348015600e575f5ffd5b50600436106026575f3560e01c806330627b7c14602a575b5f5ffd5b60306032565b005b5f5b614e20811015605e5760408051602081018390520160408051601f19818403019052526001016034565b5056fea26469706673582212202c247f39d615d7f66942cd6ed505d8ea34fbfcbe16ac875ed08c4a9c229325f364736f6c634300081e0033";
    
    // Constructor code starts at beginning
    std.debug.print("\n=== Constructor Analysis ===\n", .{});
    std.debug.print("6080604052 - PUSH1 0x80, PUSH1 0x40, MSTORE (standard init)\n", .{});
    std.debug.print("34801560E575F5FFD - payable check\n", .{});
    std.debug.print("50609780601A5F395FF3FE - CODECOPY and RETURN runtime code\n", .{});
    
    // Runtime code starts after constructor
    std.debug.print("\n=== Runtime Code Analysis ===\n", .{});
    std.debug.print("Function selector: 30627b7c\n", .{});
    std.debug.print("\nThe main loop:\n", .{});
    std.debug.print("5F5B - PUSH0, JUMPDEST (loop start)\n", .{});
    std.debug.print("614E20 - PUSH2 0x4E20 (20,000 decimal)\n", .{});
    std.debug.print("811015605E - DUP2, LT, PUSH1 0x5E, JUMPI (if i < 20000, continue)\n", .{});
    std.debug.print("\nLoop body:\n", .{});
    std.debug.print("5760408051602081018390520160408051601F19818403019052526001016034\n", .{});
    std.debug.print("This appears to be hashing operations inside the loop\n", .{});
    
    // The actual operations in the loop seem to be:
    // 1. Load counter onto stack
    // 2. Perform KECCAK256 hash
    // 3. Increment counter
    // 4. Jump back to loop start
    
    std.debug.print("\nExpected behavior:\n", .{});
    std.debug.print("- Loop 20,000 times (0x4E20)\n", .{});
    std.debug.print("- Each iteration performs a KECCAK256 hash\n", .{});
    std.debug.print("- Should consume significant gas (20k * ~30 gas per hash = 600k+ gas)\n", .{});
}