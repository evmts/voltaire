//! ForkBlockCache - Remote block fetching with caching and async request/continue
//!
//! Fetches blocks from remote RPC provider with local caching:
//! - Async request queue for WASM-friendly RPC bridging
//! - Simple FIFO cache (10k blocks)
//! - Fork boundary checking (blocks <= forkBlock from remote)
//!
//! ## Architecture
//! - cache: Map<Hash, Block> - Recently fetched blocks
//! - cache_by_number: Map<u64, Hash> - Number -> hash lookup
//! - cache_queue: FIFO for eviction
//! - pending_queue/pending_by_id: Async RPC queue
//! - missing_numbers/missing_hashes: Negative cache

const std = @import("std");
const primitives = @import("primitives");
const Block = primitives.Block;
const BlockBody = primitives.BlockBody.BlockBody;
const BlockHeader = primitives.BlockHeader.BlockHeader;
const Address = primitives.Address;
const Hash = primitives.Hash;
const Hex = primitives.Hex;
const json = std.json;

/// Max cache size (10k blocks)
const MAX_CACHE_SIZE: usize = 10_000;

/// Async RPC request kind
const RequestKind = enum {
    by_number,
    by_hash,
};

/// Pending request key for de-duplication
const PendingKey = struct {
    kind: RequestKind,
    number: u64,
    hash: Hash.Hash,
};

/// Pending request payload
pub const PendingRequest = struct {
    id: u64,
    kind: RequestKind,
    number: u64,
    hash: Hash.Hash,
    params_json: []u8,
};

