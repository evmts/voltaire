const std = @import("std");
const testing = std.testing;

// Import the minimal set of EVM2 components we need
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.Address.ZERO_ADDRESS;

const ExecutionError = @import("evm").ExecutionError;

// Create isolated EVM2 types to avoid frame issues
const BlockInfo = struct {
    number: u64,
    timestamp: u64,
    difficulty: u256,
    gas_limit: u64,
    coinbase: Address,
    base_fee: u64,
    prev_randao: [32]u8,
};

const MemoryDatabase = struct {
    accounts: std.HashMap(Address, Account, AddressContext, std.hash_map.default_max_load_percentage),
    storage: std.HashMap(StorageKey, u256, StorageKeyContext, std.hash_map.default_max_load_percentage),
    transient_storage: std.HashMap(StorageKey, u256, StorageKeyContext, std.hash_map.default_max_load_percentage),
    code_storage: std.HashMap([32]u8, []const u8, HashContext, std.hash_map.default_max_load_percentage),
    allocator: std.mem.Allocator,

    const Account = struct {
        balance: u256,
        code_hash: [32]u8,
        storage_root: [32]u8,
        nonce: u64,
    };

    const StorageKey = struct {
        address: Address,
        key: u256,
    };

    const AddressContext = struct {
        pub fn hash(self: @This(), s: Address) u64 {
            _ = self;
            return std.hash_map.hashString(@as([]const u8, &s));
        }
        pub fn eql(self: @This(), a: Address, b: Address) bool {
            _ = self;
            return std.mem.eql(u8, &a, &b);
        }
    };

    const StorageKeyContext = struct {
        pub fn hash(self: @This(), key: StorageKey) u64 {
            _ = self;
            var hasher = std.hash.Wyhash.init(0);
            hasher.update(&key.address);
            hasher.update(std.mem.asBytes(&key.key));
            return hasher.final();
        }
        pub fn eql(self: @This(), a: StorageKey, b: StorageKey) bool {
            _ = self;
            return std.mem.eql(u8, &a.address, &b.address) and a.key == b.key;
        }
    };

    const HashContext = struct {
        pub fn hash(self: @This(), s: [32]u8) u64 {
            _ = self;
            return std.hash_map.hashString(@as([]const u8, &s));
        }
        pub fn eql(self: @This(), a: [32]u8, b: [32]u8) bool {
            _ = self;
            return std.mem.eql(u8, &a, &b);
        }
    };

    pub fn init(allocator: std.mem.Allocator) MemoryDatabase {
        return MemoryDatabase{
            .accounts = std.HashMap(Address, Account, AddressContext, std.hash_map.default_max_load_percentage).init(allocator),
            .storage = std.HashMap(StorageKey, u256, StorageKeyContext, std.hash_map.default_max_load_percentage).init(allocator),
            .transient_storage = std.HashMap(StorageKey, u256, StorageKeyContext, std.hash_map.default_max_load_percentage).init(allocator),
            .code_storage = std.HashMap([32]u8, []const u8, HashContext, std.hash_map.default_max_load_percentage).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *MemoryDatabase) void {
        self.accounts.deinit();
        self.storage.deinit();
        self.transient_storage.deinit();
        self.code_storage.deinit();
    }

    pub fn get_code_by_address(self: *MemoryDatabase, address: Address) ![]const u8 {
        if (self.accounts.get(address)) |account| {
            return self.code_storage.get(account.code_hash) orelse &.{};
        }
        return &.{};
    }

    pub fn set_code(self: *MemoryDatabase, code: []const u8) ![32]u8 {
        var hash: [32]u8 = undefined;
        std.crypto.hash.sha3.Keccak256.hash(code, &hash, .{});
        try self.code_storage.put(hash, code);
        return hash;
    }

    pub fn set_account(self: *MemoryDatabase, address: Address, account: Account) !void {
        try self.accounts.put(address, account);
    }
};

// Simple test for the contract code loading functionality
test "database loads contract code by address" {
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();

    // Set up contract with bytecode [0x00] (STOP)
    const contract_address = primitives.Address.from_hex("0x1234567890123456789012345678901234567890") catch ZERO_ADDRESS;
    const bytecode = [_]u8{0x00};
    const code_hash = try memory_db.set_code(&bytecode);

    // Create an account with the code hash
    const account = MemoryDatabase.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    };
    try memory_db.set_account(contract_address, account);

    // Test code loading
    const loaded_code = try memory_db.get_code_by_address(contract_address);
    try testing.expectEqualSlices(u8, &bytecode, loaded_code);
}

test "database returns empty code for non-existent address" {
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();

    const non_existent_address = ZERO_ADDRESS;
    const loaded_code = try memory_db.get_code_by_address(non_existent_address);
    try testing.expectEqualSlices(u8, &.{}, loaded_code);
}

test "contract code loading edge cases" {
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();

    // Test with larger bytecode
    const contract_address = primitives.Address.from_hex("0x1111111111111111111111111111111111111111") catch ZERO_ADDRESS;
    const large_bytecode = [_]u8{ 0x60, 0x01, 0x60, 0x00, 0x52, 0x60, 0x01, 0x60, 0x00, 0xF3 }; // PUSH1 1 PUSH1 0 MSTORE PUSH1 1 PUSH1 0 RETURN
    const code_hash = try memory_db.set_code(&large_bytecode);

    const account = MemoryDatabase.Account{
        .balance = 1000,
        .nonce = 5,
        .code_hash = code_hash,
        .storage_root = [_]u8{0xAB} ** 32,
    };
    try memory_db.set_account(contract_address, account);

    const loaded_code = try memory_db.get_code_by_address(contract_address);
    try testing.expectEqualSlices(u8, &large_bytecode, loaded_code);
}