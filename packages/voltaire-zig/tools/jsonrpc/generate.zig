const std = @import("std");

const MethodInfo = struct {
    name: []const u8,
    namespace: []const u8,
    method_part: []const u8,
    json_value: std.json.Value,
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Read the OpenRPC specification
    const spec_path = "vendor/execution-apis/openrpc.json";
    const spec_file = try std.fs.cwd().openFile(spec_path, .{});
    defer spec_file.close();

    const spec_content = try spec_file.readToEndAlloc(allocator, 100 * 1024 * 1024);
    defer allocator.free(spec_content);

    // Parse JSON
    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, spec_content, .{});
    defer parsed.deinit();

    const root = parsed.value;
    const methods = root.object.get("methods") orelse return error.NoMethodsFound;
    const methods_array = methods.array;

    std.debug.print("Processing {d} methods...\n", .{methods_array.items.len});

    // Collect methods by namespace
    var namespaces = std.StringHashMap(std.ArrayList(MethodInfo)).init(allocator);
    defer {
        var it = namespaces.valueIterator();
        while (it.next()) |list| {
            list.deinit(allocator);
        }
        namespaces.deinit();
    }

    // First pass: collect methods by namespace
    for (methods_array.items) |method| {
        const method_name = method.object.get("name").?.string;

        // Split method name by underscore to get namespace and method
        var parts = std.mem.splitScalar(u8, method_name, '_');
        const namespace = parts.next() orelse continue;
        const method_part = parts.rest();

        const gop = try namespaces.getOrPut(namespace);
        if (!gop.found_existing) {
            gop.value_ptr.* = .empty;
        }

        try gop.value_ptr.append(allocator, .{
            .name = method_name,
            .namespace = namespace,
            .method_part = method_part,
            .json_value = method,
        });
    }

    // Second pass: generate files for each method
    var ns_it = namespaces.iterator();
    while (ns_it.next()) |entry| {
        const namespace = entry.key_ptr.*;
        const method_list = entry.value_ptr.*;

        for (method_list.items) |method_info| {
            const method = method_info.json_value;
            const method_name = method_info.name;
            const method_part = method_info.method_part;

            // Create method directory inside namespace (recursive)
            const method_dir_path = try std.fmt.allocPrint(allocator, "src/jsonrpc/{s}/{s}", .{ namespace, method_part });
            defer allocator.free(method_dir_path);

            try std.fs.cwd().makePath(method_dir_path);

            // Write JSON spec file
            const json_path = try std.fmt.allocPrint(allocator, "src/jsonrpc/{s}/{s}/{s}.json", .{ namespace, method_part, method_name });
            defer allocator.free(json_path);

            const json_file = try std.fs.cwd().createFile(json_path, .{});
            defer json_file.close();

            // Write JSON by formatting the method value using Zig 0.15 API
            const json_str = try std.json.Stringify.valueAlloc(allocator, method, .{});
            defer allocator.free(json_str);
            try json_file.writeAll(json_str);

            // Write Zig struct file
            const struct_name = try toPascalCase(allocator, method_name);
            defer allocator.free(struct_name);

            const zig_path = try std.fmt.allocPrint(allocator, "src/jsonrpc/{s}/{s}/{s}.zig", .{ namespace, method_part, method_name });
            defer allocator.free(zig_path);

            const zig_file = try std.fs.cwd().createFile(zig_path, .{});
            defer zig_file.close();

            try generateZigStruct(allocator, method, struct_name, method_name, zig_file);

            // Write JavaScript file with JSDoc
            const js_path = try std.fmt.allocPrint(allocator, "src/jsonrpc/{s}/{s}/{s}.js", .{ namespace, method_part, method_name });
            defer allocator.free(js_path);

            const js_file = try std.fs.cwd().createFile(js_path, .{});
            defer js_file.close();

            try generateJavaScriptWithJSDoc(allocator, method, method_name, js_file);

            // Write Go file
            const go_path = try std.fmt.allocPrint(allocator, "src/jsonrpc/{s}/{s}/{s}.go", .{ namespace, method_part, method_name });
            defer allocator.free(go_path);

            const go_file = try std.fs.cwd().createFile(go_path, .{});
            defer go_file.close();

            try generateGoStruct(allocator, method, struct_name, method_name, go_file);

            std.debug.print("Created: {s}, {s}, {s}, and {s}\n", .{ json_path, zig_path, js_path, go_path });
        }

        // Generate methods.js, methods.zig, and methods.go for this namespace
        try generateNamespaceMethodsJS(allocator, namespace, method_list.items);
        try generateNamespaceMethodsZig(allocator, namespace, method_list.items);
        try generateNamespaceMethodsGo(allocator, namespace, method_list.items);
    }

    // Generate root JsonRpc.js and JsonRpc.zig
    var namespace_list: std.ArrayList([]const u8) = .empty;
    defer namespace_list.deinit(allocator);

    var ns_keys = namespaces.keyIterator();
    while (ns_keys.next()) |ns| {
        try namespace_list.append(allocator, ns.*);
    }

    try generateRootJsonRpcJS(allocator, namespace_list.items);
    try generateRootJsonRpcZig(allocator, namespace_list.items);
    try generateRootJsonRpcGo(allocator, namespace_list.items);

    std.debug.print("\nDone! Processed {d} methods across {d} namespaces.\n", .{ methods_array.items.len, namespaces.count() });
}

