const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Read c_api.zig
    const cwd = std.fs.cwd();
    const source = try cwd.readFileAlloc(allocator, "src/c_api.zig", 1024 * 1024);
    defer allocator.free(source);

    // Parse and generate header
    var header = std.ArrayList(u8){};
    defer header.deinit(allocator);
    const writer = header.writer(allocator);

    try writeHeaderPreamble(writer);
    try writeErrorCodes(writer, source);
    try writeTypes(writer, source);
    try writeFunctions(writer, source);
    try writeHeaderPostamble(writer);

    // Write to file
    try cwd.writeFile(.{
        .sub_path = "src/primitives.h",
        .data = header.items,
    });

    std.debug.print("Generated src/primitives.h with {d} bytes\n", .{header.items.len});
}

fn writeHeaderPreamble(writer: anytype) !void {
    try writer.writeAll(
        \\/**
        \\ * Primitives C API
        \\ *
        \\ * C bindings for Ethereum primitives library
        \\ * Provides address operations, hashing, hex utilities, and more.
        \\ *
        \\ * AUTO-GENERATED - DO NOT EDIT MANUALLY
        \\ * Generated from src/c_api.zig by scripts/generate_c_header.zig
        \\ */
        \\
        \\#ifndef PRIMITIVES_H
        \\#define PRIMITIVES_H
        \\
        \\#include <stdint.h>
        \\#include <stdbool.h>
        \\#include <stddef.h>
        \\
        \\#ifdef __cplusplus
        \\extern "C" {
        \\#endif
        \\
        \\
    );
}

fn writeErrorCodes(writer: anytype, source: []const u8) !void {
    try writer.writeAll(
        \\// ============================================================================
        \\// Error Codes
        \\// ============================================================================
        \\
        \\
    );

    // Parse error codes from source
    var lines = std.mem.splitScalar(u8, source, '\n');
    while (lines.next()) |line| {
        const trimmed = std.mem.trim(u8, line, " \t\r");

        // Look for pub const PRIMITIVES_* error codes
        if (std.mem.startsWith(u8, trimmed, "pub const PRIMITIVES_SUCCESS") or
            std.mem.startsWith(u8, trimmed, "pub const PRIMITIVES_ERROR_"))
        {
            // Extract name and value
            if (std.mem.indexOf(u8, trimmed, "pub const ")) |_| {
                const rest = trimmed["pub const ".len..];
                if (std.mem.indexOf(u8, rest, ":")) |colon_idx| {
                    const name = rest[0..colon_idx];
                    if (std.mem.indexOf(u8, rest, "=")) |eq_idx| {
                        const value_part = rest[eq_idx + 1 ..];
                        const value = std.mem.trim(u8, value_part[0 .. std.mem.indexOf(u8, value_part, ";") orelse value_part.len], " \t");

                        // Write C define with comment
                        if (std.mem.eql(u8, name, "PRIMITIVES_SUCCESS")) {
                            try writer.writeAll("/** Operation completed successfully */\n");
                        } else if (std.mem.indexOf(u8, name, "INVALID_HEX")) |_| {
                            try writer.writeAll("/** Invalid hexadecimal string */\n");
                        } else if (std.mem.indexOf(u8, name, "INVALID_LENGTH")) |_| {
                            try writer.writeAll("/** Invalid length for operation */\n");
                        } else if (std.mem.indexOf(u8, name, "INVALID_CHECKSUM")) |_| {
                            try writer.writeAll("/** Invalid checksum (EIP-55) */\n");
                        } else if (std.mem.indexOf(u8, name, "OUT_OF_MEMORY")) |_| {
                            try writer.writeAll("/** Out of memory */\n");
                        } else if (std.mem.indexOf(u8, name, "INVALID_INPUT")) |_| {
                            try writer.writeAll("/** Invalid input parameter */\n");
                        } else if (std.mem.indexOf(u8, name, "INVALID_SIGNATURE")) |_| {
                            try writer.writeAll("/** Invalid signature */\n");
                        }

                        try writer.print("#define {s} {s}\n\n", .{ name, value });
                    }
                }
            }
        }
    }

    try writer.writeAll("\n");
}

fn writeTypes(writer: anytype, source: []const u8) !void {
    try writer.writeAll(
        \\// ============================================================================
        \\// Types
        \\// ============================================================================
        \\
        \\/** Ethereum address (20 bytes) */
        \\typedef struct {
        \\    uint8_t bytes[20];
        \\} PrimitivesAddress;
        \\
        \\/** Hash value (32 bytes) - used for Keccak-256, etc. */
        \\typedef struct {
        \\    uint8_t bytes[32];
        \\} PrimitivesHash;
        \\
        \\/** 256-bit unsigned integer (32 bytes, big-endian) */
        \\typedef struct {
        \\    uint8_t bytes[32];
        \\} PrimitivesU256;
        \\
        \\
    );

    // Look for additional extern structs
    var lines = std.mem.splitScalar(u8, source, '\n');
    while (lines.next()) |line| {
        const trimmed = std.mem.trim(u8, line, " \t\r");
        if (std.mem.startsWith(u8, trimmed, "pub const PrimitivesSignature")) {
            try writer.writeAll(
                \\/** Signature structure (65 bytes: r + s + v) */
                \\typedef struct {
                \\    uint8_t r[32];
                \\    uint8_t s[32];
                \\    uint8_t v;
                \\} PrimitivesSignature;
                \\
                \\
            );
            break;
        }
    }

    try writer.writeAll("\n");
}

fn writeFunctions(writer: anytype, source: []const u8) !void {
    var current_section: ?[]const u8 = null;
    var in_comment = false;
    var comment_buffer = std.ArrayList(u8){};
    defer comment_buffer.deinit(std.heap.page_allocator);

    var i: usize = 0;
    while (i < source.len) {
        // Find next line
        const line_end = std.mem.indexOfScalarPos(u8, source, i, '\n') orelse source.len;
        const line = source[i..line_end];
        const trimmed = std.mem.trim(u8, line, " \t\r");

        // Detect section headers
        if (std.mem.indexOf(u8, trimmed, "// ====")) |_| {
            i = line_end + 1;
            if (i >= source.len) break;
            const next_line_end = std.mem.indexOfScalarPos(u8, source, i, '\n') orelse source.len;
            const next_line = source[i..next_line_end];
            const section = std.mem.trim(u8, next_line, " \t\r/");
            if (section.len > 0) {
                current_section = section;
                try writer.print("// ============================================================================\n// {s}\n// ============================================================================\n\n", .{section});
            }
            i = next_line_end + 1;
            continue;
        }

        // Collect doc comments
        if (std.mem.startsWith(u8, trimmed, "///")) {
            if (!in_comment) {
                comment_buffer.clearRetainingCapacity();
                in_comment = true;
            }
            const comment = std.mem.trim(u8, trimmed[3..], " ");
            try comment_buffer.writer(std.heap.page_allocator).print(" * {s}\n", .{comment});
            i = line_end + 1;
            continue;
        }

        // Parse export fn
        if (std.mem.startsWith(u8, trimmed, "export fn ")) {
            // Write doc comment if exists
            if (in_comment and comment_buffer.items.len > 0) {
                try writer.writeAll("/**\n");
                try writer.writeAll(comment_buffer.items);
                try writer.writeAll(" */\n");
            }
            in_comment = false;

            // Parse function signature
            try writeFunctionSignature(writer, source[i..]);
            try writer.writeAll("\n");

            // Skip to next function
            const fn_end = std.mem.indexOfScalarPos(u8, source, i, '{') orelse i;
            i = fn_end + 1;
            continue;
        }

        // Reset comment if we hit a non-comment, non-export line
        if (trimmed.len > 0 and !std.mem.startsWith(u8, trimmed, "//")) {
            in_comment = false;
        }

        i = line_end + 1;
    }
}

fn writeFunctionSignature(writer: anytype, source: []const u8) !void {
    // Find function name
    const export_start = std.mem.indexOf(u8, source, "export fn ") orelse return;
    const fn_name_start = export_start + "export fn ".len;
    const paren_idx = std.mem.indexOfScalarPos(u8, source, fn_name_start, '(') orelse return;
    const fn_name = std.mem.trim(u8, source[fn_name_start..paren_idx], " \t");

    // Find the closing paren and return type
    const closing_paren = std.mem.indexOfScalarPos(u8, source, paren_idx, ')') orelse return;
    const after_paren = closing_paren + 1;

    // Find return type (between ) and {)
    const brace_idx = std.mem.indexOfScalarPos(u8, source, after_paren, '{') orelse return;
    const return_part = std.mem.trim(u8, source[after_paren..brace_idx], " \t\r\n");
    const c_return = try zigTypeToCType(return_part);

    // Parse parameters
    const params = source[paren_idx + 1 .. closing_paren];

    // Collect parameters
    var param_list = std.ArrayList(struct { name: []const u8, c_type: []const u8 }){};
    defer param_list.deinit(std.heap.page_allocator);

    var param_iter = std.mem.splitScalar(u8, params, ',');
    while (param_iter.next()) |param| {
        const trimmed = std.mem.trim(u8, param, " \t\r\n");
        if (trimmed.len == 0) continue;

        // Split on colon
        const colon_idx = std.mem.indexOf(u8, trimmed, ":") orelse continue;
        const param_name = std.mem.trim(u8, trimmed[0..colon_idx], " \t");
        const param_type = std.mem.trim(u8, trimmed[colon_idx + 1 ..], " \t");

        const c_type = try zigTypeToCType(param_type);
        try param_list.append(std.heap.page_allocator, .{ .name = param_name, .c_type = c_type });
    }

    // Write function signature
    try writer.print("{s} {s}(", .{ c_return, fn_name });

    if (param_list.items.len == 0) {
        try writer.writeAll("void");
    } else {
        for (param_list.items, 0..) |param, idx| {
            if (idx > 0) {
                try writer.writeAll(", ");
            }
            try writer.print("{s} {s}", .{ param.c_type, param.name });
        }
    }

    try writer.writeAll(");\n");
}

fn zigTypeToCType(zig_type: []const u8) ![]const u8 {
    if (std.mem.eql(u8, zig_type, "c_int")) return "int";
    if (std.mem.eql(u8, zig_type, "bool")) return "bool";
    if (std.mem.eql(u8, zig_type, "u8")) return "uint8_t";
    if (std.mem.eql(u8, zig_type, "u32")) return "uint32_t";
    if (std.mem.eql(u8, zig_type, "u64")) return "uint64_t";
    if (std.mem.eql(u8, zig_type, "usize")) return "size_t";
    if (std.mem.eql(u8, zig_type, "[*:0]const u8")) return "const char *";
    if (std.mem.eql(u8, zig_type, "[*]const u8")) return "const uint8_t *";
    if (std.mem.eql(u8, zig_type, "[*]u8")) return "uint8_t *";
    if (std.mem.eql(u8, zig_type, "[*]u32")) return "uint32_t *";
    if (std.mem.eql(u8, zig_type, "*PrimitivesAddress")) return "PrimitivesAddress *";
    if (std.mem.eql(u8, zig_type, "*const PrimitivesAddress")) return "const PrimitivesAddress *";
    if (std.mem.eql(u8, zig_type, "*PrimitivesHash")) return "PrimitivesHash *";
    if (std.mem.eql(u8, zig_type, "*const PrimitivesHash")) return "const PrimitivesHash *";
    if (std.mem.eql(u8, zig_type, "*PrimitivesU256")) return "PrimitivesU256 *";
    if (std.mem.eql(u8, zig_type, "*const PrimitivesU256")) return "const PrimitivesU256 *";
    // For pointer-to-array types, use simpler pointer syntax that's more C-compatible
    if (std.mem.eql(u8, zig_type, "*const [32]u8")) return "const uint8_t *";
    if (std.mem.eql(u8, zig_type, "*[32]u8")) return "uint8_t *";
    if (std.mem.eql(u8, zig_type, "*const [20]u8")) return "const uint8_t *";
    if (std.mem.eql(u8, zig_type, "*[20]u8")) return "uint8_t *";
    if (std.mem.eql(u8, zig_type, "*[64]u8")) return "uint8_t *";
    if (std.mem.eql(u8, zig_type, "*[33]u8")) return "uint8_t *";
    if (std.mem.eql(u8, zig_type, "*[4]u8")) return "uint8_t *";
    if (std.mem.eql(u8, zig_type, "*const [64]u8")) return "const uint8_t *";
    if (std.mem.eql(u8, zig_type, "*const [33]u8")) return "const uint8_t *";
    if (std.mem.eql(u8, zig_type, "*u8")) return "uint8_t *";
    if (std.mem.eql(u8, zig_type, "void")) return "void";

    // Default fallback
    return zig_type;
}

fn writeHeaderPostamble(writer: anytype) !void {
    try writer.writeAll(
        \\
        \\#ifdef __cplusplus
        \\}
        \\#endif
        \\
        \\#endif /* PRIMITIVES_H */
        \\
    );
}
