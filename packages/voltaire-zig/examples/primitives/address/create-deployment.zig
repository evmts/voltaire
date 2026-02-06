const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.address.Address;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const a = gpa.allocator();

    std.debug.print("\n=== CREATE Contract Deployment ===\n\n", .{});

    // 1. Basic CREATE address calculation
    std.debug.print("1. Basic CREATE Address Calculation\n\n", .{});

    const deployer = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
    const deployer_hex = Address.toChecksummed(deployer);
    std.debug.print("Deployer address: {s}\n\n", .{&deployer_hex});

    // Calculate contract address for nonce 0 (first deployment)
    const contract0 = try Address.calculateCreateAddress(a, deployer, 0);
    const contract0_hex = Address.toChecksummed(contract0);
    std.debug.print("Contract at nonce 0: {s}\n", .{&contract0_hex});

    // Calculate contract address for nonce 1 (second deployment)
    const contract1 = try Address.calculateCreateAddress(a, deployer, 1);
    const contract1_hex = Address.toChecksummed(contract1);
    std.debug.print("Contract at nonce 1: {s}\n", .{&contract1_hex});

    // Each nonce produces a different address
    std.debug.print("\nAddresses are different: {}\n\n", .{!Address.equals(contract0, contract1)});

    // 2. Predicting deployment addresses
    std.debug.print("2. Predicting Deployment Addresses\n\n", .{});

    const current_nonce: u64 = 5;
    std.debug.print("Current account nonce: {}\n\n", .{current_nonce});

    std.debug.print("Next 5 deployment addresses:\n", .{});
    var i: u64 = 0;
    while (i < 5) : (i += 1) {
        const nonce = current_nonce + i;
        const predicted = try Address.calculateCreateAddress(a, deployer, nonce);
        const predicted_hex = Address.toChecksummed(predicted);
        std.debug.print("Nonce {}: {s}\n", .{ nonce, &predicted_hex });
    }
    std.debug.print("\n", .{});

    // 3. Multi-contract factory deployment
    std.debug.print("3. Multi-Contract Factory Deployment\n\n", .{});

    const Factory = struct {
        deployer_addr: Address,
        current_nonce: u64,

        fn predictNext(self: @This(), allocator: std.mem.Allocator) !Address {
            return Address.calculateCreateAddress(allocator, self.deployer_addr, self.current_nonce);
        }

        fn deploy(self: *@This(), allocator: std.mem.Allocator, name: []const u8) !Address {
            const contract_addr = try self.predictNext(allocator);
            const contract_hex = Address.toChecksummed(contract_addr);
            std.debug.print("Deploying {s}...\n", .{name});
            std.debug.print("  Nonce: {}\n", .{self.current_nonce});
            std.debug.print("  Address: {s}\n", .{&contract_hex});
            self.current_nonce += 1;
            return contract_addr;
        }
    };

    var factory = Factory{
        .deployer_addr = deployer,
        .current_nonce = 10,
    };

    // Preview addresses before deploying
    std.debug.print("Preview next 3 deployments:\n", .{});
    var preview_i: u64 = 0;
    while (preview_i < 3) : (preview_i += 1) {
        const addr = try Address.calculateCreateAddress(a, factory.deployer_addr, factory.current_nonce + preview_i);
        const addr_hex = Address.toChecksummed(addr);
        std.debug.print("  {}. {s}\n", .{ preview_i + 1, &addr_hex });
    }
    std.debug.print("\n", .{});

    // Deploy contracts one by one
    _ = try factory.deploy(a, "Token Contract");
    _ = try factory.deploy(a, "Marketplace Contract");
    _ = try factory.deploy(a, "Governance Contract");
    std.debug.print("\n", .{});

    // 4. Real-world scenario: Linked contracts
    std.debug.print("4. Linked Contract Deployment\n\n", .{});

    const deployer2 = try Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    var nonce: u64 = 100;

    const deployer2_hex = Address.toChecksummed(deployer2);
    std.debug.print("Deployer: {s}\n", .{&deployer2_hex});
    std.debug.print("Starting nonce: {}\n\n", .{nonce});

    // Calculate all addresses before deployment
    const proxy = try Address.calculateCreateAddress(a, deployer2, nonce);
    nonce += 1;
    const implementation = try Address.calculateCreateAddress(a, deployer2, nonce);
    nonce += 1;
    const registry = try Address.calculateCreateAddress(a, deployer2, nonce);

    const proxy_hex = Address.toChecksummed(proxy);
    const impl_hex = Address.toChecksummed(implementation);
    const registry_hex = Address.toChecksummed(registry);

    std.debug.print("Pre-calculated addresses:\n", .{});
    std.debug.print("1. Proxy:          {s}\n", .{&proxy_hex});
    std.debug.print("2. Implementation: {s}\n", .{&impl_hex});
    std.debug.print("3. Registry:       {s}\n", .{&registry_hex});
    std.debug.print("\n", .{});
    std.debug.print("These addresses can be used in contract constructors!\n\n", .{});

    // 5. Understanding CREATE formula
    std.debug.print("5. Understanding CREATE Formula\n\n", .{});

    std.debug.print("CREATE address = keccak256(rlp([sender, nonce]))[12:32]\n", .{});
    std.debug.print("\n", .{});
    std.debug.print("Key points:\n", .{});
    std.debug.print("- Address depends on sender address and nonce\n", .{});
    std.debug.print("- Nonce increments with each transaction\n", .{});
    std.debug.print("- Deterministic: same sender + nonce = same address\n", .{});
    std.debug.print("- Different from CREATE2 (which uses salt + init code)\n", .{});
    std.debug.print("\n", .{});

    // 6. Edge cases
    std.debug.print("6. Edge Cases\n\n", .{});

    // Large nonce
    const large_nonce: u64 = 999999;
    const large_nonce_addr = try Address.calculateCreateAddress(a, deployer, large_nonce);
    const large_hex = Address.toChecksummed(large_nonce_addr);
    std.debug.print("Large nonce ({}): {s}\n", .{ large_nonce, &large_hex });

    // Zero nonce (first deployment from new account)
    const zero_nonce_addr = try Address.calculateCreateAddress(a, deployer, 0);
    const zero_hex = Address.toChecksummed(zero_nonce_addr);
    std.debug.print("Zero nonce: {s}\n", .{&zero_hex});
}
