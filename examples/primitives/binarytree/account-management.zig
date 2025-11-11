const std = @import("std");
const primitives = @import("primitives");
const BinaryTree = primitives.BinaryTree;

// Helper functions for AccountData packing/unpacking
fn packAccountData(account: BinaryTree.AccountData) [32]u8 {
    var result = [_]u8{0} ** 32;
    @memset(&result, 0);

    // Pack using standard layout
    const bytes: *const [@sizeOf(BinaryTree.AccountData)]u8 = @ptrCast(&account);
    @memcpy(result[0..@sizeOf(BinaryTree.AccountData)], bytes);

    return result;
}

fn unpackAccountData(data: [32]u8) BinaryTree.AccountData {
    var account: BinaryTree.AccountData = undefined;
    const dest: *[@sizeOf(BinaryTree.AccountData)]u8 = @ptrCast(&account);
    @memcpy(dest, data[0..@sizeOf(BinaryTree.AccountData)]);
    return account;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Ethereum Account Management with BinaryTree ===\n\n", .{});

    var tree = BinaryTree.init(allocator);
    defer tree.deinit();

    // Example 1: Create account from address
    std.debug.print("1. Creating Account from Ethereum Address\n", .{});
    std.debug.print("   ---------------------------------------\n", .{});

    var alice_address: [20]u8 = undefined;
    @memset(&alice_address, 0);
    alice_address[0] = 0xf3;
    alice_address[1] = 0x9f;

    const alice_key = BinaryTree.addressToKey(alice_address);
    std.debug.print("   Address (first 2 bytes): 0x{x}{x}\n", .{ alice_address[0], alice_address[1] });
    std.debug.print("   Tree key length: {}\n", .{alice_key.len});
    std.debug.print("   Key[12] (first address byte): 0x{x}\n", .{alice_key[12]});
    std.debug.print("   Key[13] (second address byte): 0x{x}\n", .{alice_key[13]});

    const split = BinaryTree.splitKey(alice_key);
    std.debug.print("   Stem length: {}\n", .{split.stem.len});
    std.debug.print("   Subindex: {}\n", .{split.idx});
    std.debug.print("\n", .{});

    // Example 2: Store account data
    std.debug.print("2. Storing Account Data\n", .{});
    std.debug.print("   --------------------\n", .{});

    var account_data_key = alice_key;
    account_data_key[31] = 0; // Subindex 0 for account data

    const alice_account = BinaryTree.AccountData{
        .version = 1,
        .code_size = 0,
        .nonce = 0,
        .balance = 1000000000000000000, // 1 ETH in wei
    };

    const packed_account = packAccountData(alice_account);
    try tree.insert(account_data_key, packed_account);

    std.debug.print("   Account created:\n", .{});
    std.debug.print("     Version: {}\n", .{alice_account.version});
    std.debug.print("     Code size: {}\n", .{alice_account.code_size});
    std.debug.print("     Nonce: {}\n", .{alice_account.nonce});
    std.debug.print("     Balance: {} wei (1 ETH)\n", .{alice_account.balance});
    std.debug.print("   Inserted at subindex: {}\n", .{account_data_key[31]});
    std.debug.print("\n", .{});

    // Example 3: Retrieve and verify account data
    std.debug.print("3. Retrieving Account Data\n", .{});
    std.debug.print("   -----------------------\n", .{});

    const retrieved_packed = tree.get(account_data_key);
    if (retrieved_packed) |data| {
        const retrieved = unpackAccountData(data);
        std.debug.print("   Retrieved account:\n", .{});
        std.debug.print("     Version: {}\n", .{retrieved.version});
        std.debug.print("     Code size: {}\n", .{retrieved.code_size});
        std.debug.print("     Nonce: {}\n", .{retrieved.nonce});
        std.debug.print("     Balance: {} wei\n", .{retrieved.balance});
        std.debug.print("   Data matches: {}\n", .{retrieved.balance == alice_account.balance});
    }
    std.debug.print("\n", .{});

    // Example 4: Update account balance
    std.debug.print("4. Updating Account Balance\n", .{});
    std.debug.print("   ------------------------\n", .{});

    if (tree.get(account_data_key)) |data| {
        var current = unpackAccountData(data);
        std.debug.print("   Current balance: {} wei\n", .{current.balance});

        current.balance += 500000000000000000; // Add 0.5 ETH
        const updated_packed = packAccountData(current);
        try tree.insert(account_data_key, updated_packed);

        if (tree.get(account_data_key)) |new_packed| {
            const new_account = unpackAccountData(new_packed);
            std.debug.print("   New balance: {} wei\n", .{new_account.balance});
            std.debug.print("   Balance increased: {}\n", .{new_account.balance > alice_account.balance});
        }
    }
    std.debug.print("\n", .{});

    // Example 5: Increment nonce
    std.debug.print("5. Incrementing Nonce\n", .{});
    std.debug.print("   ------------------\n", .{});

    if (tree.get(account_data_key)) |data| {
        var current = unpackAccountData(data);
        std.debug.print("   Current nonce: {}\n", .{current.nonce});

        current.nonce += 1;
        const updated_packed = packAccountData(current);
        try tree.insert(account_data_key, updated_packed);

        if (tree.get(account_data_key)) |new_packed| {
            const new_account = unpackAccountData(new_packed);
            std.debug.print("   New nonce: {}\n", .{new_account.nonce});
        }
    }
    std.debug.print("\n", .{});

    // Example 6: Store storage slot
    std.debug.print("6. Storing Contract Storage\n", .{});
    std.debug.print("   -------------------------\n", .{});

    var storage_key = alice_key;
    storage_key[31] = 1; // Subindex 1 = storage slot 0

    var storage_value: [32]u8 = undefined;
    @memset(&storage_value, 0);
    storage_value[31] = 0x42;

    try tree.insert(storage_key, storage_value);
    std.debug.print("   Storage slot 0 at subindex: {}\n", .{storage_key[31]});
    std.debug.print("   Storage value[31]: 0x{x}\n", .{storage_value[31]});
    std.debug.print("\n", .{});

    // Example 7: Multiple storage slots
    std.debug.print("7. Multiple Storage Slots\n", .{});
    std.debug.print("   ----------------------\n", .{});

    var slot: u8 = 0;
    while (slot < 5) : (slot += 1) {
        var slot_key = alice_key;
        slot_key[31] = 1 + slot; // Slots 0-4 at subindices 1-5

        var slot_value: [32]u8 = undefined;
        @memset(&slot_value, 0);
        slot_value[31] = 0x10 + slot;

        try tree.insert(slot_key, slot_value);
        std.debug.print("   Stored slot {} (subindex {}): 0x{x}\n", .{ slot, slot_key[31], slot_value[31] });
    }
    std.debug.print("\n", .{});

    // Example 8: Create second account
    std.debug.print("8. Creating Second Account (Bob)\n", .{});
    std.debug.print("   ------------------------------\n", .{});

    var bob_address: [20]u8 = undefined;
    @memset(&bob_address, 0);
    bob_address[0] = 0x70;
    bob_address[1] = 0x99;

    const bob_key = BinaryTree.addressToKey(bob_address);
    var bob_account_key = bob_key;
    bob_account_key[31] = 0;

    const bob_account = BinaryTree.AccountData{
        .version = 1,
        .code_size = 1024, // Has contract code
        .nonce = 5,
        .balance = 2000000000000000000, // 2 ETH
    };

    const bob_packed = packAccountData(bob_account);
    try tree.insert(bob_account_key, bob_packed);

    std.debug.print("   Bob created:\n", .{});
    std.debug.print("     Address (first 2 bytes): 0x{x}{x}\n", .{ bob_address[0], bob_address[1] });
    std.debug.print("     Balance: {} wei (2 ETH)\n", .{bob_account.balance});
    std.debug.print("     Nonce: {}\n", .{bob_account.nonce});
    std.debug.print("     Code size: {} bytes\n", .{bob_account.code_size});
    std.debug.print("\n", .{});

    // Example 9: State root with both accounts
    std.debug.print("9. Final State Root\n", .{});
    std.debug.print("   ----------------\n", .{});

    const final_root = tree.rootHash();
    std.debug.print("   Accounts: 2 (Alice, Bob)\n", .{});
    std.debug.print("   Storage slots (Alice): 5\n", .{});
    std.debug.print("   Root type: {s}\n", .{@tagName(tree.root)});
    std.debug.print("   State root: 0x{x}\n", .{final_root});
    std.debug.print("   Root hash commits to all account data and storage\n", .{});
    std.debug.print("\n", .{});

    // Example 10: Verify all data accessible
    std.debug.print("10. Verification\n", .{});
    std.debug.print("    -----------\n", .{});

    const alice_verify = tree.get(account_data_key);
    const bob_verify = tree.get(bob_account_key);

    var storage0_key = alice_key;
    storage0_key[31] = 1;
    const storage0_verify = tree.get(storage0_key);

    std.debug.print("   Alice account accessible: {}\n", .{alice_verify != null});
    std.debug.print("   Bob account accessible: {}\n", .{bob_verify != null});
    std.debug.print("   Alice storage accessible: {}\n", .{storage0_verify != null});

    if (alice_verify != null and bob_verify != null) {
        const alice = unpackAccountData(alice_verify.?);
        const bob = unpackAccountData(bob_verify.?);
        std.debug.print("   Alice balance: {} wei\n", .{alice.balance});
        std.debug.print("   Bob balance: {} wei\n", .{bob.balance});
        std.debug.print("   Total balance: {} wei\n", .{alice.balance + bob.balance});
    }
    std.debug.print("\n", .{});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
