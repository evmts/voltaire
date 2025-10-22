// EIP-712 Typed Data Signing Example
//
// ⚠️ WARNING: UNAUDITED CRYPTOGRAPHIC IMPLEMENTATION ⚠️
//
// This example demonstrates the EIP-712 typed data signing API provided by the
// primitives library. All cryptographic functions shown here are UNAUDITED and
// should NOT be used in production without proper security review.
//
// EIP-712 vulnerabilities can lead to signature forgery, phishing attacks, and
// unauthorized transactions. Use only audited implementations for production.

const std = @import("std");
const crypto = @import("crypto");
const primitives = @import("primitives");

const Eip712 = crypto.Eip712;
const Crypto = crypto.Crypto;
const Hex = primitives.Hex;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== EIP-712 Typed Data Signing Example ===\n\n", .{});

    // PART 1: Create a domain separator
    // The domain separator prevents signature replay across different applications
    std.debug.print("1. Creating EIP-712 Domain Separator\n", .{});
    std.debug.print("   Domain separators prevent cross-application signature replay.\n\n", .{});

    const domain = try Eip712.create_domain(
        allocator,
        "MyDApp", // Application name
        "1.0.0", // Version
        1, // Chain ID (1 = Ethereum mainnet)
        null, // Verifying contract address (optional)
    );
    defer {
        var mut_domain = domain;
        mut_domain.deinit(allocator);
    }

    std.debug.print("   Domain created:\n", .{});
    std.debug.print("   - Name: {s}\n", .{domain.name.?});
    std.debug.print("   - Version: {s}\n", .{domain.version.?});
    std.debug.print("   - Chain ID: {d}\n\n", .{domain.chain_id.?});

    // PART 2: Create typed data structure
    // This defines the message type and its fields
    std.debug.print("2. Creating Typed Data Structure\n", .{});
    std.debug.print("   Typed data defines the structure of the message being signed.\n\n", .{});

    var typed_data = try Eip712.create_simple_typed_data(allocator, domain, "Transfer");
    defer typed_data.deinit(allocator);

    // Define the Transfer type with its fields
    const transfer_props = [_]Eip712.TypeProperty{
        Eip712.TypeProperty{ .name = "from", .type = "address" },
        Eip712.TypeProperty{ .name = "to", .type = "address" },
        Eip712.TypeProperty{ .name = "amount", .type = "uint256" },
    };
    try typed_data.types.put(allocator, "Transfer", &transfer_props);

    std.debug.print("   Type 'Transfer' defined with fields:\n", .{});
    std.debug.print("   - from: address\n", .{});
    std.debug.print("   - to: address\n", .{});
    std.debug.print("   - amount: uint256\n\n", .{});

    // PART 3: Create message data
    // Fill in the actual values for the message
    std.debug.print("3. Adding Message Data\n", .{});

    const from_address = [_]u8{0xAA} ** 20;
    const to_address = [_]u8{0xBB} ** 20;
    const amount: u256 = 1000000000000000000; // 1.0 tokens (18 decimals)

    try typed_data.message.put(
        try allocator.dupe(u8, "from"),
        Eip712.MessageValue{ .address = from_address },
    );
    try typed_data.message.put(
        try allocator.dupe(u8, "to"),
        Eip712.MessageValue{ .address = to_address },
    );
    try typed_data.message.put(
        try allocator.dupe(u8, "amount"),
        Eip712.MessageValue{ .number = amount },
    );

    std.debug.print("   Message values:\n", .{});
    std.debug.print("   - from: 0x", .{});
    for (from_address) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\n   - to: 0x", .{});
    for (to_address) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\n   - amount: {d}\n\n", .{amount});

    // PART 4: Hash the typed data
    // ⚠️ UNAUDITED FUNCTION
    std.debug.print("4. Hashing Typed Data (UNAUDITED)\n", .{});
    std.debug.print("   ⚠️  WARNING: unaudited_hashTypedData is NOT security audited\n", .{});
    std.debug.print("   This computes: keccak256(\"\\x19\\x01\" || domainSeparator || structHash)\n\n", .{});

    const hash = try Eip712.unaudited_hashTypedData(allocator, &typed_data);

    std.debug.print("   Typed data hash: 0x", .{});
    for (hash) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\n\n", .{});

    // PART 5: Generate a key pair for signing
    std.debug.print("5. Generating Key Pair\n", .{});
    std.debug.print("   ⚠️  WARNING: unaudited cryptographic key generation\n\n", .{});

    const private_key = try Crypto.unaudited_randomPrivateKey();
    const public_key = try Crypto.unaudited_getPublicKey(private_key);
    const signer_address = Crypto.publicKeyToAddress(public_key);

    std.debug.print("   Signer address: 0x", .{});
    for (signer_address.bytes) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\n\n", .{});

    // PART 6: Sign the typed data
    // ⚠️ UNAUDITED FUNCTION
    std.debug.print("6. Signing Typed Data (UNAUDITED)\n", .{});
    std.debug.print("   ⚠️  WARNING: unaudited_signTypedData is NOT security audited\n", .{});
    std.debug.print("   This creates an ECDSA signature over the typed data hash.\n\n", .{});

    const signature = try Eip712.unaudited_signTypedData(allocator, &typed_data, private_key);

    std.debug.print("   Signature created:\n", .{});
    const sig_bytes = signature.toBytes();
    std.debug.print("   - r: 0x", .{});
    for (sig_bytes[0..32]) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\n   - s: 0x", .{});
    for (sig_bytes[32..64]) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\n   - v: {d}\n\n", .{signature.v});

    // PART 7: Verify the signature
    // ⚠️ UNAUDITED FUNCTION
    std.debug.print("7. Verifying Typed Data Signature (UNAUDITED)\n", .{});
    std.debug.print("   ⚠️  WARNING: unaudited_verifyTypedData is NOT security audited\n\n", .{});

    const is_valid = try Eip712.unaudited_verifyTypedData(
        allocator,
        &typed_data,
        signature,
        signer_address,
    );

    std.debug.print("   Signature valid: {}\n\n", .{is_valid});

    if (!is_valid) {
        std.debug.print("   ERROR: Signature verification failed!\n", .{});
        return error.InvalidSignature;
    }

    // PART 8: Recover address from signature
    // ⚠️ UNAUDITED FUNCTION
    std.debug.print("8. Recovering Address from Signature (UNAUDITED)\n", .{});
    std.debug.print("   ⚠️  WARNING: unaudited_recoverTypedDataAddress is NOT security audited\n", .{});
    std.debug.print("   This extracts the signer's address from the signature.\n\n", .{});

    const recovered_address = try Eip712.unaudited_recoverTypedDataAddress(
        allocator,
        &typed_data,
        signature,
    );

    std.debug.print("   Recovered address: 0x", .{});
    for (recovered_address) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\n\n", .{});

    // Verify the recovered address matches the signer
    const addresses_match = std.mem.eql(u8, &recovered_address, &signer_address);
    std.debug.print("   Address matches signer: {}\n\n", .{addresses_match});

    if (!addresses_match) {
        std.debug.print("   ERROR: Recovered address does not match signer!\n", .{});
        return error.AddressMismatch;
    }

    // PART 9: Demonstrate nested types
    std.debug.print("9. Example with Nested Types\n", .{});
    std.debug.print("   EIP-712 supports nested custom types for complex data structures.\n\n", .{});

    var nested_typed_data = try Eip712.create_simple_typed_data(allocator, domain, "Mail");
    defer nested_typed_data.deinit(allocator);

    // Define Person type
    const person_props = [_]Eip712.TypeProperty{
        Eip712.TypeProperty{ .name = "name", .type = "string" },
        Eip712.TypeProperty{ .name = "wallet", .type = "address" },
    };
    try nested_typed_data.types.put(allocator, "Person", &person_props);

    // Define Mail type that uses Person
    const mail_props = [_]Eip712.TypeProperty{
        Eip712.TypeProperty{ .name = "from", .type = "Person" },
        Eip712.TypeProperty{ .name = "to", .type = "Person" },
        Eip712.TypeProperty{ .name = "contents", .type = "string" },
    };
    try nested_typed_data.types.put(allocator, "Mail", &mail_props);

    // Create from person
    var from_person = std.StringHashMap(Eip712.MessageValue).init(allocator);
    try from_person.put(
        try allocator.dupe(u8, "name"),
        Eip712.MessageValue{ .string = try allocator.dupe(u8, "Alice") },
    );
    try from_person.put(
        try allocator.dupe(u8, "wallet"),
        Eip712.MessageValue{ .address = [_]u8{0xAA} ** 20 },
    );

    // Create to person
    var to_person = std.StringHashMap(Eip712.MessageValue).init(allocator);
    try to_person.put(
        try allocator.dupe(u8, "name"),
        Eip712.MessageValue{ .string = try allocator.dupe(u8, "Bob") },
    );
    try to_person.put(
        try allocator.dupe(u8, "wallet"),
        Eip712.MessageValue{ .address = [_]u8{0xBB} ** 20 },
    );

    // Create mail message
    try nested_typed_data.message.put(
        try allocator.dupe(u8, "from"),
        Eip712.MessageValue{ .object = from_person },
    );
    try nested_typed_data.message.put(
        try allocator.dupe(u8, "to"),
        Eip712.MessageValue{ .object = to_person },
    );
    try nested_typed_data.message.put(
        try allocator.dupe(u8, "contents"),
        Eip712.MessageValue{ .string = try allocator.dupe(u8, "Hello, Bob!") },
    );

    std.debug.print("   Nested type structure:\n", .{});
    std.debug.print("   Mail {\n", .{});
    std.debug.print("     from: Person { name: \"Alice\", wallet: 0xAA... },\n", .{});
    std.debug.print("     to: Person { name: \"Bob\", wallet: 0xBB... },\n", .{});
    std.debug.print("     contents: \"Hello, Bob!\"\n", .{});
    std.debug.print("   }\n\n", .{});

    const nested_hash = try Eip712.unaudited_hashTypedData(allocator, &nested_typed_data);

    std.debug.print("   Nested typed data hash: 0x", .{});
    for (nested_hash) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\n\n", .{});

    const nested_signature = try Eip712.unaudited_signTypedData(
        allocator,
        &nested_typed_data,
        private_key,
    );
    const nested_valid = try Eip712.unaudited_verifyTypedData(
        allocator,
        &nested_typed_data,
        nested_signature,
        signer_address,
    );

    std.debug.print("   Nested structure signature valid: {}\n\n", .{nested_valid});

    // Summary
    std.debug.print("=== Summary ===\n\n", .{});
    std.debug.print("This example demonstrated:\n", .{});
    std.debug.print("1. Creating domain separators with create_domain()\n", .{});
    std.debug.print("2. Creating typed data structures with create_simple_typed_data()\n", .{});
    std.debug.print("3. Hashing typed data with unaudited_hashTypedData()\n", .{});
    std.debug.print("4. Signing typed data with unaudited_signTypedData()\n", .{});
    std.debug.print("5. Verifying signatures with unaudited_verifyTypedData()\n", .{});
    std.debug.print("6. Recovering addresses with unaudited_recoverTypedDataAddress()\n", .{});
    std.debug.print("7. Working with nested custom types\n\n", .{});

    std.debug.print("⚠️  CRITICAL SECURITY WARNING ⚠️\n\n", .{});
    std.debug.print("All functions demonstrated in this example are UNAUDITED and have NOT\n", .{});
    std.debug.print("undergone security review. DO NOT use them in production environments\n", .{});
    std.debug.print("where they could control real assets or sensitive operations.\n\n", .{});
    std.debug.print("Potential vulnerabilities include:\n", .{});
    std.debug.print("- Type encoding errors leading to signature forgery\n", .{});
    std.debug.print("- Hash collision attacks\n", .{});
    std.debug.print("- Signature malleability\n", .{});
    std.debug.print("- Domain separator weaknesses\n", .{});
    std.debug.print("- Replay attacks across chains or contracts\n\n", .{});
    std.debug.print("Use only audited EIP-712 implementations for production systems.\n\n", .{});

    std.debug.print("Example completed successfully.\n", .{});
}