fn toPascalCase(allocator: std.mem.Allocator, snake_case: []const u8) ![]u8 {
    var result: std.ArrayListUnmanaged(u8) = .{};
    defer result.deinit(allocator);

    var capitalize_next = true;
    for (snake_case) |c| {
        if (c == '_') {
            capitalize_next = true;
        } else if (capitalize_next) {
            try result.append(allocator, std.ascii.toUpper(c));
            capitalize_next = false;
        } else {
            try result.append(allocator, c);
        }
    }

    return result.toOwnedSlice(allocator);
}

fn generateZigStruct(allocator: std.mem.Allocator, method: std.json.Value, struct_name: []const u8, method_name: []const u8, file: std.fs.File) !void {
    var output: std.ArrayListUnmanaged(u8) = .{};
    defer output.deinit(allocator);
    const writer = output.writer(allocator);

    // Write imports
    try writer.writeAll("const std = @import(\"std\");\n");
    try writer.writeAll("const types = @import(\"../../types.zig\");\n\n");

    // Write summary as doc comment
    if (method.object.get("summary")) |summary| {
        if (summary == .string) {
            try writer.writeAll("/// ");
            try writer.writeAll(summary.string);
            try writer.writeAll("\n");
        }
    }

    // Write examples as doc comments
    if (method.object.get("examples")) |examples| {
        if (examples == .array and examples.array.items.len > 0) {
            try writer.writeAll("///\n/// Example:\n");
            const first_example = examples.array.items[0];
            if (first_example.object.get("params")) |params| {
                if (params == .array) {
                    for (params.array.items) |param| {
                        if (param.object.get("name")) |name| {
                            if (param.object.get("value")) |value| {
                                try writer.writeAll("/// ");
                                try writer.writeAll(name.string);
                                try writer.writeAll(": ");
                                try writeJsonValue(value, writer.any());
                                try writer.writeAll("\n");
                            }
                        }
                    }
                }
            }
            if (first_example.object.get("result")) |result| {
                if (result.object.get("value")) |value| {
                    try writer.writeAll("/// Result: ");
                    try writeJsonValue(value, writer.any());
                    try writer.writeAll("\n");
                }
            }
        }
    }

    try writer.writeAll("///\n/// Implements the `");
    try writer.writeAll(method_name);
    try writer.writeAll("` JSON-RPC method.\n");
    try writer.print("pub const {s} = @This();\n\n", .{struct_name});

    // Export method name
    try writer.writeAll("/// The JSON-RPC method name\n");
    try writer.writeAll("pub const method = \"");
    try writer.writeAll(method_name);
    try writer.writeAll("\";\n\n");

    // Generate Params struct
    if (method.object.get("params")) |params| {
        if (params == .array) {
            try generateParamsStruct(allocator, params.array, method_name, writer.any());
        }
    }

    // Generate Result struct
    if (method.object.get("result")) |result| {
        try generateResultStruct(allocator, result, method_name, writer.any());
    }

    // Write accumulated output to file
    try file.writeAll(output.items);
}

fn generateParamsStruct(allocator: std.mem.Allocator, params: std.json.Array, method_name: []const u8, writer: anytype) !void {
    try writer.writeAll("/// Parameters for `");
    try writer.writeAll(method_name);
    try writer.writeAll("`\n");
    try writer.writeAll("pub const Params = struct {\n");

    for (params.items) |param| {
        const param_name = param.object.get("name").?.string;
        const schema = param.object.get("schema").?;

        // Write doc comment for field
        if (schema.object.get("title")) |title| {
            try writer.writeAll("    /// ");
            try writer.writeAll(title.string);
            try writer.writeAll("\n");
        }

        // Determine field type
        const field_name = try toSnakeCase(allocator, param_name);
        defer allocator.free(field_name);

        const field_type = try inferZigType(schema);
        try writer.writeAll("    ");
        try writer.writeAll(field_name);
        try writer.writeAll(": ");
        try writer.writeAll(field_type);
        try writer.writeAll(",\n");
    }

    // If params is empty, handle unused parameter warnings
    if (params.items.len == 0) {
        try writer.writeAll("\n    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {\n");
        try writer.writeAll("        _ = self;\n");
        try writer.writeAll("        try jws.write(.{});\n");
        try writer.writeAll("    }\n\n");
        try writer.writeAll("    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {\n");
        try writer.writeAll("        _ = allocator;\n");
        try writer.writeAll("        _ = source;\n");
        try writer.writeAll("        _ = options;\n");
        try writer.writeAll("        return Params{};\n");
        try writer.writeAll("    }\n");
    } else {
        try writer.writeAll("\n    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {\n");
        try writer.writeAll("        try jws.beginArray();\n");

        for (params.items, 0..) |_, i| {
            const param = params.items[i];
            const param_name = param.object.get("name").?.string;
            const field_name = try toSnakeCase(allocator, param_name);
            defer allocator.free(field_name);

            try writer.writeAll("        try jws.write(self.");
            try writer.writeAll(field_name);
            try writer.writeAll(");\n");
        }

        try writer.writeAll("        try jws.endArray();\n");
        try writer.writeAll("    }\n\n");

        try writer.writeAll("    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {\n");
        try writer.writeAll("        if (source != .array) return error.UnexpectedToken;\n");
        try writer.print("        if (source.array.items.len != {d}) return error.InvalidParamCount;\n\n", .{params.items.len});
        try writer.writeAll("        return Params{\n");

        for (params.items, 0..) |_, i| {
            const param = params.items[i];
            const param_name = param.object.get("name").?.string;
            const field_name = try toSnakeCase(allocator, param_name);
            defer allocator.free(field_name);

            const schema = param.object.get("schema").?;
            const field_type = try inferZigType(schema);

            try writer.writeAll("            .");
            try writer.writeAll(field_name);
            try writer.writeAll(" = try std.json.innerParseFromValue(");
            try writer.writeAll(field_type);
            try writer.print(", allocator, source.array.items[{d}], options),\n", .{i});
        }

        try writer.writeAll("        };\n");
        try writer.writeAll("    }\n");
    }
    try writer.writeAll("};\n\n");
}

