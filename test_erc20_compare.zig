const std = @import("std");

pub fn main() !void {
    const allocator = std.heap.page_allocator;
    
    // Read the ERC20 bytecode
    const file_content = try std.fs.cwd().readFileAlloc(allocator, "test/evm/erc20_mint.hex", 1024 * 1024);
    defer allocator.free(file_content);
    
    // Clean the hex string
    const clean_hex = std.mem.trim(u8, file_content, " \n\r\t");
    
    // Write to file for comparison tool
    const out_file = try std.fs.cwd().createFile("erc20_bytecode.txt", .{});
    defer out_file.close();
    try out_file.writeAll(clean_hex);
    
    std.debug.print("Bytecode written to erc20_bytecode.txt\n", .{});
    std.debug.print("Now run: cargo run --release --bin compare_traces -- erc20_bytecode.txt zig_trace.json\n", .{});
}