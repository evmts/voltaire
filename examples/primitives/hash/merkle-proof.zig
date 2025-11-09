const std = @import("std");
const primitives = @import("primitives");
const Hash = primitives.hash.Hash;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const a = gpa.allocator();

    std.debug.print("\n=== Merkle Proof Example ===\n\n", .{});

    // ============================================================
    // 1. Merkle Tree Basics
    // ============================================================

    std.debug.print("1. Merkle Tree Basics\n\n", .{});

    // Hash pair of nodes together
    const hashPair = struct {
        fn hash(left: Hash, right: Hash) !Hash {
            var combined: [64]u8 = undefined;
            @memcpy(combined[0..32], &left);
            @memcpy(combined[32..64], &right);
            return try Hash.keccak256(&combined);
        }
    }.hash;

    // Simple example with 4 leaves
    const leaf1 = try Hash.keccak256String("Alice: 100 tokens");
    const leaf2 = try Hash.keccak256String("Bob: 200 tokens");
    const leaf3 = try Hash.keccak256String("Charlie: 150 tokens");
    const leaf4 = try Hash.keccak256String("Dave: 75 tokens");

    const hex1 = Hash.toHex(leaf1);
    const hex2 = Hash.toHex(leaf2);
    const hex3 = Hash.toHex(leaf3);
    const hex4 = Hash.toHex(leaf4);

    std.debug.print("Leaves:\n", .{});
    std.debug.print("  1. Alice:   0x{s}...{s}\n", .{ hex1[2..8], hex1[hex1.len - 4 ..] });
    std.debug.print("  2. Bob:     0x{s}...{s}\n", .{ hex2[2..8], hex2[hex2.len - 4 ..] });
    std.debug.print("  3. Charlie: 0x{s}...{s}\n", .{ hex3[2..8], hex3[hex3.len - 4 ..] });
    std.debug.print("  4. Dave:    0x{s}...{s}\n", .{ hex4[2..8], hex4[hex4.len - 4 ..] });

    // Level 1: Hash pairs
    const node12 = try hashPair(leaf1, leaf2);
    const node34 = try hashPair(leaf3, leaf4);

    const hex12 = Hash.toHex(node12);
    const hex34 = Hash.toHex(node34);

    std.debug.print("\nLevel 1:\n", .{});
    std.debug.print("  1-2: 0x{s}...{s}\n", .{ hex12[2..8], hex12[hex12.len - 4 ..] });
    std.debug.print("  3-4: 0x{s}...{s}\n", .{ hex34[2..8], hex34[hex34.len - 4 ..] });

    // Root: Hash the two level 1 nodes
    const root = try hashPair(node12, node34);
    const hex_root = Hash.toHex(root);

    std.debug.print("\nRoot:\n", .{});
    std.debug.print("  0x{s}...{s}\n\n", .{ hex_root[2..8], hex_root[hex_root.len - 4 ..] });

    // ============================================================
    // 2. Building Complete Merkle Tree
    // ============================================================

    std.debug.print("2. Building Complete Merkle Tree\n\n", .{});

    const MerkleTree = struct {
        leaves: []const Hash,
        layers: std.ArrayList(std.ArrayList(Hash)),
        allocator: std.mem.Allocator,

        fn init(allocator: std.mem.Allocator, leaves: []const Hash) !@This() {
            if (leaves.len == 0) {
                return error.EmptyLeaves;
            }

            var layers = std.ArrayList(std.ArrayList(Hash)).init(allocator);
            var current_level = std.ArrayList(Hash).init(allocator);
            for (leaves) |leaf| {
                try current_level.append(leaf);
            }
            try layers.append(current_level);

            // Build tree
            while (layers.items[layers.items.len - 1].items.len > 1) {
                const prev_level = layers.items[layers.items.len - 1].items;
                var next_level = std.ArrayList(Hash).init(allocator);

                var i: usize = 0;
                while (i < prev_level.len) : (i += 2) {
                    if (i + 1 < prev_level.len) {
                        const pair = try hashPair(prev_level[i], prev_level[i + 1]);
                        try next_level.append(pair);
                    } else {
                        try next_level.append(prev_level[i]);
                    }
                }

                try layers.append(next_level);
            }

            return @This(){
                .leaves = leaves,
                .layers = layers,
                .allocator = allocator,
            };
        }

        fn deinit(self: *@This()) void {
            for (self.layers.items) |layer| {
                layer.deinit();
            }
            self.layers.deinit();
        }

        fn getRoot(self: @This()) Hash {
            return self.layers.items[self.layers.items.len - 1].items[0];
        }

        fn getProof(self: @This(), allocator: std.mem.Allocator, leaf_index: usize) !std.ArrayList(Hash) {
            if (leaf_index >= self.leaves.len) {
                return error.InvalidLeafIndex;
            }

            var proof = std.ArrayList(Hash).init(allocator);
            var index = leaf_index;

            for (0..self.layers.items.len - 1) |level| {
                const current_layer = self.layers.items[level].items;
                const is_left = (index % 2) == 0;
                const sibling_index = if (is_left) index + 1 else index - 1;

                if (sibling_index < current_layer.len) {
                    try proof.append(current_layer[sibling_index]);
                }

                index = index / 2;
            }

            return proof;
        }

        fn getDepth(self: @This()) usize {
            return self.layers.items.len - 1;
        }
    };

    // Build tree
    const leaves = [_]Hash{ leaf1, leaf2, leaf3, leaf4 };
    var tree = try MerkleTree.init(a, &leaves);
    defer tree.deinit();

    std.debug.print("Tree depth: {}\n", .{tree.getDepth()});
    const tree_root = tree.getRoot();
    const tree_root_hex = Hash.toHex(tree_root);
    std.debug.print("Root: 0x{s}...{s}\n\n", .{ tree_root_hex[2..8], tree_root_hex[tree_root_hex.len - 4 ..] });

    // ============================================================
    // 3. Generating Proofs
    // ============================================================

    std.debug.print("3. Generating Merkle Proofs\n\n", .{});

    // Generate proof for Alice (index 0)
    var alice_proof = try tree.getProof(a, 0);
    defer alice_proof.deinit();

    std.debug.print("Proof for Alice (leaf 0):\n", .{});
    for (alice_proof.items, 0..) |hash, i| {
        const proof_hex = Hash.toHex(hash);
        std.debug.print("  {}. 0x{s}...{s}\n", .{ i + 1, proof_hex[2..8], proof_hex[proof_hex.len - 4 ..] });
    }

    // Generate proof for Charlie (index 2)
    var charlie_proof = try tree.getProof(a, 2);
    defer charlie_proof.deinit();

    std.debug.print("\nProof for Charlie (leaf 2):\n", .{});
    for (charlie_proof.items, 0..) |hash, i| {
        const proof_hex = Hash.toHex(hash);
        std.debug.print("  {}. 0x{s}...{s}\n", .{ i + 1, proof_hex[2..8], proof_hex[proof_hex.len - 4 ..] });
    }
    std.debug.print("\n", .{});

    // ============================================================
    // 4. Verifying Proofs
    // ============================================================

    std.debug.print("4. Verifying Merkle Proofs\n\n", .{});

    const verifyProof = struct {
        fn verify(leaf: Hash, proof: []const Hash, expected_root: Hash, leaf_index: usize) !bool {
            var computed_hash = leaf;
            var index = leaf_index;

            for (proof) |proof_element| {
                const is_left = (index % 2) == 0;

                if (is_left) {
                    computed_hash = try hashPair(computed_hash, proof_element);
                } else {
                    computed_hash = try hashPair(proof_element, computed_hash);
                }

                index = index / 2;
            }

            return Hash.equals(computed_hash, expected_root);
        }
    }.verify;

    // Verify Alice's proof
    const alice_valid = try verifyProof(leaf1, alice_proof.items, tree_root, 0);
    std.debug.print("Alice proof valid: {}\n", .{alice_valid});

    // Verify Charlie's proof
    const charlie_valid = try verifyProof(leaf3, charlie_proof.items, tree_root, 2);
    std.debug.print("Charlie proof valid: {}\n", .{charlie_valid});

    // Try invalid proof (wrong leaf)
    const invalid_proof = try verifyProof(leaf1, charlie_proof.items, tree_root, 2);
    std.debug.print("Invalid proof (wrong leaf): {}\n\n", .{invalid_proof});

    // ============================================================
    // 5. Airdrop Eligibility Example
    // ============================================================

    std.debug.print("5. Airdrop Eligibility (Real-World Use Case)\n\n", .{});

    const AirdropEntry = struct {
        address: []const u8,
        amount: u64,
    };

    const airdrop_list = [_]AirdropEntry{
        .{ .address = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e", .amount = 1000 },
        .{ .address = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", .amount = 2000 },
        .{ .address = "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2", .amount = 1500 },
        .{ .address = "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db", .amount = 750 },
    };

    // Create leaves from airdrop entries
    var airdrop_leaves: [4]Hash = undefined;
    for (airdrop_list, 0..) |entry, i| {
        var buf: [200]u8 = undefined;
        const data = try std.fmt.bufPrint(&buf, "{s}:{d}", .{ entry.address, entry.amount });
        airdrop_leaves[i] = try Hash.keccak256String(data);
    }

    var airdrop_tree = try MerkleTree.init(a, &airdrop_leaves);
    defer airdrop_tree.deinit();

    const airdrop_root = airdrop_tree.getRoot();
    const airdrop_root_hex = Hash.toHex(airdrop_root);
    std.debug.print("Airdrop Merkle root: {s}\n", .{&airdrop_root_hex});
    std.debug.print("(This would be stored on-chain)\n\n", .{});

    // User claims their airdrop
    var user0_proof = try airdrop_tree.getProof(a, 0);
    defer user0_proof.deinit();

    const user0_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
    const user0_amount: u64 = 1000;

    var claim_buf: [200]u8 = undefined;
    const claim_data = try std.fmt.bufPrint(&claim_buf, "{s}:{d}", .{ user0_address, user0_amount });
    const claim_leaf = try Hash.keccak256String(claim_data);
    const claim_valid = try verifyProof(claim_leaf, user0_proof.items, airdrop_root, 0);

    std.debug.print("User 0 claim ({s}):\n", .{user0_address});
    std.debug.print("  Amount: {} tokens\n", .{user0_amount});
    std.debug.print("  Proof length: {} hashes\n", .{user0_proof.items.len});
    std.debug.print("  Valid: {}\n\n", .{claim_valid});

    // ============================================================
    // 6. Proof Size Efficiency
    // ============================================================

    std.debug.print("6. Proof Size Efficiency\n\n", .{});

    const demonstrateProofSize = struct {
        fn demo(allocator: std.mem.Allocator, num_leaves: usize) !void {
            var dummy_leaves = std.ArrayList(Hash).init(allocator);
            defer dummy_leaves.deinit();

            for (0..num_leaves) |i| {
                var buf: [50]u8 = undefined;
                const data = try std.fmt.bufPrint(&buf, "leaf {d}", .{i});
                const leaf = try Hash.keccak256String(data);
                try dummy_leaves.append(leaf);
            }

            var dummy_tree = try MerkleTree.init(allocator, dummy_leaves.items);
            defer dummy_tree.deinit();

            var proof = try dummy_tree.getProof(allocator, 0);
            defer proof.deinit();

            const proof_size = proof.items.len * 32;
            const depth = dummy_tree.getDepth();

            std.debug.print("  {d:>6} leaves → depth: {d}, proof: {d} hashes ({d} bytes)\n", .{ num_leaves, depth, proof.items.len, proof_size });
        }
    }.demo;

    std.debug.print("Proof sizes for different tree sizes:\n", .{});
    try demonstrateProofSize(a, 4);
    try demonstrateProofSize(a, 8);
    try demonstrateProofSize(a, 16);
    try demonstrateProofSize(a, 32);
    try demonstrateProofSize(a, 64);
    try demonstrateProofSize(a, 128);
    try demonstrateProofSize(a, 256);

    std.debug.print("\nNote: Proof size grows logarithmically (O(log n))\n\n", .{});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