/// ForkBlockCache - Remote block fetching with local cache
pub const ForkBlockCache = struct {
    allocator: std.mem.Allocator,

    /// Fork block number (blocks <= this are read-only from remote)
    fork_block_number: u64,

    /// Block cache (hash -> block)
    cache: std.AutoHashMap(Hash.Hash, Block.Block),

    /// Number -> hash lookup
    cache_by_number: std.AutoHashMap(u64, Hash.Hash),

    /// Cache FIFO queue (for eviction)
    cache_queue: std.ArrayList(Hash.Hash),

    /// Async request management
    pending_queue: std.ArrayList(u64),
    pending_by_id: std.AutoHashMap(u64, PendingRequest),
    pending_keys: std.AutoHashMap(PendingKey, u64),
    missing_numbers: std.AutoHashMap(u64, void),
    missing_hashes: std.AutoHashMap(Hash.Hash, void),
    next_request_id: u64,

    pub fn init(allocator: std.mem.Allocator, fork_block_number: u64) !ForkBlockCache {
        return .{
            .allocator = allocator,
            .fork_block_number = fork_block_number,
            .cache = std.AutoHashMap(Hash.Hash, Block.Block).init(allocator),
            .cache_by_number = std.AutoHashMap(u64, Hash.Hash).init(allocator),
            .cache_queue = .{},
            .pending_queue = .{},
            .pending_by_id = std.AutoHashMap(u64, PendingRequest).init(allocator),
            .pending_keys = std.AutoHashMap(PendingKey, u64).init(allocator),
            .missing_numbers = std.AutoHashMap(u64, void).init(allocator),
            .missing_hashes = std.AutoHashMap(Hash.Hash, void).init(allocator),
            .next_request_id = 1,
        };
    }

    pub fn deinit(self: *ForkBlockCache) void {
        var cache_it = self.cache.valueIterator();
        while (cache_it.next()) |block| {
            self.freeBlock(block);
        }
        self.cache.deinit();
        self.cache_by_number.deinit();
        self.cache_queue.deinit(self.allocator);

        var pending_it = self.pending_by_id.valueIterator();
        while (pending_it.next()) |req| {
            self.allocator.free(req.params_json);
        }
        self.pending_by_id.deinit();
        self.pending_queue.deinit(self.allocator);
        self.pending_keys.deinit();
        self.missing_numbers.deinit();
        self.missing_hashes.deinit();
    }

    /// Check if block number is within fork boundary
    pub fn isForkBlock(self: *ForkBlockCache, number: u64) bool {
        return number <= self.fork_block_number;
    }

    /// Get block by number (cache -> async RPC)
    pub fn getBlockByNumber(self: *ForkBlockCache, number: u64) !?Block.Block {
        if (!self.isForkBlock(number)) {
            return null; // Beyond fork
        }

        if (self.missing_numbers.contains(number)) {
            return null;
        }

        if (self.cache_by_number.get(number)) |hash| {
            if (self.cache.get(hash)) |block| {
                return block;
            }
            _ = self.cache_by_number.remove(number);
        }

        try self.queueRequest(.by_number, number, Hash.ZERO);
        return error.RpcPending;
    }

    /// Get block by hash (cache -> async RPC)
    pub fn getBlockByHash(self: *ForkBlockCache, hash: Hash.Hash) !?Block.Block {
        if (self.cache.get(hash)) |block| {
            return block;
        }

        if (self.missing_hashes.contains(hash)) {
            return null;
        }

        try self.queueRequest(.by_hash, 0, hash);
        return error.RpcPending;
    }

    /// Peek next pending request
    pub fn peekNextRequest(self: *ForkBlockCache) ?PendingRequest {
        if (self.pending_queue.items.len == 0) return null;
        const request_id = self.pending_queue.items[0];
        return self.pending_by_id.get(request_id);
    }

    /// Dequeue next pending request
    pub fn nextRequest(self: *ForkBlockCache) ?PendingRequest {
        if (self.pending_queue.items.len == 0) return null;
        const request_id = self.pending_queue.items[0];
        _ = self.pending_queue.orderedRemove(0);
        return self.pending_by_id.get(request_id);
    }

    /// Continue an async request with JSON response bytes.
    pub fn continueRequest(self: *ForkBlockCache, request_id: u64, response: []const u8) !void {
        const request = self.pending_by_id.get(request_id) orelse return error.InvalidRequest;
        defer {
            _ = self.pending_by_id.remove(request_id);
            _ = self.pending_keys.remove(PendingKey{
                .kind = request.kind,
                .number = request.number,
                .hash = request.hash,
            });
            self.allocator.free(request.params_json);
        }

        try self.handleBlockResponse(request, response);
    }

    fn queueRequest(self: *ForkBlockCache, kind: RequestKind, number: u64, hash: Hash.Hash) !void {
        const key = PendingKey{
            .kind = kind,
            .number = number,
            .hash = hash,
        };
        if (self.pending_keys.contains(key)) return;

        const params_json = try self.buildParamsJson(kind, number, hash);
        const request_id = self.next_request_id;
        self.next_request_id += 1;

        try self.pending_by_id.put(request_id, .{
            .id = request_id,
            .kind = kind,
            .number = number,
            .hash = hash,
            .params_json = params_json,
        });
        try self.pending_queue.append(self.allocator, request_id);
        try self.pending_keys.put(key, request_id);
    }

    fn buildParamsJson(self: *ForkBlockCache, kind: RequestKind, number: u64, hash: Hash.Hash) ![]u8 {
        switch (kind) {
            .by_number => {
                return std.fmt.allocPrint(self.allocator, "[\"0x{x}\",false]", .{number});
            },
            .by_hash => {
                const hash_hex = try Hash.toHex(&hash, self.allocator);
                defer self.allocator.free(hash_hex);
                return std.fmt.allocPrint(self.allocator, "[\"{s}\",false]", .{hash_hex});
            },
        }
    }

    fn handleBlockResponse(self: *ForkBlockCache, request: PendingRequest, response: []const u8) !void {
        const parsed = try json.parseFromSlice(json.Value, self.allocator, response, .{});
        defer parsed.deinit();

        if (parsed.value == .null) {
            try self.markMissing(request);
            return;
        }
        if (parsed.value != .object) return error.InvalidResponse;
        const obj = parsed.value.object;

        const hash_hex = getString(obj, "hash") orelse return error.InvalidResponse;
        const hash = parseHexFixed(32, hash_hex) catch return error.InvalidResponse;

        var header = BlockHeader.init();
        header.number = if (request.kind == .by_number) request.number else blk: {
            if (getString(obj, "number")) |num_str| {
                break :blk parseHexU64(num_str) catch 0;
            }
            break :blk 0;
        };

        if (getString(obj, "parentHash")) |parent_str| {
            header.parent_hash = parseHexFixed(32, parent_str) catch Hash.ZERO;
        }
        if (getString(obj, "sha3Uncles")) |ommers_str| {
            header.ommers_hash = parseHexFixed(32, ommers_str) catch Hash.ZERO;
        } else if (getString(obj, "ommersHash")) |ommers_alt| {
            header.ommers_hash = parseHexFixed(32, ommers_alt) catch Hash.ZERO;
        }
        if (getString(obj, "miner")) |beneficiary_str| {
            header.beneficiary = Address.fromHex(beneficiary_str) catch Address.ZERO_ADDRESS;
        } else if (getString(obj, "beneficiary")) |beneficiary_alt| {
            header.beneficiary = Address.fromHex(beneficiary_alt) catch Address.ZERO_ADDRESS;
        }
        if (getString(obj, "stateRoot")) |state_str| {
            header.state_root = parseHexFixed(32, state_str) catch Hash.ZERO;
        }
        if (getString(obj, "transactionsRoot")) |tx_root| {
            header.transactions_root = parseHexFixed(32, tx_root) catch Hash.ZERO;
        }
        if (getString(obj, "receiptsRoot")) |receipts_root| {
            header.receipts_root = parseHexFixed(32, receipts_root) catch Hash.ZERO;
        }
        if (getString(obj, "logsBloom")) |bloom_str| {
            header.logs_bloom = parseHexFixed(256, bloom_str) catch header.logs_bloom;
        }
        if (getString(obj, "difficulty")) |diff_str| {
            header.difficulty = parseHexU256(diff_str) catch 0;
        }
        if (getString(obj, "gasLimit")) |gas_limit| {
            header.gas_limit = parseHexU64(gas_limit) catch 0;
        }
        if (getString(obj, "gasUsed")) |gas_used| {
            header.gas_used = parseHexU64(gas_used) catch 0;
        }
        if (getString(obj, "timestamp")) |time_str| {
            header.timestamp = parseHexU64(time_str) catch 0;
        }
        if (getString(obj, "extraData")) |extra_str| {
            if (extra_str.len > 2) {
                header.extra_data = Hex.hexToBytes(self.allocator, extra_str) catch &[_]u8{};
            }
        }
        if (getString(obj, "mixHash")) |mix_str| {
            header.mix_hash = parseHexFixed(32, mix_str) catch Hash.ZERO;
        }
        if (getString(obj, "nonce")) |nonce_str| {
            if (parseHexU64(nonce_str)) |nonce| {
                std.mem.writeInt(u64, header.nonce[0..], nonce, .big);
            } else |_| {}
        }
        if (getString(obj, "baseFeePerGas")) |base_fee_str| {
            if (parseHexU256(base_fee_str)) |fee| {
                header.base_fee_per_gas = fee;
            } else |_| {}
        }
        if (getString(obj, "withdrawalsRoot")) |withdrawals_root| {
            if (parseHexFixed(32, withdrawals_root)) |root| {
                header.withdrawals_root = root;
            } else |_| {}
        }
        if (getString(obj, "blobGasUsed")) |blob_gas| {
            if (parseHexU64(blob_gas)) |value| {
                header.blob_gas_used = value;
            } else |_| {}
        }
        if (getString(obj, "excessBlobGas")) |excess_blob| {
            if (parseHexU64(excess_blob)) |value| {
                header.excess_blob_gas = value;
            } else |_| {}
        }
        if (getString(obj, "parentBeaconBlockRoot")) |parent_root| {
            if (parseHexFixed(32, parent_root)) |root| {
                header.parent_beacon_block_root = root;
            } else |_| {}
        }

        const size = if (getString(obj, "size")) |size_str| parseHexU64(size_str) catch 0 else 0;

        var total_difficulty: ?u256 = null;
        if (getString(obj, "totalDifficulty")) |td_str| {
            if (parseHexU256(td_str)) |value| {
                total_difficulty = value;
            } else |_| {}
        }

        if (!self.isForkBlock(header.number)) {
            try self.markMissing(request);
            return;
        }

        const body = BlockBody.init();
        const block = Block.Block{
            .header = header,
            .body = body,
            .hash = hash,
            .size = size,
            .total_difficulty = total_difficulty,
        };

        try self.putCache(block);
    }

    fn markMissing(self: *ForkBlockCache, request: PendingRequest) !void {
        switch (request.kind) {
            .by_number => try self.missing_numbers.put(request.number, {}),
            .by_hash => try self.missing_hashes.put(request.hash, {}),
        }
    }

    /// Put block in cache (with FIFO eviction)
    fn putCache(self: *ForkBlockCache, block: Block.Block) !void {
        const block_hash = block.hash;

        if (self.cache.contains(block_hash)) {
            return;
        }

        if (self.cache.count() >= MAX_CACHE_SIZE) {
            try self.evictOldest();
        }

        try self.cache.put(block_hash, block);
        try self.cache_queue.append(self.allocator, block_hash);
        try self.cache_by_number.put(block.header.number, block_hash);
    }

    /// Evict oldest block from cache (FIFO)
    fn evictOldest(self: *ForkBlockCache) !void {
        if (self.cache_queue.items.len == 0) return;

        const oldest_hash = self.cache_queue.orderedRemove(0);
        if (self.cache.fetchRemove(oldest_hash)) |entry| {
            self.freeBlock(&entry.value);
            _ = self.cache_by_number.remove(entry.value.header.number);
        }
    }

    fn freeBlock(self: *ForkBlockCache, block: *Block.Block) void {
        if (block.header.extra_data.len != 0) {
            self.allocator.free(block.header.extra_data);
            block.header.extra_data = &[_]u8{};
        }
    }

    /// Get cache size
    pub fn cacheSize(self: *ForkBlockCache) usize {
        return self.cache.count();
    }

    /// Check if block is cached
    pub fn isCached(self: *ForkBlockCache, hash: Hash.Hash) bool {
        return self.cache.contains(hash);
    }
};

