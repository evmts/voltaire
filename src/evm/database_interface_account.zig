const std = @import("std");

/// Account state data structure
///
/// ## Field Ordering Optimization
/// Fields are ordered to minimize padding and improve cache locality:
/// - Large fields (u256, [32]u8) grouped together
/// - Smaller fields (u64) grouped together
/// - Most frequently accessed fields (balance, nonce) first
pub const Account = struct {
    /// Account balance in wei (frequently accessed)
    balance: u256,

    /// Hash of the contract code (keccak256 hash)
    /// Grouped with storage_root for better cache locality
    code_hash: [32]u8,

    /// Storage root hash (merkle root of account's storage trie)
    storage_root: [32]u8,

    /// Transaction nonce (number of transactions sent from this account)
    /// Smaller field placed last to minimize padding
    nonce: u64,

    /// Creates a new account with zero values
    pub fn zero() Account {
        return Account{
            .balance = 0,
            .code_hash = [_]u8{0} ** 32,
            .storage_root = [_]u8{0} ** 32,
            .nonce = 0,
        };
    }

    /// Checks if account is empty (zero balance, nonce, and no code)
    pub fn is_empty(self: Account) bool {
        return self.balance == 0 and
            self.nonce == 0 and
            std.mem.eql(u8, &self.code_hash, &[_]u8{0} ** 32);
    }
};

// =============================================================================
// Tests
// =============================================================================

const testing = std.testing;

test "Account.zero creates account with all zero values" {
    const account = Account.zero();
    try testing.expectEqual(@as(u256, 0), account.balance);
    try testing.expectEqual(@as(u64, 0), account.nonce);
    try testing.expectEqualSlices(u8, &[_]u8{0} ** 32, &account.code_hash);
    try testing.expectEqualSlices(u8, &[_]u8{0} ** 32, &account.storage_root);
}

test "Account.is_empty detects empty accounts" {
    const empty_account = Account.zero();
    try testing.expect(empty_account.is_empty());

    var non_empty_account = Account.zero();
    non_empty_account.balance = 100;
    try testing.expect(!non_empty_account.is_empty());

    non_empty_account = Account.zero();
    non_empty_account.nonce = 1;
    try testing.expect(!non_empty_account.is_empty());

    non_empty_account = Account.zero();
    non_empty_account.code_hash[0] = 1;
    try testing.expect(!non_empty_account.is_empty());
}
