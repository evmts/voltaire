const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.address.Address;
const Bytes = primitives.bytes.Bytes;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const a = gpa.allocator();

    std.debug.print("\n=== CREATE2 Contract Deployment ===\n\n", .{});

    // 1. Basic CREATE2 address calculation
    std.debug.print("1. Basic CREATE2 Address Calculation\n\n", .{});

    const deployer = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
    const deployer_hex = Address.toChecksummed(deployer);
    std.debug.print("Deployer (factory): {s}\n", .{&deployer_hex});

    // Contract initialization code (bytecode)
    const init_code = try Bytes.fromHex(a, "0x608060405234801561001057600080fd5b50");
    defer a.free(init_code);
    std.debug.print("Init code: 0x{x}\n\n", .{init_code});

    // Calculate with different salts
    const salt1: u256 = 0;
    const salt2: u256 = 42;
    const salt3: u256 = 0xcafebabe;

    const contract1 = try Address.calculateCreate2Address(a, deployer, salt1, init_code);
    const contract2 = try Address.calculateCreate2Address(a, deployer, salt2, init_code);
    const contract3 = try Address.calculateCreate2Address(a, deployer, salt3, init_code);

    const c1_hex = Address.toChecksummed(contract1);
    const c2_hex = Address.toChecksummed(contract2);
    const c3_hex = Address.toChecksummed(contract3);

    std.debug.print("Salt {}: {s}\n", .{ salt1, &c1_hex });
    std.debug.print("Salt {}: {s}\n", .{ salt2, &c2_hex });
    std.debug.print("Salt 0xcafebabe: {s}\n\n", .{&c3_hex});

    // 2. Deterministic deployment
    std.debug.print("2. Deterministic Deployment\n\n", .{});

    // Same inputs always produce same address
    const addr1 = try Address.calculateCreate2Address(a, deployer, 42, init_code);
    const addr2 = try Address.calculateCreate2Address(a, deployer, 42, init_code);

    const addr1_hex = Address.toChecksummed(addr1);
    const addr2_hex = Address.toChecksummed(addr2);

    std.debug.print("Same salt, same init code:\n", .{});
    std.debug.print("First call:  {s}\n", .{&addr1_hex});
    std.debug.print("Second call: {s}\n", .{&addr2_hex});
    std.debug.print("Are equal: {}\n\n", .{Address.equals(addr1, addr2)});

    // Different init code = different address
    const init_code2 = try Bytes.fromHex(a, "0x608060405234801561001057600080fd5b51");
    defer a.free(init_code2);
    const different_addr = try Address.calculateCreate2Address(a, deployer, 42, init_code2);
    const diff_hex = Address.toChecksummed(different_addr);

    std.debug.print("Same salt, different init code:\n", .{});
    std.debug.print("Original: {s}\n", .{&addr1_hex});
    std.debug.print("Modified: {s}\n", .{&diff_hex});
    std.debug.print("Are equal: {}\n\n", .{Address.equals(addr1, different_addr)});

    // 3. Batch address prediction
    std.debug.print("3. Batch Address Prediction\n\n", .{});

    const salts = [_]u256{ 0, 1, 2, 3, 4 };

    std.debug.print("Batch address prediction:\n", .{});
    for (salts) |salt| {
        const predicted = try Address.calculateCreate2Address(a, deployer, salt, init_code);
        const pred_hex = Address.toChecksummed(predicted);
        std.debug.print("  Salt {}: {s}\n", .{ salt, &pred_hex });
    }
    std.debug.print("\n", .{});

    // 4. Vanity address mining
    std.debug.print("4. Vanity Address Mining\n\n", .{});

    std.debug.print("Mining for address starting with 0x0000...\n", .{});
    const prefix = [_]u8{ 0x00, 0x00 };

    var found = false;
    var found_salt: u256 = 0;
    var found_addr: Address = undefined;

    var salt: u256 = 0;
    while (salt < 100000) : (salt += 1) {
        const addr = try Address.calculateCreate2Address(a, deployer, salt, init_code);

        // Check if address starts with prefix
        var matches = true;
        for (prefix, 0..) |byte, i| {
            if (addr[i] != byte) {
                matches = false;
                break;
            }
        }

        if (matches) {
            found = true;
            found_salt = salt;
            found_addr = addr;
            break;
        }
    }

    if (found) {
        const found_hex = Address.toChecksummed(found_addr);
        std.debug.print("✓ Found!\n", .{});
        std.debug.print("  Address: {s}\n", .{&found_hex});
        std.debug.print("  Salt: {}\n", .{found_salt});
    } else {
        std.debug.print("✗ Not found in search space\n", .{});
    }
    std.debug.print("\n", .{});

    // 5. Cross-chain deployment consistency
    std.debug.print("5. Cross-Chain Deployment Consistency\n\n", .{});

    // Same factory + salt + init code = same address on all chains
    const factory_addr = try Address.fromHex("0x4e59b44847b379578588920cA78FbF26c0B4956C");
    const cross_chain_salt: u256 = 12345;

    const chains = [_][]const u8{ "Ethereum", "Optimism", "Arbitrum" };

    std.debug.print("Same address across chains:\n", .{});
    for (chains) |chain| {
        const addr = try Address.calculateCreate2Address(a, factory_addr, cross_chain_salt, init_code);
        const addr_hex = Address.toChecksummed(addr);
        std.debug.print("  {s}: {s}\n", .{ chain, &addr_hex });
    }
    std.debug.print("\n", .{});

    // 6. Salt types
    std.debug.print("6. Salt as u256\n\n", .{});

    const salt_u256: u256 = 42;
    const addr_from_u256 = try Address.calculateCreate2Address(a, deployer, salt_u256, init_code);
    const u256_hex = Address.toChecksummed(addr_from_u256);
    std.debug.print("Salt as u256 (42): {s}\n\n", .{&u256_hex});

    // 7. Understanding CREATE2 formula
    std.debug.print("7. Understanding CREATE2 Formula\n\n", .{});

    std.debug.print("CREATE2 address = keccak256(0xff ++ factory ++ salt ++ keccak256(initCode))[12:32]\n", .{});
    std.debug.print("\n", .{});
    std.debug.print("Key points:\n", .{});
    std.debug.print("- Address depends on factory, salt, and init code hash\n", .{});
    std.debug.print("- Fully deterministic (no nonce)\n", .{});
    std.debug.print("- Same inputs always produce same address\n", .{});
    std.debug.print("- Useful for counterfactual contracts\n", .{});
    std.debug.print("- Enables cross-chain address consistency\n", .{});
}
