const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Ethereum Address Primitives Example ===\n\n", .{});

    // Example 1: Creating addresses from hex strings
    std.debug.print("1. Creating Address from Hex String\n", .{});
    std.debug.print("   -----------------------------------\n", .{});

    const hex_addr = "0xa0cf798816d4b9b9866b5330eea46a18382f251e";
    const addr1 = try Address.fromHex(hex_addr);
    std.debug.print("   Input:  {s}\n", .{hex_addr});
    std.debug.print("   Parsed: 0x{x}\n\n", .{addr1});

    // Example 2: Converting to checksummed hex (EIP-55)
    std.debug.print("2. EIP-55 Checksum Address\n", .{});
    std.debug.print("   -----------------------\n", .{});

    const checksummed = addr1.toChecksumHex();
    std.debug.print("   Lowercase: {s}\n", .{hex_addr});
    std.debug.print("   Checksum:  {s}\n", .{&checksummed});
    std.debug.print("   (Notice mixed case for verification)\n\n", .{});

    // Example 3: Address validation
    std.debug.print("3. Address Validation\n", .{});
    std.debug.print("   -------------------\n", .{});

    const test_addresses = [_][]const u8{
        "0xa0cf798816d4b9b9866b5330eea46a18382f251e", // Valid, lowercase
        "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e", // Valid, checksummed
        "0xa0cf798816d4b9b9866b5330eea46a18382f251", // Invalid, too short
        "0xa0cf798816d4b9b9866b5330eea46a18382f251zz", // Invalid, bad chars
    };

    for (test_addresses) |test_addr| {
        const valid = Address.isValid(test_addr);
        const checksum_valid = Address.isValidChecksum(test_addr);
        std.debug.print("   Address: {s}\n", .{test_addr});
        std.debug.print("   Valid:           {}\n", .{valid});
        std.debug.print("   Checksum Valid:  {}\n\n", .{checksum_valid});
    }

    // Example 4: Creating address from public key
    std.debug.print("4. Address from Public Key\n", .{});
    std.debug.print("   -----------------------\n", .{});

    // Public key coordinates (x, y) from secp256k1 curve
    const public_key_x: u256 = 0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75;
    const public_key_y: u256 = 0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5;

    const addr_from_pubkey = Address.fromPublicKey(public_key_x, public_key_y);
    const pubkey_checksum = addr_from_pubkey.toChecksumHex();

    std.debug.print("   Public Key X: 0x{x}\n", .{public_key_x});
    std.debug.print("   Public Key Y: 0x{x}\n", .{public_key_y});
    std.debug.print("   Derived Address: {s}\n\n", .{&pubkey_checksum});

    // Example 5: Computing CREATE contract address
    std.debug.print("5. Computing CREATE Contract Address\n", .{});
    std.debug.print("   ----------------------------------\n", .{});

    const deployer = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    std.debug.print("   Deployer: {s}\n", .{&deployer.toChecksumHex()});

    // Calculate addresses for different nonces
    const nonces = [_]u64{ 0, 1, 2, 3 };
    for (nonces) |nonce| {
        const contract_addr = try Address.calculateCreateAddress(allocator, deployer, nonce);
        const contract_hex = contract_addr.toChecksumHex();
        std.debug.print("   Nonce {}: {s}\n", .{ nonce, &contract_hex });
    }
    std.debug.print("\n", .{});

    // Example 6: Computing CREATE2 contract address
    std.debug.print("6. Computing CREATE2 Contract Address\n", .{});
    std.debug.print("   -----------------------------------\n", .{});

    const deployer2 = try Address.fromHex("0x742d35cc6632c0532925a3b8d39c0e6cfc8c74e4");
    std.debug.print("   Deployer: {s}\n", .{&deployer2.toChecksumHex()});

    // Salt value for CREATE2
    const salt: u256 = 0x00000000000000000000000000000000000000000000000000000000cafebabe;
    std.debug.print("   Salt:     0x{x}\n", .{salt});

    // Simple init code (bytecode)
    const init_code = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 };
    std.debug.print("   Init Code: 0x{x}\n", .{init_code});

    const create2_addr = try Address.calculateCreate2Address(allocator, deployer2, salt, &init_code);
    const create2_hex = create2_addr.toChecksumHex();
    std.debug.print("   CREATE2 Address: {s}\n\n", .{&create2_hex});

    // Example 7: Address comparison and special addresses
    std.debug.print("7. Address Comparison\n", .{});
    std.debug.print("   -------------------\n", .{});

    const zero_addr = Address.zero();
    std.debug.print("   Zero Address: {s}\n", .{&zero_addr.toHex()});
    std.debug.print("   Is Zero: {}\n\n", .{zero_addr.isZero()});

    const addr_a = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const addr_b = try Address.fromHex("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e");
    const addr_c = try Address.fromHex("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");

    std.debug.print("   Address A: {s}\n", .{&addr_a.toChecksumHex()});
    std.debug.print("   Address B: {s}\n", .{&addr_b.toChecksumHex()});
    std.debug.print("   Address C: {s}\n", .{&addr_c.toChecksumHex()});
    std.debug.print("   A equals B (case insensitive): {}\n", .{addr_a.equals(addr_b)});
    std.debug.print("   A equals C: {}\n\n", .{addr_a.equals(addr_c)});

    // Example 8: Converting between Address and u256
    std.debug.print("8. Address <-> u256 Conversion\n", .{});
    std.debug.print("   ----------------------------\n", .{});

    const test_addr = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const as_u256 = test_addr.toU256();
    const back_to_addr = Address.fromU256(as_u256);

    std.debug.print("   Original: {s}\n", .{&test_addr.toHex()});
    std.debug.print("   As u256:  {}\n", .{as_u256});
    std.debug.print("   Back:     {s}\n", .{&back_to_addr.toHex()});
    std.debug.print("   Equal:    {}\n\n", .{test_addr.equals(back_to_addr)});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