fn generateResultStruct(allocator: std.mem.Allocator, result: std.json.Value, method_name: []const u8, writer: anytype) !void {
    _ = allocator;

    try writer.writeAll("/// Result for `");
    try writer.writeAll(method_name);
    try writer.writeAll("`\n");
    try writer.writeAll("pub const Result = struct {\n");

    const schema = result.object.get("schema").?;

    if (schema.object.get("title")) |title| {
        try writer.writeAll("    /// ");
        try writer.writeAll(title.string);
        try writer.writeAll("\n");
    }

    const result_type = try inferZigType(schema);
    try writer.writeAll("    value: ");
    try writer.writeAll(result_type);
    try writer.writeAll(",\n\n");

    try writer.writeAll("    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {\n");
    try writer.writeAll("        try jws.write(self.value);\n");
    try writer.writeAll("    }\n\n");

    try writer.writeAll("    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Result {\n");
    try writer.writeAll("        return Result{\n");
    try writer.writeAll("            .value = try std.json.innerParseFromValue(");
    try writer.writeAll(result_type);
    try writer.writeAll(", allocator, source, options),\n");
    try writer.writeAll("        };\n");
    try writer.writeAll("    }\n");
    try writer.writeAll("};\n");
}

fn inferZigType(schema: std.json.Value) ![]const u8 {
    // Check for anyOf (union types like BlockSpec)
    if (schema.object.get("anyOf")) |_| {
        // Check if this looks like a BlockSpec
        if (schema.object.get("title")) |title| {
            const title_str = title.string;
            if (std.mem.indexOf(u8, title_str, "Block") != null) {
                return "types.BlockSpec";
            }
        }
        return "types.BlockSpec"; // Default for anyOf
    }

    // Check pattern to determine type
    if (schema.object.get("pattern")) |pattern| {
        const pattern_str = pattern.string;

        // Address pattern: ^0x[0-9a-fA-F]{40}$
        if (std.mem.indexOf(u8, pattern_str, "{40}") != null) {
            return "types.Address";
        }

        // Hash pattern: ^0x[0-9a-f]{64}$
        if (std.mem.indexOf(u8, pattern_str, "{64}") != null) {
            return "types.Hash";
        }

        // Quantity pattern: ^0x(0|[1-9a-f][0-9a-f]*)$
        if (std.mem.indexOf(u8, pattern_str, "[1-9a-f]") != null) {
            return "types.Quantity";
        }
    }

    // Check for enum (likely BlockTag)
    if (schema.object.get("enum")) |_| {
        return "types.BlockTag";
    }

    // Default to Quantity for unrecognized patterns
    return "types.Quantity";
}

fn toSnakeCase(allocator: std.mem.Allocator, str: []const u8) ![]u8 {
    var result: std.ArrayListUnmanaged(u8) = .{};
    defer result.deinit(allocator);

    for (str) |c| {
        try result.append(allocator, std.ascii.toLower(c));
    }

    return result.toOwnedSlice(allocator);
}

fn writeJsonValue(value: std.json.Value, writer: anytype) !void {
    switch (value) {
        .string => |s| {
            try writer.writeAll("\"");
            try writer.writeAll(s);
            try writer.writeAll("\"");
        },
        .number_string => |s| try writer.writeAll(s),
        .float => |f| try writer.print("{d}", .{f}),
        .integer => |i| try writer.print("{d}", .{i}),
        .bool => |b| try writer.writeAll(if (b) "true" else "false"),
        .null => try writer.writeAll("null"),
        else => try writer.writeAll("..."),
    }
}

