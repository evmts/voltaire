// Create Legacy Transaction Example
//
// Demonstrates creating Legacy (Type 0) transactions with:
// - Simple ETH transfers
// - Contract calls with data
// - Contract deployment
// - EIP-155 chain ID encoding

const std = @import("std");
const primitives = @import("primitives");

const Transaction = primitives.Transaction;
const LegacyTransaction = Transaction.LegacyTransaction;
const Address = primitives.Address.Address;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Legacy Transaction Creation Examples ===\n\n", .{});

    // Example 1: Simple ETH transfer
    std.debug.print("1. Simple ETH Transfer\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const recipient = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

    const transfer = LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000, // 20 gwei
        .gas_limit = 21000, // Standard transfer
        .to = recipient,
        .value = 1_000_000_000_000_000_000, // 1 ETH
        .data = &[_]u8{}, // Empty data for simple transfer
        .v = 37, // EIP-155: chainId=1, yParity=0 → 1*2+35+0 = 37
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  Type: Legacy (0x00)\n", .{});
    std.debug.print("  Nonce: {}\n", .{transfer.nonce});
    std.debug.print("  Gas Price: {} gwei\n", .{transfer.gas_price / 1_000_000_000});
    std.debug.print("  Gas Limit: {}\n", .{transfer.gas_limit});
    std.debug.print("  To: 0x{X}\n", .{recipient.bytes});
    std.debug.print("  Value: {} ETH\n", .{transfer.value / 1_000_000_000_000_000_000});
    std.debug.print("  Data: (empty)\n", .{});
    std.debug.print("  v: {}\n", .{transfer.v});

    // Extract chain ID from v value
    const chain_id = if (transfer.v == 27 or transfer.v == 28)
        null
    else
        (transfer.v - 35) / 2;

    if (chain_id) |cid| {
        std.debug.print("  Chain ID: {} (from v value)\n", .{cid});
    } else {
        std.debug.print("  Chain ID: null (pre-EIP-155)\n", .{});
    }
    std.debug.print("\n", .{});

    // Example 2: Contract call with data
    std.debug.print("2. Contract Call with Data\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const dai_contract = try Address.fromHex("0x6B175474E89094C44Da98b954EedeAC495271d0F");

    // ERC20 transfer(address,uint256) calldata
    // Function selector: 0xa9059cbb
    // Padded address: 0x742d35cc6634c0532925a3b844bc9e7595f51e3e
    // Padded amount: 1 DAI (1e18)
    const call_data = [_]u8{
        0xa9, 0x05, 0x9c, 0xbb, // transfer(address,uint256)
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x74, 0x2d, 0x35, 0xcc,
        0x66, 0x34, 0xc0, 0x53,
        0x29, 0x25, 0xa3, 0xb8,
        0x44, 0xbc, 0x9e, 0x75,
        0x95, 0xf5, 0x1e, 0x3e,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x0d, 0xe0, 0xb6, 0xb3,
        0xa7, 0x64, 0x00, 0x00,
    };

    const contract_call = LegacyTransaction{
        .nonce = 5,
        .gas_price = 25_000_000_000, // 25 gwei
        .gas_limit = 100_000, // Higher for contract calls
        .to = dai_contract,
        .value = 0,
        .data = &call_data,
        .v = 37,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  Contract: 0x{X}\n", .{dai_contract.bytes});
    std.debug.print("  Function: transfer(address,uint256)\n", .{});
    std.debug.print("  Data Length: {} bytes\n", .{call_data.len});
    std.debug.print("  Gas Limit: {} (higher for contract calls)\n", .{contract_call.gas_limit});
    std.debug.print("\n", .{});

    // Example 3: Contract deployment (to = null)
    std.debug.print("3. Contract Deployment\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Simple contract bytecode (example)
    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52, 0x60, 0x00, 0x80, 0xfd };

    const deployment = LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 500_000, // Much higher for deployment
        .to = null, // null = contract creation
        .value = 0,
        .data = &bytecode,
        .v = 37,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  To: null (contract creation)\n", .{});
    std.debug.print("  Bytecode Length: {} bytes\n", .{bytecode.len});
    std.debug.print("  Gas Limit: {} (high for deployment)\n", .{deployment.gas_limit});
    std.debug.print("  Is Contract Creation: {}\n", .{deployment.to == null});
    std.debug.print("\n", .{});

    // Example 4: Different chain IDs (EIP-155)
    std.debug.print("4. EIP-155 Chain ID Examples\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const ChainExample = struct {
        name: []const u8,
        chain_id: u64,
        v: u64,
    };

    const chains = [_]ChainExample{
        .{ .name = "Ethereum Mainnet", .chain_id = 1, .v = 1 * 2 + 35 + 0 },
        .{ .name = "Goerli", .chain_id = 5, .v = 5 * 2 + 35 + 0 },
        .{ .name = "Polygon", .chain_id = 137, .v = 137 * 2 + 35 + 0 },
        .{ .name = "Arbitrum One", .chain_id = 42161, .v = 42161 * 2 + 35 + 0 },
    };

    for (chains) |chain| {
        const recovered_chain_id = (chain.v - 35) / 2;
        std.debug.print("  {s}:\n", .{chain.name});
        std.debug.print("    Chain ID: {}\n", .{chain.chain_id});
        std.debug.print("    v value: {}\n", .{chain.v});
        std.debug.print("    Recovered: {}\n", .{recovered_chain_id});
    }
    std.debug.print("\n", .{});

    // Example 5: Pre-EIP-155 transaction (no chain ID)
    std.debug.print("5. Pre-EIP-155 Transaction (old format)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const pre_eip155 = LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = recipient,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .v = 27, // Pre-EIP-155: just 27 or 28
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  v: {} (27 or 28 only, no chain ID)\n", .{pre_eip155.v});
    if (pre_eip155.v == 27 or pre_eip155.v == 28) {
        std.debug.print("  Chain ID: null (pre-EIP-155)\n", .{});
        std.debug.print("  Warning: No replay protection!\n", .{});
    }
    std.debug.print("\n", .{});

    // Example 6: Calculate transaction cost
    std.debug.print("6. Transaction Cost Calculation\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const gas_used: u64 = 21000; // Actual gas used
    const total_gas_cost = transfer.gas_price * gas_used;
    const total_cost = total_gas_cost + transfer.value;

    std.debug.print("  Gas Price: {} gwei\n", .{transfer.gas_price / 1_000_000_000});
    std.debug.print("  Gas Used: {}\n", .{gas_used});
    std.debug.print("  Gas Cost: {} wei\n", .{total_gas_cost});
    std.debug.print("  Transfer Value: {} wei\n", .{transfer.value});
    std.debug.print("  Total Cost: {} wei\n", .{total_cost});
    std.debug.print("  Total Cost: {} ETH\n", .{total_cost / 1_000_000_000_000_000_000});

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