fn getString(obj: json.ObjectMap, key: []const u8) ?[]const u8 {
    if (obj.get(key)) |value| {
        if (value == .string) return value.string;
    }
    return null;
}

fn parseHexU64(hex: []const u8) !u64 {
    if (hex.len == 0) return 0;
    const stripped = if (std.mem.startsWith(u8, hex, "0x")) hex[2..] else hex;
    if (stripped.len == 0) return 0;
    return std.fmt.parseInt(u64, stripped, 16);
}

fn parseHexU256(hex: []const u8) !u256 {
    if (hex.len == 0) return 0;
    const stripped = if (std.mem.startsWith(u8, hex, "0x")) hex[2..] else hex;
    if (stripped.len == 0) return 0;
    var result: u256 = 0;
    for (stripped) |c| {
        const digit: u256 = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return error.InvalidHex,
        };
        result = result * 16 + digit;
    }
    return result;
}

fn parseHexFixed(comptime N: usize, hex: []const u8) ![N]u8 {
    if (!std.mem.startsWith(u8, hex, "0x")) return error.InvalidHex;
    return Hex.hexToBytesFixed(N, hex);
}

// ============================================================================
// Tests
// ============================================================================

test "ForkBlockCache - init and deinit" {
    const allocator = std.testing.allocator;
    var cache = try ForkBlockCache.init(allocator, 1000);
    defer cache.deinit();

    try std.testing.expectEqual(@as(usize, 0), cache.cacheSize());
}

