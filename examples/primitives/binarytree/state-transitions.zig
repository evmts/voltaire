const std = @import("std");
const primitives = @import("primitives");
const BinaryTree = primitives.BinaryTree;

// Simplified account state for demonstration
const AccountState = struct {
    balance: u128,
    nonce: u64,
};

fn packAccountState(state: AccountState) [32]u8 {
    var packed: [32]u8 = undefined;
    @memset(&packed, 0);

    // Nonce at bytes 0-7
    std.mem.writeInt(u64, packed[0..8], state.nonce, .big);

    // Balance at bytes 8-23 (16 bytes for u128)
    std.mem.writeInt(u128, packed[8..24], state.balance, .big);

    return packed;
}

fn unpackAccountState(packed: [32]u8) AccountState {
    const nonce = std.mem.readInt(u64, packed[0..8], .big);
    const balance = std.mem.readInt(u128, packed[8..24], .big);
    return .{ .balance = balance, .nonce = nonce };
}

const StateSnapshot = struct {
    block_number: u64,
    state_root: [32]u8,
    description: []const u8,
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Ethereum State Transitions with BinaryTree ===\n\n", .{});

    var history = std.ArrayList(StateSnapshot).init(allocator);
    defer history.deinit();

    // Example 1: Genesis state
    std.debug.print("1. Genesis State (Block 0)\n", .{});
    std.debug.print("   -----------------------\n", .{});

    var state = BinaryTree.init(allocator);
    defer state.deinit();

    var genesis_root = state.rootHash();
    try history.append(.{
        .block_number = 0,
        .state_root = genesis_root,
        .description = "Genesis - empty state",
    });

    std.debug.print("   State root: 0x{x}\n", .{genesis_root});
    std.debug.print("   Accounts: 0\n", .{});
    std.debug.print("\n", .{});

    // Example 2: Create initial accounts
    std.debug.print("2. Block 1 - Create Accounts\n", .{});
    std.debug.print("   -------------------------\n", .{});

    // Alice
    var alice_address: [20]u8 = undefined;
    @memset(&alice_address, 0);
    alice_address[0] = 0x01;
    var alice_key = BinaryTree.addressToKey(alice_address);
    alice_key[31] = 0; // Account data at subindex 0

    const alice_state = AccountState{
        .balance = 1000000000000000000, // 1 ETH
        .nonce = 0,
    };

    try state.insert(alice_key, packAccountState(alice_state));

    // Bob
    var bob_address: [20]u8 = undefined;
    @memset(&bob_address, 0);
    bob_address[0] = 0x02;
    var bob_key = BinaryTree.addressToKey(bob_address);
    bob_key[31] = 0;

    const bob_state = AccountState{
        .balance = 2000000000000000000, // 2 ETH
        .nonce = 0,
    };

    try state.insert(bob_key, packAccountState(bob_state));

    const block1_root = state.rootHash();
    try history.append(.{
        .block_number = 1,
        .state_root = block1_root,
        .description = "Created Alice and Bob",
    });

    std.debug.print("   Alice: 1 ETH, nonce 0\n", .{});
    std.debug.print("   Bob: 2 ETH, nonce 0\n", .{});
    std.debug.print("   State root: 0x{x}\n", .{block1_root});
    std.debug.print("\n", .{});

    // Example 3: Transfer transaction
    std.debug.print("3. Block 2 - Alice sends 0.5 ETH to Bob\n", .{});
    std.debug.print("   -------------------------------------\n", .{});

    if (state.get(alice_key)) |alice_data| {
        if (state.get(bob_key)) |bob_data| {
            var alice = unpackAccountState(alice_data);
            var bob = unpackAccountState(bob_data);

            std.debug.print("   Before:\n", .{});
            std.debug.print("     Alice: {} ETH, nonce {}\n", .{ alice.balance / 1000000000000000000, alice.nonce });
            std.debug.print("     Bob: {} ETH, nonce {}\n", .{ bob.balance / 1000000000000000000, bob.nonce });

            // Transfer 0.5 ETH
            const transfer_amount: u128 = 500000000000000000;
            alice.balance -= transfer_amount;
            alice.nonce += 1;
            bob.balance += transfer_amount;

            try state.insert(alice_key, packAccountState(alice));
            try state.insert(bob_key, packAccountState(bob));

            std.debug.print("   After:\n", .{});
            std.debug.print("     Alice: {} ETH, nonce {}\n", .{ alice.balance / 1000000000000000000, alice.nonce });
            std.debug.print("     Bob: {} ETH, nonce {}\n", .{ bob.balance / 1000000000000000000, bob.nonce });

            const block2_root = state.rootHash();
            try history.append(.{
                .block_number = 2,
                .state_root = block2_root,
                .description = "Alice → Bob: 0.5 ETH",
            });

            std.debug.print("   State root: 0x{x}\n", .{block2_root});
            std.debug.print("   State changed: {}\n", .{!std.mem.eql(u8, &block1_root, &block2_root)});
        }
    }
    std.debug.print("\n", .{});

    // Example 4: Create contract
    std.debug.print("4. Block 3 - Alice Creates Contract\n", .{});
    std.debug.print("   ---------------------------------\n", .{});

    var contract_address: [20]u8 = undefined;
    @memset(&contract_address, 0);
    contract_address[0] = 0xFF;
    var contract_key = BinaryTree.addressToKey(contract_address);
    contract_key[31] = 0;

    const contract_state = AccountState{
        .balance = 100000000000000000, // 0.1 ETH from Alice
        .nonce = 0,
    };

    if (state.get(alice_key)) |alice_data| {
        var alice = unpackAccountState(alice_data);
        alice.balance -= 100000000000000000;
        alice.nonce += 1;

        try state.insert(alice_key, packAccountState(alice));
        try state.insert(contract_key, packAccountState(contract_state));

        std.debug.print("   Contract created at: 0x{x}\n", .{contract_address[0]});
        std.debug.print("   Contract balance: 0.1 ETH\n", .{});
        std.debug.print("   Alice nonce now: {}\n", .{alice.nonce});

        const block3_root = state.rootHash();
        try history.append(.{
            .block_number = 3,
            .state_root = block3_root,
            .description = "Alice created contract",
        });

        std.debug.print("   State root: 0x{x}\n", .{block3_root});
    }
    std.debug.print("\n", .{});

    // Example 5: Contract storage
    std.debug.print("5. Block 4 - Contract Storage Update\n", .{});
    std.debug.print("   ---------------------------------\n", .{});

    var storage_key = BinaryTree.addressToKey(contract_address);
    storage_key[31] = 1; // Storage slot 0 at subindex 1

    var storage_value: [32]u8 = undefined;
    @memset(&storage_value, 0);
    storage_value[31] = 0x42;

    try state.insert(storage_key, storage_value);

    std.debug.print("   Storage slot 0: 0x{x}\n", .{storage_value[31]});

    const block4_root = state.rootHash();
    try history.append(.{
        .block_number = 4,
        .state_root = block4_root,
        .description = "Contract storage updated",
    });

    std.debug.print("   State root: 0x{x}\n", .{block4_root});
    std.debug.print("\n", .{});

    // Example 6: State history
    std.debug.print("6. State History\n", .{});
    std.debug.print("   -------------\n", .{});

    std.debug.print("   Block history:\n", .{});
    for (history.items) |snap| {
        std.debug.print("     Block {}: {s}\n", .{ snap.block_number, snap.description });
        std.debug.print("       Root: 0x{x}\n", .{snap.state_root});
    }
    std.debug.print("\n", .{});

    // Example 7: Final state verification
    std.debug.print("7. Final State Verification\n", .{});
    std.debug.print("   ------------------------\n", .{});

    const final_alice = state.get(alice_key);
    const final_bob = state.get(bob_key);
    const final_contract = state.get(contract_key);

    if (final_alice != null and final_bob != null and final_contract != null) {
        const alice = unpackAccountState(final_alice.?);
        const bob = unpackAccountState(final_bob.?);
        const contract = unpackAccountState(final_contract.?);

        std.debug.print("   Final balances:\n", .{});
        std.debug.print("     Alice: {} ETH, nonce {}\n", .{ alice.balance / 1000000000000000000, alice.nonce });
        std.debug.print("     Bob: {} ETH, nonce {}\n", .{ bob.balance / 1000000000000000000, bob.nonce });
        std.debug.print("     Contract: {} ETH, nonce {}\n", .{ contract.balance / 1000000000000000000, contract.nonce });

        const total_balance = alice.balance + bob.balance + contract.balance;
        std.debug.print("   Total: {} ETH\n", .{total_balance / 1000000000000000000});
        std.debug.print("   Conservation: {s}\n", .{if (total_balance == 3000000000000000000) "OK" else "FAIL"});
    }
    std.debug.print("\n", .{});

    // Example 8: State root as commitment
    std.debug.print("8. State Root as Commitment\n", .{});
    std.debug.print("   ------------------------\n", .{});

    const current_root = state.rootHash();
    std.debug.print("   Current state root: 0x{x}\n", .{current_root});
    std.debug.print("   This hash commits to:\n", .{});
    std.debug.print("     - All account balances\n", .{});
    std.debug.print("     - All account nonces\n", .{});
    std.debug.print("     - All storage slots\n", .{});
    std.debug.print("     - Entire tree structure\n", .{});
    std.debug.print("\n", .{});
    std.debug.print("   Verification: Rebuild state → compare roots\n", .{});
    std.debug.print("   State changes: Any modification → different root\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
