const std = @import("std");
const crypto = @import("crypto");
const SHA256 = crypto.SHA256;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== SHA256 Merkle Tree ===\n\n", .{});

    // Example 1: Build simple Merkle tree
    std.debug.print("1. Building Merkle Tree\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const leaves = [_][]const u8{
        "Transaction 1",
        "Transaction 2",
        "Transaction 3",
        "Transaction 4",
    };

    std.debug.print("Building tree from {} leaves:\n\n", .{leaves.len});
    for (leaves, 0..) |leaf, i| {
        std.debug.print("  Leaf {}: \"{s}\"\n", .{ i, leaf });
    }
    std.debug.print("\n", .{});

    var tree = try buildMerkleTree(&leaves, allocator);
    defer {
        for (tree.items) |level| {
            allocator.free(level);
        }
        tree.deinit(allocator);
    }

    const root = tree.items[tree.items.len - 1][0];

    std.debug.print("Tree structure:\n", .{});
    var level: usize = tree.items.len;
    while (level > 0) : (level -= 1) {
        const indent = " " ** ((level - 1) * 2);
        std.debug.print("Level {}:{s} {} nodes\n", .{
            tree.items.len - level,
            indent,
            tree.items[level - 1].len / 32,
        });
    }
    std.debug.print("\n", .{});
    std.debug.print("Merkle Root: 0x{s}\n\n", .{std.fmt.fmtSliceHexLower(root[0..32])});

    // Example 2: Merkle proof generation and verification
    std.debug.print("2. Merkle Proof Generation and Verification\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const leaf_index: usize = 2;
    const leaf = leaves[leaf_index];

    std.debug.print("Generating proof for leaf {}: \"{s}\"\n\n", .{ leaf_index, leaf });

    const proof = try generateMerkleProof(tree, leaf_index, allocator);
    defer allocator.free(proof);

    std.debug.print("Proof path:\n", .{});
    for (proof, 0..) |step, i| {
        const pos_str = if (step.position == .left) "left " else "right";
        std.debug.print("  Step {}: {s} 0x{s}...\n", .{
            i + 1,
            pos_str,
            std.fmt.fmtSliceHexLower(step.hash[0..8]),
        });
    }
    std.debug.print("\n", .{});

    const is_valid = try verifyMerkleProof(leaf, proof, root[0..32], allocator);
    const valid_str = if (is_valid) "✓ VALID" else "✗ INVALID";
    std.debug.print("Proof verification: {s}\n\n", .{valid_str});

    // Tamper with leaf
    const tampered_leaf = "Transaction 3 (modified)";
    const tampered_valid = try verifyMerkleProof(tampered_leaf, proof, root[0..32], allocator);
    const tampered_str = if (tampered_valid) "✓ VALID" else "✗ INVALID";
    std.debug.print("Tampered leaf verification: {s}\n\n", .{tampered_str});

    // Example 3: Odd number of leaves
    std.debug.print("3. Merkle Tree with Odd Number of Leaves\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const odd_leaves = [_][]const u8{
        "TX 1",
        "TX 2",
        "TX 3",
        "TX 4",
        "TX 5",
    };

    std.debug.print("Building tree from {} leaves (odd number)\n", .{odd_leaves.len});
    std.debug.print("Last node will be duplicated at each level\n\n", .{});

    var odd_tree = try buildMerkleTree(&odd_leaves, allocator);
    defer {
        for (odd_tree.items) |lev| {
            allocator.free(lev);
        }
        odd_tree.deinit(allocator);
    }

    const odd_root = odd_tree.items[odd_tree.items.len - 1][0];

    for (odd_tree.items, 0..) |lev, i| {
        std.debug.print("Level {}: {} nodes\n", .{ i, lev.len / 32 });
    }
    std.debug.print("\n", .{});
    std.debug.print("Merkle Root: 0x{s}\n\n", .{std.fmt.fmtSliceHexLower(odd_root[0..32])});

    std.debug.print("=== Merkle Tree Complete ===\n", .{});
}

// Helper: Double SHA-256 (Bitcoin style)
fn doubleSha256(data: []const u8) [32]u8 {
    const first = SHA256.hash(data);
    return SHA256.hash(&first);
}

const ProofStep = struct {
    hash: [32]u8,
    position: enum { left, right },
};

// Build Merkle tree from leaves
fn buildMerkleTree(leaves: []const []const u8, allocator: std.mem.Allocator) !std.ArrayList([]u8) {
    var tree = std.ArrayList([]u8){};

    // First level: hash all leaves
    var first_level = try allocator.alloc(u8, leaves.len * 32);
    for (leaves, 0..) |leaf, i| {
        const hash = doubleSha256(leaf);
        @memcpy(first_level[i * 32 .. (i + 1) * 32], &hash);
    }
    try tree.append(allocator, first_level);

    // Build subsequent levels
    var current_level = first_level;
    while (current_level.len > 32) {
        const node_count = current_level.len / 32;
        const next_node_count = (node_count + 1) / 2;
        var next_level = try allocator.alloc(u8, next_node_count * 32);

        var i: usize = 0;
        while (i < node_count) : (i += 2) {
            const left = current_level[i * 32 .. (i + 1) * 32];
            const right = if (i + 1 < node_count)
                current_level[(i + 1) * 32 .. (i + 2) * 32]
            else
                left;

            // Combine and hash
            var combined: [64]u8 = undefined;
            @memcpy(combined[0..32], left);
            @memcpy(combined[32..64], right);
            const hash = doubleSha256(&combined);
            @memcpy(next_level[(i / 2) * 32 .. ((i / 2) + 1) * 32], &hash);
        }

        try tree.append(allocator, next_level);
        current_level = next_level;
    }

    return tree;
}

// Generate Merkle proof for a leaf
fn generateMerkleProof(tree: std.ArrayList([]u8), leaf_index: usize, allocator: std.mem.Allocator) ![]ProofStep {
    var proof = std.ArrayList(ProofStep){};
    defer proof.deinit(allocator);

    var index = leaf_index;

    for (tree.items[0 .. tree.items.len - 1]) |level| {
        const node_count = level.len / 32;
        const is_right_node = index % 2 == 1;
        const sibling_index = if (is_right_node) index - 1 else index + 1;

        if (sibling_index < node_count) {
            var step: ProofStep = undefined;
            @memcpy(&step.hash, level[sibling_index * 32 .. (sibling_index + 1) * 32]);
            step.position = if (is_right_node) .left else .right;
            try proof.append(allocator, step);
        }

        index = index / 2;
    }

    return proof.toOwnedSlice(allocator);
}

// Verify Merkle proof
fn verifyMerkleProof(
    leaf: []const u8,
    proof: []const ProofStep,
    root: []const u8,
    allocator: std.mem.Allocator,
) !bool {
    _ = allocator;
    var hash = doubleSha256(leaf);

    for (proof) |step| {
        var combined: [64]u8 = undefined;
        if (step.position == .left) {
            @memcpy(combined[0..32], &step.hash);
            @memcpy(combined[32..64], &hash);
        } else {
            @memcpy(combined[0..32], &hash);
            @memcpy(combined[32..64], &step.hash);
        }
        hash = doubleSha256(&combined);
    }

    return std.mem.eql(u8, &hash, root);
}
