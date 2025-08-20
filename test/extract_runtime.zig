const std = @import("std");

test "extract runtime code from 10k hashes bytecode" {
    // Full bytecode from the file
    const full_hex = "6080604052348015600e575f5ffd5b50609780601a5f395ff3fe6080604052348015600e575f5ffd5b50600436106026575f3560e01c806330627b7c14602a575b5f5ffd5b60306032565b005b5f5b614e20811015605e5760408051602081018390520160408051601f19818403019052526001016034565b5056fea26469706673582212202c247f39d615d7f66942cd6ed505d8ea34fbfcbe16ac875ed08c4a9c229325f364736f6c634300081e0033";
    
    std.debug.print("\n=== Analyzing 10k hashes bytecode ===\n", .{});
    std.debug.print("Full hex length: {} chars\n", .{full_hex.len});
    
    // Find the runtime code marker (0xff3fe)
    if (std.mem.indexOf(u8, full_hex, "ff3fe")) |idx| {
        std.debug.print("Found runtime marker at position: {}\n", .{idx});
        const runtime_hex = full_hex[idx + 5..]; // Skip "ff3fe"
        std.debug.print("Runtime hex: {s}\n", .{runtime_hex});
        std.debug.print("Runtime hex length: {} chars\n", .{runtime_hex.len});
        
        // The runtime code should be:
        // 6080604052... up to ...5056fe (the actual contract logic)
        const runtime_end = std.mem.indexOf(u8, runtime_hex, "a264697066735822") orelse runtime_hex.len;
        const clean_runtime = runtime_hex[0..runtime_end];
        std.debug.print("\nClean runtime (without metadata): {s}\n", .{clean_runtime});
        std.debug.print("Clean runtime length: {} chars ({} bytes)\n", .{clean_runtime.len, clean_runtime.len / 2});
    } else {
        std.debug.print("Runtime marker not found!\n", .{});
    }
    
    // Let's also decode the constructor to understand what it does
    std.debug.print("\n=== Constructor analysis ===\n", .{});
    const constructor_hex = "6080604052348015600e575f5ffd5b50609780601a5f395ff3fe";
    std.debug.print("Constructor: {s}\n", .{constructor_hex});
    std.debug.print("60806040 - PUSH1 0x80, PUSH1 0x40\n", .{});
    std.debug.print("52 - MSTORE (standard memory setup)\n", .{});
    std.debug.print("34801560e575f5ffd - Check msg.value == 0\n", .{});
    std.debug.print("50 - POP\n", .{});
    std.debug.print("6097 - PUSH1 0x97 (runtime size = 151 bytes)\n", .{});
    std.debug.print("80 - DUP1\n", .{});
    std.debug.print("601a - PUSH1 0x1a (offset = 26)\n", .{});
    std.debug.print("5f - PUSH0\n", .{});
    std.debug.print("39 - CODECOPY (copy runtime to memory)\n", .{});
    std.debug.print("5f - PUSH0\n", .{});
    std.debug.print("f3 - RETURN (return runtime code)\n", .{});
    std.debug.print("fe - INVALID (end of constructor)\n", .{});
}