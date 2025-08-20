const std = @import("std");

pub fn main() !void {
    const allocator = std.heap.page_allocator;
    
    const path = "/Users/williamcory/Guillotine/bench/official/cases/ten-thousand-hashes/bytecode.txt";
    std.debug.print("Reading file: {s}\n", .{path});
    
    const file = try std.fs.openFileAbsolute(path, .{});
    defer file.close();
    
    const content = try file.readToEndAlloc(allocator, 16 * 1024 * 1024);
    defer allocator.free(content);
    
    std.debug.print("Content length: {}\n", .{content.len});
    std.debug.print("First 100 chars: {s}\n", .{content[0..@min(100, content.len)]});
    
    const trimmed = std.mem.trim(u8, content, " \t\n\r");
    std.debug.print("Trimmed length: {}\n", .{trimmed.len});
    std.debug.print("Trimmed first 100 chars: {s}\n", .{trimmed[0..@min(100, trimmed.len)]});
    
    // Try hex decode
    const clean_hex = if (std.mem.startsWith(u8, trimmed, "0x")) trimmed[2..] else trimmed;
    const result = try allocator.alloc(u8, clean_hex.len / 2);
    defer allocator.free(result);
    
    _ = try std.fmt.hexToBytes(result, clean_hex);
    std.debug.print("Decoded bytes length: {}\n", .{result.len});
    std.debug.print("First 20 bytes: ", .{});
    for (result[0..@min(20, result.len)]) |b| {
        std.debug.print("{x:0>2} ", .{b});
    }
    std.debug.print("\n", .{});
}