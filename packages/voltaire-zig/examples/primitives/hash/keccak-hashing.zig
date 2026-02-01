const std = @import("std");
const primitives = @import("primitives");
const Hash = primitives.hash.Hash;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const a = gpa.allocator();

    std.debug.print("\n=== Keccak-256 Hashing Example ===\n\n", .{});

    // ============================================================
    // 1. Basic Hashing Methods
    // ============================================================

    std.debug.print("1. Basic Hashing Methods\n\n", .{});

    // Hash raw bytes
    const data = [_]u8{ 1, 2, 3, 4, 5 };
    const bytes_hash = try Hash.keccak256(&data);
    const bytes_hex = Hash.toHex(bytes_hash);
    std.debug.print("Bytes hash:  {s}\n", .{&bytes_hex});

    // Hash UTF-8 string
    const string_hash = try Hash.keccak256String("hello");
    const string_hex = Hash.toHex(string_hash);
    std.debug.print("String hash: {s}\n", .{&string_hex});

    // Hash hex-encoded data
    const hex_hash = try Hash.keccak256Hex("0x1234");
    const hex_hex = Hash.toHex(hex_hash);
    std.debug.print("Hex hash:    {s}\n\n", .{&hex_hex});

    // ============================================================
    // 2. Hashing Empty Data
    // ============================================================

    std.debug.print("2. Hashing Empty Data\n\n", .{});

    // Empty bytes
    const empty_bytes: [0]u8 = .{};
    const empty_bytes_hash = try Hash.keccak256(&empty_bytes);
    const empty_bytes_hex = Hash.toHex(empty_bytes_hash);
    std.debug.print("Empty bytes: {s}\n", .{&empty_bytes_hex});

    // Empty string
    const empty_string_hash = try Hash.keccak256String("");
    const empty_string_hex = Hash.toHex(empty_string_hash);
    std.debug.print("Empty string: {s}\n", .{&empty_string_hex});

    // These are the same
    std.debug.print("Equal: {}\n\n", .{Hash.equals(empty_bytes_hash, empty_string_hash)});

    // ============================================================
    // 3. Deterministic Hashing
    // ============================================================

    std.debug.print("3. Deterministic Hashing (Same Input → Same Hash)\n\n", .{});

    const message = "Hello, Ethereum!";
    const hash1 = try Hash.keccak256String(message);
    const hash2 = try Hash.keccak256String(message);
    const hash3 = try Hash.keccak256String(message);

    const hex1 = Hash.toHex(hash1);
    const hex2 = Hash.toHex(hash2);
    const hex3 = Hash.toHex(hash3);

    std.debug.print("Message: \"{s}\"\n", .{message});
    std.debug.print("Hash 1:  {s}\n", .{&hex1});
    std.debug.print("Hash 2:  {s}\n", .{&hex2});
    std.debug.print("Hash 3:  {s}\n", .{&hex3});
    std.debug.print("All equal: {}\n\n", .{Hash.equals(hash1, hash2) and Hash.equals(hash2, hash3)});

    // ============================================================
    // 4. Avalanche Effect
    // ============================================================

    std.debug.print("4. Avalanche Effect\n\n", .{});

    const msg1 = "hello";
    const msg2 = "Hello"; // Only capital H different
    const msg3 = "hello!"; // Added exclamation

    const avalanche1 = try Hash.keccak256String(msg1);
    const avalanche2 = try Hash.keccak256String(msg2);
    const avalanche3 = try Hash.keccak256String(msg3);

    const av_hex1 = Hash.toHex(avalanche1);
    const av_hex2 = Hash.toHex(avalanche2);
    const av_hex3 = Hash.toHex(avalanche3);

    std.debug.print("\"{s}\":  {s}\n", .{ msg1, &av_hex1 });
    std.debug.print("\"{s}\":  {s}\n", .{ msg2, &av_hex2 });
    std.debug.print("\"{s}\": {s}\n", .{ msg3, &av_hex3 });
    std.debug.print("\nNote: Tiny changes produce completely different hashes\n\n", .{});

    // ============================================================
    // 5. Ethereum Signed Message (EIP-191)
    // ============================================================

    std.debug.print("5. Ethereum Signed Message (EIP-191)\n\n", .{});

    const sign_message = "Sign this message";

    // Build prefix: "\x19Ethereum Signed Message:\n" + length + message
    var prefix_buf: [100]u8 = undefined;
    const prefix = try std.fmt.bufPrint(&prefix_buf, "\x19Ethereum Signed Message:\n{d}{s}", .{ sign_message.len, sign_message });

    const message_hash = try Hash.keccak256String(prefix);
    const msg_hex = Hash.toHex(message_hash);

    std.debug.print("Message: \"{s}\"\n", .{sign_message});
    std.debug.print("Hash:    {s}\n", .{&msg_hex});
    std.debug.print("\nThis hash can be signed with a private key\n\n", .{});

    // ============================================================
    // 6. Transaction Hashing
    // ============================================================

    std.debug.print("6. Transaction Hashing\n\n", .{});

    // Example: Hash transaction data (RLP-encoded)
    const tx_data = [_]u8{
        0xf8, 0x6c, // RLP list header
        0x01, // nonce
        0x85, 0x04, 0xa8, 0x17, 0xc8, 0x00, // gasPrice
        0x52, 0x08, // gasLimit
    };

    const tx_hash = try Hash.keccak256(&tx_data);
    const tx_hex = Hash.toHex(tx_hash);
    std.debug.print("Transaction data: {} bytes\n", .{tx_data.len});
    std.debug.print("Transaction hash: {s}\n\n", .{&tx_hex});

    // ============================================================
    // 7. Content Addressing
    // ============================================================

    std.debug.print("7. Content Addressing\n\n", .{});

    const content1 = "This is file content";
    const content2 = "This is different content";

    const content_hash1 = try Hash.keccak256String(content1);
    const content_hash2 = try Hash.keccak256String(content2);

    const ch1 = Hash.toHex(content_hash1);
    const ch2 = Hash.toHex(content_hash2);

    std.debug.print("Content 1 hash: 0x{s}...{s}\n", .{ ch1[2..8], ch1[ch1.len - 4 ..] });
    std.debug.print("Content 2 hash: 0x{s}...{s}\n", .{ ch2[2..8], ch2[ch2.len - 4 ..] });

    // Use hash as content identifier
    var content_store = std.StringHashMap([]const u8).init(a);
    defer content_store.deinit();

    try content_store.put(&ch1, content1);
    try content_store.put(&ch2, content2);

    // Retrieve by hash
    const retrieved = content_store.get(&ch1);
    if (retrieved) |r| {
        std.debug.print("\nRetrieved: \"{s}\"\n\n", .{r});
    }

    // ============================================================
    // 8. Data Integrity Verification
    // ============================================================

    std.debug.print("8. Data Integrity Verification\n\n", .{});

    const original_data = [_]u8{ 10, 20, 30, 40, 50 };
    const original_hash = try Hash.keccak256(&original_data);
    const orig_hex = Hash.toHex(original_hash);

    std.debug.print("Original hash: 0x{s}...{s}\n", .{ orig_hex[2..8], orig_hex[orig_hex.len - 4 ..] });

    // Simulate data transmission
    const received_data = [_]u8{ 10, 20, 30, 40, 50 }; // Correct
    const corrupted_data = [_]u8{ 10, 20, 99, 40, 50 }; // Corrupted

    const received_hash = try Hash.keccak256(&received_data);
    const corrupted_hash = try Hash.keccak256(&corrupted_data);

    const recv_hex = Hash.toHex(received_hash);
    const corr_hex = Hash.toHex(corrupted_hash);

    const recv_valid = Hash.equals(original_hash, received_hash);
    const corr_valid = Hash.equals(original_hash, corrupted_hash);

    std.debug.print("Received hash:  0x{s}...{s} - {s}\n", .{ recv_hex[2..8], recv_hex[recv_hex.len - 4 ..], if (recv_valid) "VALID ✓" else "INVALID ✗" });
    std.debug.print("Corrupted hash: 0x{s}...{s} - {s}\n\n", .{ corr_hex[2..8], corr_hex[corr_hex.len - 4 ..], if (corr_valid) "VALID ✓" else "INVALID ✗" });

    // ============================================================
    // 9. Hash Chaining
    // ============================================================

    std.debug.print("9. Hash Chaining\n\n", .{});

    const base = try Hash.keccak256String("base");
    const chain1 = try Hash.keccak256(&base);
    const chain2 = try Hash.keccak256(&chain1);
    const chain3 = try Hash.keccak256(&chain2);

    const base_hex = Hash.toHex(base);
    const c1_hex = Hash.toHex(chain1);
    const c2_hex = Hash.toHex(chain2);
    const c3_hex = Hash.toHex(chain3);

    std.debug.print("Base:    0x{s}...{s}\n", .{ base_hex[2..8], base_hex[base_hex.len - 4 ..] });
    std.debug.print("Chain 1: 0x{s}...{s}\n", .{ c1_hex[2..8], c1_hex[c1_hex.len - 4 ..] });
    std.debug.print("Chain 2: 0x{s}...{s}\n", .{ c2_hex[2..8], c2_hex[c2_hex.len - 4 ..] });
    std.debug.print("Chain 3: 0x{s}...{s}\n\n", .{ c3_hex[2..8], c3_hex[c3_hex.len - 4 ..] });

    // ============================================================
    // 10. Combining Data
    // ============================================================

    std.debug.print("10. Combining Data (Solidity abi.encodePacked equivalent)\n\n", .{});

    // Pack address (20 bytes) + uint256 (32 bytes)
    var addr: [20]u8 = undefined;
    @memset(&addr, 0xaa);

    const value: u256 = 123456789;
    var value_bytes: [32]u8 = undefined;
    var v = value;
    var i: usize = 32;
    while (i > 0) : (i -= 1) {
        value_bytes[i - 1] = @truncate(v & 0xFF);
        v >>= 8;
    }

    var combined = [_]u8{0} ** 52; // 20 + 32
    @memcpy(combined[0..20], &addr);
    @memcpy(combined[20..52], &value_bytes);

    const packed_hash = try Hash.keccak256(&combined);
    const packed_hex = Hash.toHex(packed_hash);
    std.debug.print("Packed hash: {s}\n\n", .{&packed_hex});

    // ============================================================
    // 11. Commitment Schemes
    // ============================================================

    std.debug.print("11. Commitment Schemes\n\n", .{});

    const secret = "my secret bid";
    const salt = Hash.random();

    // Create commitment (secret + salt)
    var combined: [secret.len + 32]u8 = undefined;
    @memcpy(combined[0..secret.len], secret);
    @memcpy(combined[secret.len..], &salt);

    const commitment = try Hash.keccak256(&combined);
    const commit_hex = Hash.toHex(commitment);
    std.debug.print("Commitment: 0x{s}...{s}\n", .{ commit_hex[2..8], commit_hex[commit_hex.len - 4 ..] });

    // Verify correct secret
    var verify_buf: [secret.len + 32]u8 = undefined;
    @memcpy(verify_buf[0..secret.len], secret);
    @memcpy(verify_buf[secret.len..], &salt);
    const verify_hash = try Hash.keccak256(&verify_buf);
    const valid = Hash.equals(commitment, verify_hash);

    // Verify wrong secret
    const wrong = "wrong bid";
    var wrong_buf: [wrong.len + 32]u8 = undefined;
    @memcpy(wrong_buf[0..wrong.len], wrong);
    @memcpy(wrong_buf[wrong.len..], &salt);
    const wrong_hash = try Hash.keccak256(&wrong_buf);
    const invalid = Hash.equals(commitment, wrong_hash);

    std.debug.print("Verify correct secret: {}\n", .{valid});
    std.debug.print("Verify wrong secret:   {}\n\n", .{invalid});

    // ============================================================
    // 12. Practical Use Cases
    // ============================================================

    std.debug.print("12. Practical Use Cases\n\n", .{});

    // Block hash (simulated)
    const block_data = Hash.random();
    const block_hash = try Hash.keccak256(&block_data);
    const block_hex = Hash.toHex(block_hash);
    std.debug.print("Block hash: 0x{s}...{s}\n", .{ block_hex[2..8], block_hex[block_hex.len - 4 ..] });

    // Merkle leaf
    const leaf_data = try Hash.keccak256String("transaction data");
    const leaf_hex = Hash.toHex(leaf_data);
    std.debug.print("Merkle leaf: 0x{s}...{s}\n", .{ leaf_hex[2..8], leaf_hex[leaf_hex.len - 4 ..] });

    // Storage key
    const storage_slot = try Hash.keccak256String("balanceOf[0x123...]");
    const storage_hex = Hash.toHex(storage_slot);
    std.debug.print("Storage key: 0x{s}...{s}\n", .{ storage_hex[2..8], storage_hex[storage_hex.len - 4 ..] });

    // Event topic
    const event_sig = try Hash.keccak256String("Transfer(address,address,uint256)");
    const event_hex = Hash.toHex(event_sig);
    std.debug.print("Event topic: 0x{s}...{s}\n\n", .{ event_hex[2..8], event_hex[event_hex.len - 4 ..] });

    std.debug.print("=== Example Complete ===\n\n", .{});
}
