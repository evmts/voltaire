const std = @import("std");
const crypto = @import("crypto");
const hash_utils = crypto.hash_utils;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Keccak-256 Hashing Examples ===\n\n", .{});

    // Example 1: Computing keccak256 hashes
    std.debug.print("1. Computing Keccak-256 Hashes\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    // Hash a simple string
    const hello = "hello";
    const hello_hash = hash_utils.keccak256(hello);
    std.debug.print("Input: \"{s}\"\n", .{hello});
    std.debug.print("Hash:  {s}\n\n", .{hash_utils.toHex(hello_hash)});

    // Hash empty string (produces known constant)
    const empty_hash = hash_utils.keccak256("");
    std.debug.print("Input: \"\" (empty string)\n", .{});
    std.debug.print("Hash:  {s}\n", .{hash_utils.toHex(empty_hash)});
    std.debug.print("Note:  This is EMPTY_KECCAK256 constant\n\n", .{});

    // Hash arbitrary bytes
    const bytes = [_]u8{ 0xde, 0xad, 0xbe, 0xef };
    const bytes_hash = hash_utils.keccak256(&bytes);
    std.debug.print("Input: [0xde, 0xad, 0xbe, 0xef]\n", .{});
    std.debug.print("Hash:  {s}\n\n", .{hash_utils.toHex(bytes_hash)});

    // Example 2: Creating Hash from bytes and hex
    std.debug.print("2. Creating Hash from Bytes and Hex\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    // Create hash from raw bytes
    const raw_bytes = [_]u8{ 0x12, 0x34, 0x56, 0x78 } ++ [_]u8{0} ** 28;
    const hash_from_bytes = hash_utils.fromBytes(raw_bytes);
    std.debug.print("From bytes: {s}\n", .{hash_utils.toHex(hash_from_bytes)});

    // Create hash from hex string
    const hex_str = "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8";
    const hash_from_hex = try hash_utils.fromHex(hex_str);
    std.debug.print("From hex:   {s}\n\n", .{hash_utils.toHex(hash_from_hex)});

    // Example 3: Converting Hash to hex
    std.debug.print("3. Converting Hash to Hex (Lowercase and Uppercase)\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const some_hash = hash_utils.keccak256("example");
    std.debug.print("Lowercase: {s}\n", .{hash_utils.toHex(some_hash)});
    std.debug.print("Uppercase: {s}\n\n", .{hash_utils.toHexUpper(some_hash)});

    // Example 4: EIP-191 personal message hashing
    std.debug.print("4. EIP-191 Personal Message Hashing\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});
    std.debug.print("EIP-191 adds the prefix: \"\\x19Ethereum Signed Message:\\n<length>\"\n", .{});

    const message1 = "Hello, Ethereum!";
    const eip191_hash1 = try hash_utils.eip191HashMessage(message1, allocator);
    std.debug.print("Message: \"{s}\"\n", .{message1});
    std.debug.print("EIP-191 Hash: {s}\n\n", .{hash_utils.toHex(eip191_hash1)});

    const message2 = "Sign this message";
    const eip191_hash2 = try hash_utils.eip191HashMessage(message2, allocator);
    std.debug.print("Message: \"{s}\"\n", .{message2});
    std.debug.print("EIP-191 Hash: {s}\n\n", .{hash_utils.toHex(eip191_hash2)});

    // Example 5: Bitwise operations on hashes
    std.debug.print("5. Bitwise Operations on Hashes\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    // Create two hashes from u256 values for cleaner demonstration
    const hash_a = hash_utils.fromU256(0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA);
    const hash_b = hash_utils.fromU256(0x5555555555555555555555555555555555555555555555555555555555555555);

    std.debug.print("Hash A: {s}\n", .{hash_utils.toHex(hash_a)});
    std.debug.print("Hash B: {s}\n\n", .{hash_utils.toHex(hash_b)});

    // XOR operation
    const xor_result = hash_utils.xor(hash_a, hash_b);
    std.debug.print("A XOR B: {s}\n", .{hash_utils.toHex(xor_result)});

    // AND operation
    const and_result = hash_utils.bitAnd(hash_a, hash_b);
    std.debug.print("A AND B: {s}\n", .{hash_utils.toHex(and_result)});

    // OR operation
    const or_result = hash_utils.bitOr(hash_a, hash_b);
    std.debug.print("A OR B:  {s}\n\n", .{hash_utils.toHex(or_result)});

    // Example 6: Hash comparison
    std.debug.print("6. Hash Comparison\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const hash1 = hash_utils.keccak256("test1");
    const hash2 = hash_utils.keccak256("test2");
    const hash3 = hash_utils.keccak256("test1");

    std.debug.print("Hash1 (\"test1\"): {s}\n", .{hash_utils.toHex(hash1)});
    std.debug.print("Hash2 (\"test2\"): {s}\n", .{hash_utils.toHex(hash2)});
    std.debug.print("Hash3 (\"test1\"): {s}\n\n", .{hash_utils.toHex(hash3)});

    std.debug.print("hash1 == hash2: {}\n", .{hash_utils.equal(hash1, hash2)});
    std.debug.print("hash1 == hash3: {}\n", .{hash_utils.equal(hash1, hash3)});
    std.debug.print("hash1 < hash2:  {}\n", .{hash_utils.lessThan(hash1, hash2)});
    std.debug.print("hash1 > hash2:  {}\n\n", .{hash_utils.greaterThan(hash1, hash2)});

    // Example 7: Function selector generation (Bonus)
    std.debug.print("7. Function Selector Generation (ERC20 Examples)\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const transfer_sig = "transfer(address,uint256)";
    const transfer_selector = hash_utils.selectorFromSignature(transfer_sig);
    std.debug.print("Function: {s}\n", .{transfer_sig});
    std.debug.print("Selector: 0x{x:0>2}{x:0>2}{x:0>2}{x:0>2}\n\n", .{
        transfer_selector[0],
        transfer_selector[1],
        transfer_selector[2],
        transfer_selector[3],
    });

    const balance_sig = "balanceOf(address)";
    const balance_selector = hash_utils.selectorFromSignature(balance_sig);
    std.debug.print("Function: {s}\n", .{balance_sig});
    std.debug.print("Selector: 0x{x:0>2}{x:0>2}{x:0>2}{x:0>2}\n\n", .{
        balance_selector[0],
        balance_selector[1],
        balance_selector[2],
        balance_selector[3],
    });

    // Example 8: Working with zero hash
    std.debug.print("8. Zero Hash Operations\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const zero_hash = hash_utils.zero();
    std.debug.print("Zero hash: {s}\n", .{hash_utils.toHex(zero_hash)});
    std.debug.print("Is zero:   {}\n\n", .{hash_utils.isZero(zero_hash)});

    std.debug.print("=== Examples Complete ===\n", .{});
}
