const std = @import("std");
const primitives = @import("primitives");

/// ABI Encoding Example (Zig)
///
/// Demonstrates:
/// - Converting addresses to/from ABI-encoded format
/// - Understanding 32-byte ABI encoding (left-padded)
/// - Working with contract call data
/// - Extracting addresses from logs and return data
pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    try stdout.writeAll("=== ABI Encoding Example (Zig) ===\n\n");

    // 1. Basic ABI encoding
    try stdout.writeAll("1. Basic ABI Encoding\n\n");

    const addr = try primitives.Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
    var checksum_buf: [42]u8 = undefined;
    const checksum = try primitives.Address.toChecksummed(&addr, &checksum_buf, allocator);

    try stdout.print("Original address: {s}\n", .{checksum});
    try stdout.print("Length: {} bytes\n\n", .{addr.len});

    // Encode to 32-byte ABI format (left-padded with zeros)
    var encoded: [32]u8 = undefined;
    primitives.Address.toAbiEncoded(&addr, &encoded);

    var encoded_hex_buf: [66]u8 = undefined;
    const encoded_hex = try primitives.Hex.fromBytes(&encoded, &encoded_hex_buf);
    try stdout.print("ABI-encoded: {s}\n", .{encoded_hex});
    try stdout.print("Length: {} bytes\n\n", .{encoded.len});

    // Show padding structure
    try stdout.writeAll("Structure breakdown:\n");
    var padding_buf: [26]u8 = undefined;
    var addr_buf: [42]u8 = undefined;
    try stdout.print("  First 12 bytes (padding): {s}\n", .{try primitives.Hex.fromBytes(encoded[0..12], &padding_buf)});
    try stdout.print("  Last 20 bytes (address):  {s}\n", .{try primitives.Hex.fromBytes(encoded[12..32], &addr_buf)});
    try stdout.writeAll("\n");

    // 2. Decoding ABI-encoded addresses
    try stdout.writeAll("2. Decoding ABI-Encoded Addresses\n\n");

    // Decode back to address
    const decoded = primitives.Address.fromAbiEncoded(&encoded);
    var decoded_checksum_buf: [42]u8 = undefined;
    const decoded_checksum = try primitives.Address.toChecksummed(&decoded, &decoded_checksum_buf, allocator);

    try stdout.print("Decoded address: {s}\n", .{decoded_checksum});
    try stdout.print("Equals original: {}\n\n", .{primitives.Address.equals(&decoded, &addr)});

    // Example: decoding from contract return data
    const return_data = try primitives.Hex.toBytes("0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e", allocator);
    defer allocator.free(return_data);

    const addr_from_return = primitives.Address.fromAbiEncoded(return_data[0..32]);
    var return_checksum_buf: [42]u8 = undefined;

    try stdout.writeAll("From contract return data:\n");
    var return_hex_buf: [66]u8 = undefined;
    try stdout.print("  Raw: {s}\n", .{try primitives.Hex.fromBytes(return_data, &return_hex_buf)});
    try stdout.print("  Decoded: {s}\n\n", .{try primitives.Address.toChecksummed(&addr_from_return, &return_checksum_buf, allocator)});

    // 3. Multiple addresses in calldata
    try stdout.writeAll("3. Multiple Addresses in Calldata\n\n");

    // Example: transfer(address to, uint256 amount)
    const function_selector = "0xa9059cbb";
    const to_address = try primitives.Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
    const amount: u256 = 1000;

    try stdout.writeAll("Building transfer() calldata:\n");
    try stdout.writeAll("  Function: transfer(address,uint256)\n");
    try stdout.print("  Selector: {s}\n", .{function_selector});
    var to_checksum_buf: [42]u8 = undefined;
    try stdout.print("  To: {s}\n", .{try primitives.Address.toChecksummed(&to_address, &to_checksum_buf, allocator)});
    try stdout.print("  Amount: {}\n\n", .{amount});

    // Encode address parameter
    var encoded_to: [32]u8 = undefined;
    primitives.Address.toAbiEncoded(&to_address, &encoded_to);

    // Encode amount (32-byte big-endian)
    var amount_bytes: [32]u8 = [_]u8{0} ** 32;
    std.mem.writeInt(u256, &amount_bytes, amount, .big);

    // Concatenate: selector + encodedTo + amountBytes
    const selector_bytes = try primitives.Hex.toBytes(function_selector, allocator);
    defer allocator.free(selector_bytes);

    var calldata = std.ArrayList(u8){};
    defer calldata.deinit(allocator);

    try calldata.appendSlice(allocator, selector_bytes);
    try calldata.appendSlice(allocator, &encoded_to);
    try calldata.appendSlice(allocator, &amount_bytes);

    const calldata_hex_buf = try allocator.alloc(u8, calldata.items.len * 2 + 2);
    defer allocator.free(calldata_hex_buf);
    const calldata_hex = try primitives.Hex.fromBytes(calldata.items, calldata_hex_buf);

    try stdout.print("Calldata: {s}\n", .{calldata_hex});
    var selector_hex_buf: [10]u8 = undefined;
    var addr_hex_buf: [66]u8 = undefined;
    var amount_hex_buf: [66]u8 = undefined;
    try stdout.print("  Bytes 0-3:   {s} (selector)\n", .{try primitives.Hex.fromBytes(calldata.items[0..4], &selector_hex_buf)});
    try stdout.print("  Bytes 4-35:  {s} (address)\n", .{try primitives.Hex.fromBytes(calldata.items[4..36], &addr_hex_buf)});
    try stdout.print("  Bytes 36-67: {s} (amount)\n\n", .{try primitives.Hex.fromBytes(calldata.items[36..68], &amount_hex_buf)});

    // 4. Extracting addresses from calldata
    try stdout.writeAll("4. Extracting Addresses from Calldata\n\n");

    // Parse address from calldata (skip selector, read first parameter)
    const ExtractHelper = struct {
        fn extractAddressParam(data: []const u8, param_index: usize) ?primitives.Address {
            const offset = 4 + param_index * 32; // Skip 4-byte selector
            if (data.len < offset + 32) return null;

            const param_data = data[offset .. offset + 32];
            return primitives.Address.fromAbiEncoded(param_data[0..32]);
        }
    };

    const extracted_to = ExtractHelper.extractAddressParam(calldata.items, 0);
    if (extracted_to) |ex_addr| {
        var ex_checksum_buf: [42]u8 = undefined;
        try stdout.print("Extracted 'to' address: {s}\n", .{try primitives.Address.toChecksummed(&ex_addr, &ex_checksum_buf, allocator)});
        try stdout.print("Matches original: {}\n\n", .{primitives.Address.equals(&ex_addr, &to_address)});
    }

    // 5. Working with event logs
    try stdout.writeAll("5. Working with Event Logs\n\n");

    try stdout.writeAll("Transfer event structure:\n");
    try stdout.writeAll("  topic[0]: event signature hash\n");
    try stdout.writeAll("  topic[1]: from address (indexed)\n");
    try stdout.writeAll("  topic[2]: to address (indexed)\n");
    try stdout.writeAll("  data:     amount (non-indexed)\n\n");

    // Indexed addresses in topics are ABI-encoded (32 bytes)
    const from_topic = try primitives.Hex.toBytes("0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045", allocator);
    defer allocator.free(from_topic);
    const to_topic = try primitives.Hex.toBytes("0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e", allocator);
    defer allocator.free(to_topic);

    const from_addr = primitives.Address.fromAbiEncoded(from_topic[0..32]);
    const to_addr = primitives.Address.fromAbiEncoded(to_topic[0..32]);

    var from_checksum_buf: [42]u8 = undefined;
    var to_topic_checksum_buf: [42]u8 = undefined;

    try stdout.print("From: {s}\n", .{try primitives.Address.toChecksummed(&from_addr, &from_checksum_buf, allocator)});
    try stdout.print("To:   {s}\n\n", .{try primitives.Address.toChecksummed(&to_addr, &to_topic_checksum_buf, allocator)});

    // 6. Array of addresses
    try stdout.writeAll("6. Array of Addresses in ABI\n\n");

    const targets = [_]primitives.Address{
        try primitives.Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
        try primitives.Address.fromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
        try primitives.Address.fromHex("0x0000000000000000000000000000000000000001"),
    };

    try stdout.writeAll("Encoding address array:\n");
    try stdout.print("  Count: {}\n", .{targets.len});

    // Encode array: offset + length + elements
    var array_encoding = std.ArrayList(u8){};
    defer array_encoding.deinit(allocator);

    // Offset to array data (typically 0x20 for dynamic arrays)
    var offset_bytes: [32]u8 = [_]u8{0} ** 32;
    std.mem.writeInt(u256, &offset_bytes, 32, .big);
    try array_encoding.appendSlice(allocator, &offset_bytes);

    // Array length
    var length_bytes: [32]u8 = [_]u8{0} ** 32;
    std.mem.writeInt(u256, &length_bytes, targets.len, .big);
    try array_encoding.appendSlice(allocator, &length_bytes);

    // Encode each address
    for (targets) |target| {
        var target_encoded: [32]u8 = undefined;
        primitives.Address.toAbiEncoded(&target, &target_encoded);
        try array_encoding.appendSlice(allocator, &target_encoded);
    }

    const array_hex_buf = try allocator.alloc(u8, array_encoding.items.len * 2 + 2);
    defer allocator.free(array_hex_buf);

    try stdout.print("Encoded array: {s}\n", .{try primitives.Hex.fromBytes(array_encoding.items, array_hex_buf)});
    var elem_buf: [66]u8 = undefined;
    try stdout.print("  Offset:    {s}\n", .{try primitives.Hex.fromBytes(array_encoding.items[0..32], &elem_buf)});
    try stdout.print("  Length:    {s}\n", .{try primitives.Hex.fromBytes(array_encoding.items[32..64], &elem_buf)});
    try stdout.print("  Element 0: {s}\n", .{try primitives.Hex.fromBytes(array_encoding.items[64..96], &elem_buf)});
    try stdout.print("  Element 1: {s}\n", .{try primitives.Hex.fromBytes(array_encoding.items[96..128], &elem_buf)});
    try stdout.print("  Element 2: {s}\n\n", .{try primitives.Hex.fromBytes(array_encoding.items[128..160], &elem_buf)});

    // 7. Numeric conversion via ABI encoding
    try stdout.writeAll("7. Numeric Conversion via ABI Encoding\n\n");

    const numeric_addr = primitives.Address.fromNumber(42);
    var numeric_hex_buf: [42]u8 = undefined;
    try stdout.print("Address from number: {s}\n", .{try primitives.Address.toHex(&numeric_addr, &numeric_hex_buf)});

    var numeric_abi: [32]u8 = undefined;
    primitives.Address.toAbiEncoded(&numeric_addr, &numeric_abi);
    var numeric_abi_hex_buf: [66]u8 = undefined;
    try stdout.print("ABI-encoded: {s}\n", .{try primitives.Hex.fromBytes(&numeric_abi, &numeric_abi_hex_buf)});

    const as_u256 = primitives.Address.toU256(&numeric_addr);
    try stdout.print("As U256: {}\n", .{as_u256});
    try stdout.print("Matches 42: {}\n\n", .{as_u256 == 42});

    // 8. Error handling
    try stdout.writeAll("8. Error Handling\n\n");

    // Verify padding bytes are zero (good practice)
    const ValidationHelper = struct {
        fn isValidAbiEncoding(data: *const [32]u8) bool {
            // Check first 12 bytes are zero
            for (data[0..12]) |byte| {
                if (byte != 0) return false;
            }
            return true;
        }
    };

    var valid_abi: [32]u8 = undefined;
    primitives.Address.toAbiEncoded(&addr, &valid_abi);
    try stdout.print("✓ Valid padding: {}\n", .{ValidationHelper.isValidAbiEncoding(&valid_abi)});

    var invalid_abi: [32]u8 = [_]u8{0} ** 32;
    invalid_abi[5] = 1; // Non-zero in padding region
    try stdout.print("✗ Invalid padding: {}\n\n", .{ValidationHelper.isValidAbiEncoding(&invalid_abi)});

    // 9. Common patterns
    try stdout.writeAll("9. Common Patterns\n\n");

    try stdout.writeAll("Reading address from contract return:\n");
    try stdout.writeAll("  const addr = primitives.Address.fromAbiEncoded(return_data[0..32]);\n\n");

    try stdout.writeAll("Encoding address for function call:\n");
    try stdout.writeAll("  var encoded: [32]u8 = undefined;\n");
    try stdout.writeAll("  primitives.Address.toAbiEncoded(&addr, &encoded);\n\n");

    try stdout.writeAll("Parsing Transfer event logs:\n");
    try stdout.writeAll("  const from = primitives.Address.fromAbiEncoded(topics[1]);\n");
    try stdout.writeAll("  const to = primitives.Address.fromAbiEncoded(topics[2]);\n\n");

    try stdout.writeAll("Building calldata:\n");
    try stdout.writeAll("  try calldata.appendSlice(allocator, selector);\n");
    try stdout.writeAll("  try calldata.appendSlice(allocator, &encoded_addr);\n");
}