fn generateJavaScriptWithJSDoc(allocator: std.mem.Allocator, method: std.json.Value, method_name: []const u8, file: std.fs.File) !void {
    var output: std.ArrayListUnmanaged(u8) = .{};
    defer output.deinit(allocator);
    const writer = output.writer(allocator);

    // Write file overview
    try writer.writeAll("/**\n");
    try writer.writeAll(" * @fileoverview ");
    try writer.writeAll(method_name);
    try writer.writeAll(" JSON-RPC method\n");
    try writer.writeAll(" */\n\n");

    // Write imports as JSDoc typedefs
    try writer.writeAll("/**\n");
    try writer.writeAll(" * @typedef {import('../../types/index.js').Address} Address\n");
    try writer.writeAll(" * @typedef {import('../../types/index.js').Hash} Hash\n");
    try writer.writeAll(" * @typedef {import('../../types/index.js').Quantity} Quantity\n");
    try writer.writeAll(" * @typedef {import('../../types/index.js').BlockTag} BlockTag\n");
    try writer.writeAll(" * @typedef {import('../../types/index.js').BlockSpec} BlockSpec\n");
    try writer.writeAll(" */\n\n");

    // Write summary as JSDoc comment
    try writer.writeAll("/**\n");
    if (method.object.get("summary")) |summary| {
        if (summary == .string) {
            try writer.writeAll(" * ");
            try writer.writeAll(summary.string);
            try writer.writeAll("\n");
        }
    }

    // Write examples
    if (method.object.get("examples")) |examples| {
        if (examples == .array and examples.array.items.len > 0) {
            try writer.writeAll(" *\n * @example\n");
            const first_example = examples.array.items[0];
            if (first_example.object.get("params")) |params| {
                if (params == .array) {
                    for (params.array.items) |param| {
                        if (param.object.get("name")) |name| {
                            if (param.object.get("value")) |value| {
                                try writer.writeAll(" * ");
                                try writer.writeAll(name.string);
                                try writer.writeAll(": ");
                                try writeJsonValue(value, writer.any());
                                try writer.writeAll("\n");
                            }
                        }
                    }
                }
            }
            if (first_example.object.get("result")) |result| {
                if (result.object.get("value")) |value| {
                    try writer.writeAll(" * Result: ");
                    try writeJsonValue(value, writer.any());
                    try writer.writeAll("\n");
                }
            }
        }
    }

    try writer.writeAll(" *\n");
    try writer.writeAll(" * Implements the `");
    try writer.writeAll(method_name);
    try writer.writeAll("` JSON-RPC method.\n");
    try writer.writeAll(" */\n\n");

    // Export method name
    try writer.writeAll("/** The JSON-RPC method name */\n");
    try writer.writeAll("export const method = '");
    try writer.writeAll(method_name);
    try writer.writeAll("'\n\n");

    // Generate Params JSDoc typedef
    if (method.object.get("params")) |params| {
        if (params == .array) {
            try generateJavaScriptParams(allocator, params.array, method_name, writer.any());
        }
    }

    // Generate Result JSDoc typedef
    if (method.object.get("result")) |result| {
        try generateJavaScriptResult(allocator, result, method_name, writer.any());
    }

    // Write accumulated output to file
    try file.writeAll(output.items);
}

fn generateJavaScriptParams(allocator: std.mem.Allocator, params: std.json.Array, method_name: []const u8, writer: anytype) !void {
    try writer.writeAll("/**\n");
    try writer.writeAll(" * Parameters for `");
    try writer.writeAll(method_name);
    try writer.writeAll("`\n");
    try writer.writeAll(" *\n");
    try writer.writeAll(" * @typedef {Object} Params\n");

    for (params.items) |param| {
        const param_name = param.object.get("name").?.string;
        const schema = param.object.get("schema").?;

        const field_name = try toSnakeCase(allocator, param_name);
        defer allocator.free(field_name);

        const field_type = try inferJavaScriptType(schema);
        try writer.writeAll(" * @property {");
        try writer.writeAll(field_type);
        try writer.writeAll("} ");
        try writer.writeAll(field_name);

        // Add description if available
        if (schema.object.get("title")) |title| {
            try writer.writeAll(" - ");
            try writer.writeAll(title.string);
        }
        try writer.writeAll("\n");
    }

    try writer.writeAll(" */\n\n");
    try writer.writeAll("export {}\n");
}

fn generateJavaScriptResult(allocator: std.mem.Allocator, result: std.json.Value, method_name: []const u8, writer: anytype) !void {
    _ = allocator;

    const schema = result.object.get("schema").?;
    const result_type = try inferJavaScriptType(schema);

    try writer.writeAll("/**\n");
    try writer.writeAll(" * Result for `");
    try writer.writeAll(method_name);
    try writer.writeAll("`\n");

    if (schema.object.get("title")) |title| {
        try writer.writeAll(" *\n");
        try writer.writeAll(" * ");
        try writer.writeAll(title.string);
        try writer.writeAll("\n");
    }

    try writer.writeAll(" *\n");
    try writer.writeAll(" * @typedef {");
    try writer.writeAll(result_type);
    try writer.writeAll("} Result\n");
    try writer.writeAll(" */\n");
}

fn inferJavaScriptType(schema: std.json.Value) ![]const u8 {
    // Check for anyOf (union types like BlockSpec)
    if (schema.object.get("anyOf")) |_| {
        if (schema.object.get("title")) |title| {
            const title_str = title.string;
            if (std.mem.indexOf(u8, title_str, "Block") != null) {
                return "BlockSpec";
            }
        }
        return "BlockSpec";
    }

    // Check pattern to determine type
    if (schema.object.get("pattern")) |pattern| {
        const pattern_str = pattern.string;

        // Address pattern: ^0x[0-9a-fA-F]{40}$
        if (std.mem.indexOf(u8, pattern_str, "{40}") != null) {
            return "Address";
        }

        // Hash pattern: ^0x[0-9a-f]{64}$
        if (std.mem.indexOf(u8, pattern_str, "{64}") != null) {
            return "Hash";
        }

        // Quantity pattern: ^0x(0|[1-9a-f][0-9a-f]*)$
        if (std.mem.indexOf(u8, pattern_str, "[1-9a-f]") != null) {
            return "Quantity";
        }
    }

    // Check for enum (likely BlockTag)
    if (schema.object.get("enum")) |_| {
        return "BlockTag";
    }

    // Default to Quantity
    return "Quantity";
}

