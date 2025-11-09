const std = @import("std");
const precompiles = @import("precompiles");
const crypto = @import("crypto");
const primitives = @import("primitives");
const Secp256k1 = crypto.Secp256k1;
const Keccak256 = crypto.Keccak256;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== ECRECOVER Signature Verification ===\n\n", .{});

    // Simulate a signed message scenario
    var signer_key: [32]u8 = undefined;
    crypto.getRandomValues(&signer_key);
    const signer_pub_key = try Secp256k1.derivePublicKey(&signer_key);
    const pub_hash = Keccak256.hash(&signer_pub_key);
    const signer_address = pub_hash[12..32];

    std.debug.print("Signer address: 0x{s}\n", .{std.fmt.fmtSliceHexLower(signer_address)});

    // Example 1: Verify a signed authentication message
    std.debug.print("\n=== Example 1: Authentication Message ===\n", .{});
    const auth_msg = "I authorize this action at timestamp 1234567890";
    const auth_hash = Keccak256.hash(auth_msg);
    const auth_sig = try Secp256k1.sign(&auth_hash, &signer_key);

    // Prepare ECRECOVER input
    var auth_input: [128]u8 = [_]u8{0} ** 128;
    @memcpy(auth_input[0..32], &auth_hash);
    auth_input[63] = auth_sig.v;
    @memcpy(auth_input[64..96], &auth_sig.r);
    @memcpy(auth_input[96..128], &auth_sig.s);

    const auth_result = try precompiles.ecrecover.execute(allocator, &auth_input, 10000);
    defer auth_result.deinit(allocator);

    const recovered_addr = auth_result.output[12..32];
    const is_valid = std.mem.eql(u8, recovered_addr, signer_address);
    std.debug.print("Message: {s}\n", .{auth_msg});
    std.debug.print("Signature valid: {s}\n", .{if (is_valid) "✓ Yes" else "✗ No"});
    std.debug.print("Gas used: {}\n", .{auth_result.gas_used});

    // Example 2: Batch signature verification
    std.debug.print("\n=== Example 2: Batch Verification ===\n", .{});
    const messages = [_][]const u8{
        "Transfer 100 tokens to Alice",
        "Transfer 50 tokens to Bob",
        "Update contract state",
    };

    var total_gas: u64 = 0;
    var valid_count: u32 = 0;

    for (messages) |msg| {
        const msg_hash = Keccak256.hash(msg);
        const sig = try Secp256k1.sign(&msg_hash, &signer_key);

        var input: [128]u8 = [_]u8{0} ** 128;
        @memcpy(input[0..32], &msg_hash);
        input[63] = sig.v;
        @memcpy(input[64..96], &sig.r);
        @memcpy(input[96..128], &sig.s);

        const result = try precompiles.ecrecover.execute(allocator, &input, 10000);
        defer result.deinit(allocator);

        const rec_addr = result.output[12..32];
        if (std.mem.eql(u8, rec_addr, signer_address)) {
            valid_count += 1;
        }
        total_gas += result.gas_used;
    }

    std.debug.print("Total messages: {}\n", .{messages.len});
    std.debug.print("Valid signatures: {}\n", .{valid_count});
    std.debug.print("Total gas: {} (3000 per signature)\n", .{total_gas});
    std.debug.print("Average gas: {}\n", .{total_gas / messages.len});

    // Example 3: EIP-2 Signature Malleability Protection
    std.debug.print("\n=== Example 3: EIP-2 Malleability Protection ===\n", .{});
    const test_msg = "Test message";
    const test_hash = Keccak256.hash(test_msg);
    const valid_sig = try Secp256k1.sign(&test_hash, &signer_key);

    // secp256k1 curve order: n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
    // s value in signature should be ≤ n/2
    std.debug.print("Signature created with EIP-2 compliant s value\n", .{});

    var valid_input: [128]u8 = [_]u8{0} ** 128;
    @memcpy(valid_input[0..32], &test_hash);
    valid_input[63] = valid_sig.v;
    @memcpy(valid_input[64..96], &valid_sig.r);
    @memcpy(valid_input[96..128], &valid_sig.s);

    const valid_result = try precompiles.ecrecover.execute(allocator, &valid_input, 10000);
    defer valid_result.deinit(allocator);

    const valid_recovered = valid_result.output[12..32];
    const valid_match = std.mem.eql(u8, valid_recovered, signer_address);
    std.debug.print("Valid s value accepted: {s}\n", .{if (valid_match) "✓ Yes" else "✗ No"});

    // Example 4: Wrong signer detection
    std.debug.print("\n=== Example 4: Wrong Signer Detection ===\n", .{});
    var wrong_key: [32]u8 = undefined;
    crypto.getRandomValues(&wrong_key);
    const wrong_pub = try Secp256k1.derivePublicKey(&wrong_key);
    const wrong_pub_hash = Keccak256.hash(&wrong_pub);
    const wrong_address = wrong_pub_hash[12..32];

    // Sign message with wrong key
    const wrong_sig = try Secp256k1.sign(&test_hash, &wrong_key);

    var wrong_input: [128]u8 = [_]u8{0} ** 128;
    @memcpy(wrong_input[0..32], &test_hash);
    wrong_input[63] = wrong_sig.v;
    @memcpy(wrong_input[64..96], &wrong_sig.r);
    @memcpy(wrong_input[96..128], &wrong_sig.s);

    const wrong_result = try precompiles.ecrecover.execute(allocator, &wrong_input, 10000);
    defer wrong_result.deinit(allocator);

    const wrong_recovered = wrong_result.output[12..32];
    const wrong_match = std.mem.eql(u8, wrong_recovered, signer_address);
    std.debug.print("Expected signer: 0x{s}\n", .{std.fmt.fmtSliceHexLower(signer_address)});
    std.debug.print("Recovered signer: 0x{s}\n", .{std.fmt.fmtSliceHexLower(wrong_recovered)});
    std.debug.print("Signature from expected signer: {s}\n", .{if (wrong_match) "✓ Yes" else "✗ No (correct)"});

    std.debug.print("\n=== Gas Cost Summary ===\n", .{});
    std.debug.print("Per signature: 3000 gas (fixed cost)\n", .{});
    std.debug.print("Batch of 10 signatures: 30,000 gas\n", .{});
    std.debug.print("Batch of 100 signatures: 300,000 gas\n", .{});
    std.debug.print("Note: Cost is constant regardless of signature validity\n", .{});
}
