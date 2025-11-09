// Transaction Signature Verification and Sender Recovery Example
//
// Demonstrates:
// - Checking if transaction is signed
// - Understanding signature components (r, s, yParity/v)
// - Converting between v and yParity
// - Signature malleability protection
// - Different signature formats across transaction types

const std = @import("std");
const primitives = @import("primitives");

const Transaction = primitives.Transaction;
const LegacyTransaction = Transaction.LegacyTransaction;
const EIP1559Transaction = Transaction.EIP1559Transaction;
const EIP7702Transaction = Transaction.EIP7702Transaction;
const Address = primitives.Address.Address;
const Authorization = Transaction.Authorization;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Transaction Signature Verification ===\n\n", .{});

    // Example 1: Check if transaction is signed
    std.debug.print("1. Checking Transaction Signature Status\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const recipient = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

    const unsigned_r = [_]u8{0} ** 32; // All zeros = unsigned
    const unsigned_s = [_]u8{0} ** 32;

    var signed_r = [_]u8{0} ** 32;
    var signed_s = [_]u8{0} ** 32;
    @memset(&signed_r, 0x12);
    @memset(&signed_s, 0xfe);

    std.debug.print("Unsigned transaction:\n", .{});
    std.debug.print("  r: 0x{X:0>64}\n", .{std.fmt.fmtSliceHexLower(&unsigned_r)});
    std.debug.print("  s: 0x{X:0>64}\n", .{std.fmt.fmtSliceHexLower(&unsigned_s)});
    std.debug.print("  isSigned: {}\n", .{!isAllZeros(&unsigned_r) and !isAllZeros(&unsigned_s)});
    std.debug.print("\n", .{});

    std.debug.print("Signed transaction:\n", .{});
    std.debug.print("  r: 0x{X:0>64}\n", .{std.fmt.fmtSliceHexLower(&signed_r)});
    std.debug.print("  s: 0x{X:0>64}\n", .{std.fmt.fmtSliceHexLower(&signed_s)});
    std.debug.print("  isSigned: {}\n", .{!isAllZeros(&signed_r) and !isAllZeros(&signed_s)});
    std.debug.print("\n", .{});

    // Example 2: Signature components for different transaction types
    std.debug.print("2. Signature Components by Transaction Type\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const legacy_tx = LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = recipient,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .v = 37, // EIP-155: chainId=1, yParity=0
        .r = signed_r,
        .s = signed_s,
    };

    std.debug.print("Legacy Transaction:\n", .{});
    std.debug.print("  Signature format: v/r/s\n", .{});
    std.debug.print("  v: {} (includes chain ID)\n", .{legacy_tx.v});
    std.debug.print("  r: 0x{s}...\n", .{std.fmt.fmtSliceHexLower(legacy_tx.r[0..8])});
    std.debug.print("  s: 0x{s}...\n", .{std.fmt.fmtSliceHexLower(legacy_tx.s[0..8])});
    std.debug.print("\n", .{});

    const eip1559_tx = EIP1559Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = 1_000_000_000,
        .max_fee_per_gas = 20_000_000_000,
        .gas_limit = 21000,
        .to = recipient,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .access_list = &[_]Transaction.AccessListItem{},
        .y_parity = 0,
        .r = signed_r,
        .s = signed_s,
    };

    std.debug.print("EIP-1559 Transaction:\n", .{});
    std.debug.print("  Signature format: yParity/r/s\n", .{});
    std.debug.print("  yParity: {} (0 or 1 only)\n", .{eip1559_tx.y_parity});
    std.debug.print("  r: 0x{s}...\n", .{std.fmt.fmtSliceHexLower(eip1559_tx.r[0..8])});
    std.debug.print("  s: 0x{s}...\n", .{std.fmt.fmtSliceHexLower(eip1559_tx.s[0..8])});
    std.debug.print("\n", .{});

    // Example 3: Converting between v and yParity
    std.debug.print("3. Converting Between v and yParity\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const chain_id: u64 = 1;
    const y_parity: u8 = 0;
    const v = calculateVFromYParity(y_parity, chain_id);
    const extracted_y_parity = extractYParityFromV(v, chain_id);

    std.debug.print("Chain ID: {}\n", .{chain_id});
    std.debug.print("yParity: {}\n", .{y_parity});
    std.debug.print("Calculated v: {}\n", .{v});
    std.debug.print("Extracted yParity: {}\n", .{extracted_y_parity});
    std.debug.print("\n", .{});

    std.debug.print("Conversion formulas:\n", .{});
    std.debug.print("  yParity → v: v = chain_id * 2 + 35 + y_parity\n", .{});
    std.debug.print("  v → yParity: y_parity = (v - 35 - chain_id * 2)\n", .{});
    std.debug.print("\n", .{});

    // Example 4: Signature malleability protection
    std.debug.print("4. Signature Malleability Protection\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // secp256k1 curve order
    const SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
    const SECP256K1_N_DIV_2 = SECP256K1_N / 2;

    std.debug.print("Ethereum requires s ≤ n/2 to prevent signature malleability.\n", .{});
    std.debug.print("\n", .{});
    std.debug.print("secp256k1 curve order (n):\n", .{});
    std.debug.print("  0x{X}\n", .{SECP256K1_N});
    std.debug.print("\n", .{});
    std.debug.print("Maximum allowed s (n/2):\n", .{});
    std.debug.print("  0x{X}\n", .{SECP256K1_N_DIV_2});
    std.debug.print("\n", .{});
    std.debug.print("Why? For every (r, s), there exists (r, n - s) that validates.\n", .{});
    std.debug.print("Requiring s ≤ n/2 makes signatures canonical (unique).\n", .{});
    std.debug.print("\n", .{});

    // Example 5: EIP-7702 dual signatures
    std.debug.print("5. EIP-7702: Authorization vs Transaction Signature\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    var auth_r = [_]u8{0} ** 32;
    var auth_s = [_]u8{0} ** 32;
    var tx_r = [_]u8{0} ** 32;
    var tx_s = [_]u8{0} ** 32;

    @memset(&auth_r, 0xaa);
    @memset(&auth_s, 0xbb);
    @memset(&tx_r, 0xcc);
    @memset(&tx_s, 0xdd);

    const contract_addr = try Address.fromHex("0x1234567890123456789012345678901234567890");

    var authorization_list = try allocator.alloc(Authorization, 1);
    defer allocator.free(authorization_list);

    authorization_list[0] = Authorization{
        .chain_id = 1,
        .address = contract_addr,
        .nonce = 0,
        .y_parity = 0,
        .r = auth_r,
        .s = auth_s,
    };

    std.debug.print("EIP-7702 has TWO signatures:\n\n", .{});
    std.debug.print("1. Authorization signature (signed by delegating EOA):\n", .{});
    std.debug.print("   yParity: {}\n", .{authorization_list[0].y_parity});
    std.debug.print("   r: 0x{s}...\n", .{std.fmt.fmtSliceHexLower(authorization_list[0].r[0..8])});
    std.debug.print("   s: 0x{s}...\n", .{std.fmt.fmtSliceHexLower(authorization_list[0].s[0..8])});
    std.debug.print("\n", .{});
    std.debug.print("2. Transaction signature (signed by transaction sender):\n", .{});
    std.debug.print("   yParity: 1\n", .{});
    std.debug.print("   r: 0x{s}...\n", .{std.fmt.fmtSliceHexLower(tx_r[0..8])});
    std.debug.print("   s: 0x{s}...\n", .{std.fmt.fmtSliceHexLower(tx_s[0..8])});
    std.debug.print("\n", .{});
    std.debug.print("Both must be valid for transaction to execute!\n", .{});
    std.debug.print("\n", .{});

    // Example 6: Sender recovery process
    std.debug.print("6. Sender Recovery Process\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Steps to recover sender address:\n", .{});
    std.debug.print("  1. Get signing hash (keccak256 of transaction data)\n", .{});
    std.debug.print("  2. Recover public key using secp256k1.recover(hash, r, s, yParity)\n", .{});
    std.debug.print("  3. Hash public key with keccak256\n", .{});
    std.debug.print("  4. Take last 20 bytes as address\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Note: Actual implementation requires secp256k1 crypto library.\n", .{});
    std.debug.print("\n", .{});

    // Example 7: Practical use cases
    std.debug.print("7. Practical Use Cases\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Transaction Pool Validation:\n", .{});
    std.debug.print("  1. Verify signature is valid\n", .{});
    std.debug.print("  2. Recover sender address\n", .{});
    std.debug.print("  3. Check sender has sufficient balance\n", .{});
    std.debug.print("  4. Check sender nonce matches transaction nonce\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Replay Attack Protection:\n", .{});
    std.debug.print("  1. Verify chain ID in transaction\n", .{});
    std.debug.print("  2. Ensure chain ID matches current network\n", .{});
    std.debug.print("  3. Check signature was created for this chain\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Authorization Checking:\n", .{});
    std.debug.print("  1. Recover sender from signature\n", .{});
    std.debug.print("  2. Compare with expected sender\n", .{});
    std.debug.print("  3. Reject if mismatch\n", .{});

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}

// Helper functions

fn isAllZeros(bytes: []const u8) bool {
    for (bytes) |b| {
        if (b != 0) return false;
    }
    return true;
}

fn calculateVFromYParity(y_parity: u8, chain_id: u64) u64 {
    // v = chain_id * 2 + 35 + y_parity
    return chain_id * 2 + 35 + y_parity;
}

fn extractYParityFromV(v: u64, chain_id: u64) u8 {
    // For EIP-155: v = chain_id * 2 + 35 + y_parity
    // y_parity = (v - 35 - chain_id * 2)
    if (v == 27 or v == 28) {
        // Pre-EIP-155
        return @intCast(v - 27);
    }
    return @intCast(v - 35 - chain_id * 2);
}
