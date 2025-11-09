const std = @import("std");
const primitives = @import("primitives");
const BinaryTree = primitives.BinaryTree;

fn createTestData(account_number: u8) [32]u8 {
    var data: [32]u8 = undefined;
    @memset(&data, 0);
    data[0] = account_number;
    data[1] = 0x01; // version
    return data;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Binary Merkle Tree State Commitment ===\n\n", .{});

    // Example 1: Initial state (empty tree)
    std.debug.print("1. Initial State (Empty Tree)\n", .{});
    std.debug.print("   ---------------------------\n", .{});

    var tree = BinaryTree.init(allocator);
    defer tree.deinit();

    const initial_hash = tree.rootHash();
    const all_zeros = std.mem.allEqual(u8, &initial_hash, 0);
    std.debug.print("   Root hash: 0x{x}\n", .{initial_hash});
    std.debug.print("   All zeros: {}\n", .{all_zeros});
    std.debug.print("\n", .{});

    // Example 2: Add first account (Alice)
    std.debug.print("2. Adding First Account (Alice)\n", .{});
    std.debug.print("   -----------------------------\n", .{});

    var alice_key: [32]u8 = undefined;
    @memset(&alice_key, 0);
    alice_key[12] = 0x01; // Address-like key
    alice_key[31] = 0; // Subindex 0 (account data)

    const alice_data = createTestData(1);
    try tree.insert(alice_key, alice_data);

    const state_root1 = tree.rootHash();
    std.debug.print("   Alice key[12]: 0x{x}\n", .{alice_key[12]});
    std.debug.print("   Account data[0]: {}\n", .{alice_data[0]});
    std.debug.print("   Root type: {s}\n", .{@tagName(tree.root)});
    std.debug.print("   State root: 0x{x}\n", .{state_root1});
    std.debug.print("\n", .{});

    // Example 3: Add second account (Alice storage)
    std.debug.print("3. Adding Second Account (Alice Storage)\n", .{});
    std.debug.print("   --------------------------------------\n", .{});

    var alice_storage_key: [32]u8 = undefined;
    @memset(&alice_storage_key, 0);
    alice_storage_key[12] = 0x01; // Same address
    alice_storage_key[31] = 1; // Subindex 1 (storage slot 0)

    var storage_value: [32]u8 = undefined;
    @memset(&storage_value, 0);
    storage_value[31] = 0xAA;

    try tree.insert(alice_storage_key, storage_value);

    const state_root2 = tree.rootHash();
    std.debug.print("   Storage key[31]: {}\n", .{alice_storage_key[31]});
    std.debug.print("   Storage value[31]: 0x{x}\n", .{storage_value[31]});
    std.debug.print("   Root type: {s}\n", .{@tagName(tree.root)});

    const changed = !std.mem.eql(u8, &state_root1, &state_root2);
    std.debug.print("   State root changed: {}\n", .{changed});
    std.debug.print("   New state root: 0x{x}\n", .{state_root2});
    std.debug.print("\n", .{});

    // Example 4: Add third account (Bob)
    std.debug.print("4. Adding Third Account (Bob)\n", .{});
    std.debug.print("   ---------------------------\n", .{});

    var bob_key: [32]u8 = undefined;
    @memset(&bob_key, 0);
    bob_key[12] = 0x02; // Different address
    bob_key[31] = 0; // Subindex 0 (account data)

    const bob_data = createTestData(2);
    try tree.insert(bob_key, bob_data);

    const state_root3 = tree.rootHash();
    std.debug.print("   Bob key[12]: 0x{x}\n", .{bob_key[12]});
    std.debug.print("   Account data[0]: {}\n", .{bob_data[0]});
    std.debug.print("   Root type now: {s}\n", .{@tagName(tree.root)});

    const is_internal = tree.root == .internal;
    std.debug.print("   Tree branched: {}\n", .{is_internal});

    const changed2 = !std.mem.eql(u8, &state_root2, &state_root3);
    std.debug.print("   State root changed: {}\n", .{changed2});
    std.debug.print("   New state root: 0x{x}\n", .{state_root3});
    std.debug.print("\n", .{});

    // Example 5: Add fourth account (Carol)
    std.debug.print("5. Adding Fourth Account (Carol)\n", .{});
    std.debug.print("   ------------------------------\n", .{});

    var carol_key: [32]u8 = undefined;
    @memset(&carol_key, 0);
    carol_key[12] = 0xFF; // Very different address
    carol_key[31] = 0; // Subindex 0 (account data)

    const carol_data = createTestData(3);
    try tree.insert(carol_key, carol_data);

    const state_root4 = tree.rootHash();
    std.debug.print("   Carol key[12]: 0x{x}\n", .{carol_key[12]});
    std.debug.print("   Account data[0]: {}\n", .{carol_data[0]});
    std.debug.print("   Root type: {s}\n", .{@tagName(tree.root)});

    const changed3 = !std.mem.eql(u8, &state_root3, &state_root4);
    std.debug.print("   State root changed: {}\n", .{changed3});
    std.debug.print("   New state root: 0x{x}\n", .{state_root4});
    std.debug.print("\n", .{});

    // Example 6: Verify all data is still accessible
    std.debug.print("6. Verifying All Data Remains Accessible\n", .{});
    std.debug.print("   -------------------------------------\n", .{});

    const alice_retrieved = tree.get(alice_key);
    const alice_storage_retrieved = tree.get(alice_storage_key);
    const bob_retrieved = tree.get(bob_key);
    const carol_retrieved = tree.get(carol_key);

    std.debug.print("   Alice data accessible: {}\n", .{alice_retrieved != null});
    std.debug.print("   Alice storage accessible: {}\n", .{alice_storage_retrieved != null});
    std.debug.print("   Bob data accessible: {}\n", .{bob_retrieved != null});
    std.debug.print("   Carol data accessible: {}\n", .{carol_retrieved != null});
    std.debug.print("\n", .{});

    // Example 7: State commitment demonstration
    std.debug.print("7. State Commitment Demonstration\n", .{});
    std.debug.print("   -------------------------------\n", .{});
    std.debug.print("   State progression:\n", .{});
    std.debug.print("   Empty tree:         0x{x}\n", .{initial_hash});
    std.debug.print("   After Alice:        0x{x}\n", .{state_root1});
    std.debug.print("   After Alice+storage: 0x{x}\n", .{state_root2});
    std.debug.print("   After Bob:          0x{x}\n", .{state_root3});
    std.debug.print("   After Carol:        0x{x}\n", .{state_root4});
    std.debug.print("   Each insertion changes root hash\n", .{});
    std.debug.print("   Root hash = cryptographic commitment to entire state\n", .{});
    std.debug.print("\n", .{});

    // Example 8: Verify current state
    std.debug.print("8. Verify Current State\n", .{});
    std.debug.print("   --------------------\n", .{});

    const current_root = tree.rootHash();
    const match = std.mem.eql(u8, &current_root, &state_root4);
    std.debug.print("   Expected root: 0x{x}\n", .{state_root4});
    std.debug.print("   Current root:  0x{x}\n", .{current_root});
    std.debug.print("   Match: {}\n", .{match});
    std.debug.print("\n", .{});

    // Example 9: Demonstrate determinism
    std.debug.print("9. Demonstrating Determinism\n", .{});
    std.debug.print("   -------------------------\n", .{});

    var tree2 = BinaryTree.init(allocator);
    defer tree2.deinit();

    try tree2.insert(alice_key, alice_data);
    try tree2.insert(alice_storage_key, storage_value);
    try tree2.insert(bob_key, bob_data);
    try tree2.insert(carol_key, carol_data);

    const rebuilt_root = tree2.rootHash();
    const deterministic = std.mem.eql(u8, &current_root, &rebuilt_root);
    std.debug.print("   Original root:  0x{x}\n", .{current_root});
    std.debug.print("   Rebuilt root:   0x{x}\n", .{rebuilt_root});
    std.debug.print("   Deterministic:  {}\n", .{deterministic});
    std.debug.print("   Same insertions always produce same root hash\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