test "ForkBlockCache - isForkBlock boundary check" {
    const allocator = std.testing.allocator;
    var cache = try ForkBlockCache.init(allocator, 1000);
    defer cache.deinit();

    try std.testing.expect(cache.isForkBlock(500));
    try std.testing.expect(cache.isForkBlock(1000));
    try std.testing.expect(!cache.isForkBlock(1001));
}

test "ForkBlockCache - fetch by number queues request" {
    const allocator = std.testing.allocator;
    var cache = try ForkBlockCache.init(allocator, 1000);
    defer cache.deinit();

    try std.testing.expectError(error.RpcPending, cache.getBlockByNumber(5));
    const request = cache.peekNextRequest() orelse {
        try std.testing.expect(false);
        return;
    };
    try std.testing.expectEqual(@as(u64, 5), request.number);
}

test "ForkBlockCache - continue caches block" {
    const allocator = std.testing.allocator;
    var cache = try ForkBlockCache.init(allocator, 1000);
    defer cache.deinit();

    try std.testing.expectError(error.RpcPending, cache.getBlockByNumber(7));
    const request = cache.nextRequest() orelse {
        try std.testing.expect(false);
        return;
    };

    const hash_hex = "0x" ++ ("11" ** 32);
    const response = try std.fmt.allocPrint(allocator, "{{\"hash\":\"{s}\",\"number\":\"0x7\"}}", .{hash_hex});
    defer allocator.free(response);

    try cache.continueRequest(request.id, response);

    const block = try cache.getBlockByNumber(7);
    try std.testing.expect(block != null);
    try std.testing.expectEqual(@as(u64, 7), block.?.header.number);
}