fn generateNamespaceMethodsJS(allocator: std.mem.Allocator, namespace: []const u8, methods: []const MethodInfo) !void {
    const path = try std.fmt.allocPrint(allocator, "src/jsonrpc/{s}/methods.js", .{namespace});
    defer allocator.free(path);

    const file = try std.fs.cwd().createFile(path, .{});
    defer file.close();

    var output: std.ArrayListUnmanaged(u8) = .{};
    defer output.deinit(allocator);
    const writer = output.writer(allocator);

    // Write header
    const ns_pascal = try toPascalCase(allocator, namespace);
    defer allocator.free(ns_pascal);

    try writer.print(
        \\/**
        \\ * {s} JSON-RPC Methods
        \\ *
        \\ * This module provides a type-safe mapping of {s} namespace methods to their types.
        \\ * All imports are kept separate to maintain tree-shakability.
        \\ */
        \\
        \\
    , .{ ns_pascal, namespace });

    // Generate imports
    try writer.writeAll("// Method imports - each import is separate for tree-shaking\n");
    for (methods) |m| {
        try writer.print("import * as {s} from './{s}/{s}.js'\n", .{ m.name, m.method_part, m.name });
    }
    try writer.writeAll("\n");

    // Generate enum (object-as-const pattern)
    try writer.print(
        \\/**
        \\ * Method name enum - provides string literals for each method
        \\ *
        \\ * @typedef {{(typeof {s}Method)[keyof typeof {s}Method]}} {s}Method
        \\ */
        \\export const {s}Method = {{
        \\
    , .{ ns_pascal, ns_pascal, ns_pascal, ns_pascal });

    for (methods) |m| {
        try writer.print("  {s}: '{s}',\n", .{ m.name, m.name });
    }

    try writer.writeAll("}\n\n");

    // Re-export individual method modules for direct access (tree-shakable)
    try writer.writeAll("// Re-export individual method modules for direct access (tree-shakable)\n");
    try writer.writeAll("export {\n");

    for (methods, 0..) |m, i| {
        try writer.print("  {s}", .{m.name});
        if (i < methods.len - 1) try writer.writeAll(",\n") else try writer.writeAll(",\n");
    }

    try writer.writeAll("}\n");

    try file.writeAll(output.items);
    std.debug.print("Generated {s}\n", .{path});
}

fn generateNamespaceMethodsZig(allocator: std.mem.Allocator, namespace: []const u8, methods: []const MethodInfo) !void {
    const path = try std.fmt.allocPrint(allocator, "src/jsonrpc/{s}/methods.zig", .{namespace});
    defer allocator.free(path);

    const file = try std.fs.cwd().createFile(path, .{});
    defer file.close();

    var output: std.ArrayListUnmanaged(u8) = .{};
    defer output.deinit(allocator);
    const writer = output.writer(allocator);

    const ns_pascal = try toPascalCase(allocator, namespace);
    defer allocator.free(ns_pascal);

    try writer.writeAll("const std = @import(\"std\");\n\n");

    // Generate imports
    try writer.print("// Import all {s} method modules\n", .{namespace});
    for (methods) |m| {
        try writer.print("const {s} = @import(\"{s}/{s}.zig\");\n", .{ m.name, m.method_part, m.name });
    }
    try writer.writeAll("\n");

    // Generate tagged union
    try writer.print(
        \\/// Tagged union of all {s} namespace methods
        \\/// Maps method names to their corresponding parameter and result types
        \\pub const {s}Method = union(enum) {{
        \\
    , .{ namespace, ns_pascal });

    for (methods) |m| {
        try writer.print(
            \\    {s}: struct {{
            \\        params: {s}.Params,
            \\        result: {s}.Result,
            \\    }},
            \\
        , .{ m.name, m.name, m.name });
    }

    try writer.print(
        \\
        \\    /// Get the method name string from the union tag
        \\    pub fn methodName(self: {s}Method) []const u8 {{
        \\        return switch (self) {{
        \\
    , .{ns_pascal});

    for (methods) |m| {
        try writer.print("            .{s} => {s}.method,\n", .{ m.name, m.name });
    }

    try writer.print(
        \\        }};
        \\    }}
        \\
        \\    /// Parse method name string to enum tag
        \\    pub fn fromMethodName(method_name: []const u8) !std.meta.Tag({s}Method) {{
        \\        const map = std.StaticStringMap(std.meta.Tag({s}Method)).initComptime(.{{
        \\
    , .{ ns_pascal, ns_pascal });

    for (methods) |m| {
        try writer.print("            .{{ \"{s}\", .{s} }},\n", .{ m.name, m.name });
    }

    try writer.writeAll(
        \\        });
        \\
        \\        return map.get(method_name) orelse error.UnknownMethod;
        \\    }
        \\};
        \\
    );

    try file.writeAll(output.items);
    std.debug.print("Generated {s}\n", .{path});
}

fn generateRootJsonRpcJS(allocator: std.mem.Allocator, namespaces: []const []const u8) !void {
    const path = "src/jsonrpc/JsonRpc.js";
    const file = try std.fs.cwd().createFile(path, .{});
    defer file.close();

    var output: std.ArrayListUnmanaged(u8) = .{};
    defer output.deinit(allocator);
    const writer = output.writer(allocator);

    try writer.writeAll(
        \\/**
        \\ * Ethereum JSON-RPC Type System
        \\ *
        \\ * This module provides the root JSON-RPC namespace that combines all method namespaces.
        \\ * Imports are kept tree-shakable - only import what you use.
        \\ */
        \\
        \\
    );

    // Re-export namespace methods
    for (namespaces) |ns| {
        try writer.print("export * from './{s}/methods.js'\n", .{ns});
    }

    try writer.writeAll("\n// Export primitive types separately\nexport * as types from './types/index.js'\n\n");

    // Generate JSDoc typedefs for type imports
    try writer.writeAll("/**\n");
    for (namespaces) |ns| {
        const ns_pascal = try toPascalCase(allocator, ns);
        defer allocator.free(ns_pascal);
        try writer.print(" * @typedef {{import('./{s}/methods.js').{s}Method}} {s}Method\n", .{ ns, ns_pascal, ns_pascal });
    }
    try writer.writeAll(" */\n\n");

    // Generate union type for all methods as JSDoc typedef
    try writer.writeAll("/**\n");
    try writer.writeAll(" * Union of all JSON-RPC method names\n");
    try writer.writeAll(" *\n");
    try writer.writeAll(" * @typedef {");
    for (namespaces, 0..) |ns, i| {
        const ns_pascal = try toPascalCase(allocator, ns);
        defer allocator.free(ns_pascal);
        try writer.print("{s}Method", .{ns_pascal});
        if (i < namespaces.len - 1) try writer.writeAll(" | ") else try writer.writeAll("} JsonRpcMethod\n");
    }
    try writer.writeAll(" */\n\n");

    // For now, skip the complex conditional types - JSDoc doesn't support them well
    // Users can import specific namespace types directly
    try writer.writeAll("export {}\n");

    try file.writeAll(output.items);
    std.debug.print("Generated {s}\n", .{path});
}

fn generateRootJsonRpcZig(allocator: std.mem.Allocator, namespaces: []const []const u8) !void {
    const path = "src/jsonrpc/JsonRpc.zig";
    const file = try std.fs.cwd().createFile(path, .{});
    defer file.close();

    var output: std.ArrayListUnmanaged(u8) = .{};
    defer output.deinit(allocator);
    const writer = output.writer(allocator);

    try writer.writeAll("const std = @import(\"std\");\n\n");

    // Import namespace methods
    for (namespaces) |ns| {
        const ns_pascal = try toPascalCase(allocator, ns);
        defer allocator.free(ns_pascal);
        try writer.print("const {s}Methods = @import(\"{s}/methods.zig\");\n", .{ ns, ns });
    }

    try writer.writeAll("\n// Export primitive types separately\npub const types = @import(\"types.zig\");\n\n");

    // Generate root tagged union
    try writer.writeAll(
        \\/// Root JSON-RPC method union combining all namespaces
        \\pub const JsonRpcMethod = union(enum) {
        \\
    );

    for (namespaces) |ns| {
        const ns_pascal = try toPascalCase(allocator, ns);
        defer allocator.free(ns_pascal);
        try writer.print("    {s}: {s}Methods.{s}Method,\n", .{ ns, ns, ns_pascal });
    }

    try writer.writeAll(
        \\
        \\    /// Get the full method name string
        \\    pub fn methodName(self: JsonRpcMethod) []const u8 {
        \\        return switch (self) {
        \\
    );

    for (namespaces) |ns| {
        try writer.print("            .{s} => |m| m.methodName(),\n", .{ns});
    }

    try writer.writeAll(
        \\        };
        \\    }
        \\};
        \\
    );

    try file.writeAll(output.items);
    std.debug.print("Generated {s}\n", .{path});
}

fn generateGoStruct(allocator: std.mem.Allocator, method: std.json.Value, _: []const u8, method_name: []const u8, file: std.fs.File) !void {
    var output: std.ArrayListUnmanaged(u8) = .{};
    defer output.deinit(allocator);
    const writer = output.writer(allocator);

    // Determine package name from method name (first part before underscore)
    var parts = std.mem.splitScalar(u8, method_name, '_');
    const package_name = parts.next() orelse "jsonrpc";

    // Write package declaration
    try writer.print("package {s}\n\n", .{package_name});

    // Write imports
    try writer.writeAll("import (\n");
    try writer.writeAll("\t\"encoding/json\"\n");
    try writer.writeAll("\t\"fmt\"\n\n");
    try writer.writeAll("\t\"github.com/ethereum/execution-apis/types\"\n");
    try writer.writeAll(")\n\n");

    // Write summary as comment
    if (method.object.get("summary")) |summary| {
        if (summary == .string) {
            try writer.writeAll("// ");
            try writer.writeAll(summary.string);
            try writer.writeAll("\n");
        }
    }

    // Write examples as comments
    if (method.object.get("examples")) |examples| {
        if (examples == .array and examples.array.items.len > 0) {
            try writer.writeAll("//\n// Example:\n");
            const first_example = examples.array.items[0];
            if (first_example.object.get("params")) |params| {
                if (params == .array) {
                    for (params.array.items) |param| {
                        if (param.object.get("name")) |name| {
                            if (param.object.get("value")) |value| {
                                try writer.writeAll("// ");
                                try writer.writeAll(name.string);
                                try writer.writeAll(": ");
                                try writeJsonValue(value, writer.any());
                                try writer.writeAll("\n");
                            }
                        }
                    }
                }
            }
            if (first_example.object.get("result")) |result| {
                if (result.object.get("value")) |value| {
                    try writer.writeAll("// Result: ");
                    try writeJsonValue(value, writer.any());
                    try writer.writeAll("\n");
                }
            }
        }
    }

    try writer.writeAll("//\n// Implements the ");
    try writer.writeAll(method_name);
    try writer.writeAll(" JSON-RPC method.\n");

    // Export method name constant
    try writer.writeAll("\n// Method is the JSON-RPC method name\n");
    try writer.writeAll("const Method = \"");
    try writer.writeAll(method_name);
    try writer.writeAll("\"\n\n");

    // Generate Params struct
    if (method.object.get("params")) |params| {
        if (params == .array) {
            try generateGoParams(allocator, params.array, method_name, writer.any());
        }
    }

    // Generate Result struct
    if (method.object.get("result")) |result| {
        try generateGoResult(allocator, result, method_name, writer.any());
    }

    try file.writeAll(output.items);
}

fn generateGoParams(allocator: std.mem.Allocator, params: std.json.Array, method_name: []const u8, writer: anytype) !void {
    try writer.writeAll("// Params represents the parameters for ");
    try writer.writeAll(method_name);
    try writer.writeAll("\ntype Params struct {\n");

    for (params.items) |param| {
        const param_name = param.object.get("name").?.string;
        const schema = param.object.get("schema").?;

        // Write doc comment for field
        if (schema.object.get("title")) |title| {
            try writer.writeAll("\t// ");
            try writer.writeAll(title.string);
            try writer.writeAll("\n");
        }

        // Determine field type and name (PascalCase for Go)
        const field_name = try toPascalCase(allocator, param_name);
        defer allocator.free(field_name);

        const field_type = try inferGoType(schema);
        try writer.writeAll("\t");
        try writer.writeAll(field_name);
        try writer.writeAll(" ");
        try writer.writeAll(field_type);
        try writer.print(" `json:\"-\"`\n", .{});
    }

    try writer.writeAll("}\n\n");

    // Custom JSON marshaling for positional array
    try writer.writeAll("// MarshalJSON implements json.Marshaler for Params.\n");
    try writer.writeAll("// JSON-RPC 2.0 uses positional array parameters.\n");
    try writer.writeAll("func (p Params) MarshalJSON() ([]byte, error) {\n");
    try writer.writeAll("\treturn json.Marshal([]interface{}{\n");

    for (params.items) |param| {
        const param_name = param.object.get("name").?.string;
        const field_name = try toPascalCase(allocator, param_name);
        defer allocator.free(field_name);

        try writer.writeAll("\t\tp.");
        try writer.writeAll(field_name);
        try writer.writeAll(",\n");
    }

    try writer.writeAll("\t})\n");
    try writer.writeAll("}\n\n");

    // Custom JSON unmarshaling
    try writer.writeAll("// UnmarshalJSON implements json.Unmarshaler for Params.\n");
    try writer.writeAll("func (p *Params) UnmarshalJSON(data []byte) error {\n");
    try writer.writeAll("\tvar arr []json.RawMessage\n");
    try writer.writeAll("\tif err := json.Unmarshal(data, &arr); err != nil {\n");
    try writer.writeAll("\t\treturn err\n");
    try writer.writeAll("\t}\n\n");
    try writer.print("\tif len(arr) != {d} {{\n", .{params.items.len});
    try writer.print("\t\treturn fmt.Errorf(\"expected {d} parameters, got %d\", len(arr))\n", .{params.items.len});
    try writer.writeAll("\t}\n\n");

    for (params.items, 0..) |param, i| {
        const param_name = param.object.get("name").?.string;
        const field_name = try toPascalCase(allocator, param_name);
        defer allocator.free(field_name);

        try writer.print("\tif err := json.Unmarshal(arr[{d}], &p.{s}); err != nil {{\n", .{ i, field_name });
        try writer.print("\t\treturn fmt.Errorf(\"parameter {d} ({s}): %w\", err)\n", .{ i, param_name });
        try writer.writeAll("\t}\n\n");
    }

    try writer.writeAll("\treturn nil\n");
    try writer.writeAll("}\n\n");
}

fn generateGoResult(allocator: std.mem.Allocator, result: std.json.Value, method_name: []const u8, writer: anytype) !void {
    _ = allocator;

    const schema = result.object.get("schema").?;
    const result_type = try inferGoType(schema);

    try writer.writeAll("// Result represents the result for ");
    try writer.writeAll(method_name);
    try writer.writeAll("\n");

    if (schema.object.get("title")) |title| {
        try writer.writeAll("//\n// ");
        try writer.writeAll(title.string);
        try writer.writeAll("\n");
    }

    try writer.writeAll("type Result struct {\n");
    try writer.writeAll("\tValue ");
    try writer.writeAll(result_type);
    try writer.writeAll(" `json:\"-\"`\n");
    try writer.writeAll("}\n\n");

    // Custom JSON marshaling - unwrap the Value field
    try writer.writeAll("// MarshalJSON implements json.Marshaler for Result.\n");
    try writer.writeAll("func (r Result) MarshalJSON() ([]byte, error) {\n");
    try writer.writeAll("\treturn json.Marshal(r.Value)\n");
    try writer.writeAll("}\n\n");

    // Custom JSON unmarshaling
    try writer.writeAll("// UnmarshalJSON implements json.Unmarshaler for Result.\n");
    try writer.writeAll("func (r *Result) UnmarshalJSON(data []byte) error {\n");
    try writer.writeAll("\treturn json.Unmarshal(data, &r.Value)\n");
    try writer.writeAll("}\n");
}

fn inferGoType(schema: std.json.Value) ![]const u8 {
    // Check for anyOf (union types like BlockSpec)
    if (schema.object.get("anyOf")) |_| {
        if (schema.object.get("title")) |title| {
            const title_str = title.string;
            if (std.mem.indexOf(u8, title_str, "Block") != null) {
                return "types.BlockSpec";
            }
        }
        return "types.BlockSpec";
    }

    // Check pattern to determine type
    if (schema.object.get("pattern")) |pattern| {
        const pattern_str = pattern.string;

        // Address pattern: ^0x[0-9a-fA-F]{40}$
        if (std.mem.indexOf(u8, pattern_str, "{40}") != null) {
            return "types.Address";
        }

        // Hash pattern: ^0x[0-9a-f]{64}$
        if (std.mem.indexOf(u8, pattern_str, "{64}") != null) {
            return "types.Hash";
        }

        // Quantity pattern: ^0x(0|[1-9a-f][0-9a-f]*)$
        if (std.mem.indexOf(u8, pattern_str, "[1-9a-f]") != null) {
            return "types.Quantity";
        }
    }

    // Check for enum (likely BlockTag)
    if (schema.object.get("enum")) |_| {
        return "types.BlockTag";
    }

    // Default to Quantity
    return "types.Quantity";
}

fn generateNamespaceMethodsGo(allocator: std.mem.Allocator, namespace: []const u8, methods: []const MethodInfo) !void {
    const path = try std.fmt.allocPrint(allocator, "src/jsonrpc/{s}/methods.go", .{namespace});
    defer allocator.free(path);

    const file = try std.fs.cwd().createFile(path, .{});
    defer file.close();

    var output: std.ArrayListUnmanaged(u8) = .{};
    defer output.deinit(allocator);
    const writer = output.writer(allocator);

    const ns_pascal = try toPascalCase(allocator, namespace);
    defer allocator.free(ns_pascal);

    // Write package declaration
    try writer.print("package {s}\n\n", .{namespace});

    // Write file comment
    try writer.print(
        \\// Package {s} provides {s} JSON-RPC methods.
        \\//
        \\// This file provides a type-safe mapping of {s} namespace methods.
        \\
        \\
    , .{ namespace, ns_pascal, namespace });

    // Generate method name constants
    try writer.writeAll("// Method name constants\n");
    try writer.writeAll("const (\n");

    for (methods) |m| {
        const const_name = try toPascalCase(allocator, m.name);
        defer allocator.free(const_name);

        try writer.print("\tMethod{s} = \"{s}\"\n", .{ const_name, m.name });
    }

    try writer.writeAll(")\n\n");

    // Generate method registry
    try writer.writeAll("// MethodRegistry maps method names to their string identifiers\n");
    try writer.print("var MethodRegistry = map[string]string{{\n", .{});

    for (methods) |m| {
        const const_name = try toPascalCase(allocator, m.name);
        defer allocator.free(const_name);

        try writer.print("\t\"{s}\": Method{s},\n", .{ m.name, const_name });
    }

    try writer.writeAll("}\n");

    try file.writeAll(output.items);
    std.debug.print("Generated {s}\n", .{path});
}

fn generateRootJsonRpcGo(allocator: std.mem.Allocator, namespaces: []const []const u8) !void {
    const path = "src/jsonrpc/jsonrpc.go";
    const file = try std.fs.cwd().createFile(path, .{});
    defer file.close();

    var output: std.ArrayListUnmanaged(u8) = .{};
    defer output.deinit(allocator);
    const writer = output.writer(allocator);

    try writer.writeAll(
        \\// Package jsonrpc provides Ethereum JSON-RPC type definitions.
        \\//
        \\// This package combines all namespace methods into a unified interface.
        \\// Methods are organized by namespace for tree-shakability - import only
        \\// the namespaces you need.
        \\package jsonrpc
        \\
        \\
    );

    // Document available namespaces
    try writer.writeAll("// Available namespaces:\n");
    for (namespaces) |ns| {
        try writer.print("//   - {s}: import \"github.com/ethereum/execution-apis/{s}\"\n", .{ ns, ns });
    }
    try writer.writeAll("//\n");
    try writer.writeAll("// Primitive types are available at:\n");
    try writer.writeAll("//   - types: import \"github.com/ethereum/execution-apis/types\"\n");

    try file.writeAll(output.items);
    std.debug.print("Generated {s}\n", .{path});
}
