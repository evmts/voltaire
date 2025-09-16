//! Ethereum JSON-RPC client for fetching blockchain state
//! 
//! Provides methods to interact with Ethereum nodes via JSON-RPC 2.0 protocol.
//! Used by ForkedStorage to fetch state from remote blockchain.

const std = @import("std");
const primitives = @import("primitives");
const Account = @import("database_interface_account.zig").Account;

/// JSON-RPC request structure
pub const JsonRpcRequest = struct {
    jsonrpc: []const u8 = "2.0",
    method: []const u8,
    params: std.json.Value,
    id: u32,
};

/// JSON-RPC response structure
pub const JsonRpcResponse = struct {
    jsonrpc: []const u8,
    result: ?std.json.Value,
    @"error": ?JsonRpcError,
    id: u32,
};

pub const JsonRpcError = struct {
    code: i32,
    message: []const u8,
    data: ?std.json.Value,
};

/// Account proof from eth_getProof
pub const AccountProof = struct {
    address: [20]u8,
    balance: u256,
    nonce: u64,
    codeHash: [32]u8,
    storageHash: [32]u8,
    accountProof: [][]const u8,
    storageProof: []StorageProof,
};

pub const StorageProof = struct {
    key: u256,
    value: u256,
    proof: [][]const u8,
};

/// Ethereum RPC Client
pub const RpcClient = struct {
    allocator: std.mem.Allocator,
    endpoint: []const u8,
    fork_block: ?u64,
    http_client: std.http.Client,
    request_id: u32,
    
    const Self = @This();
    
    pub fn init(allocator: std.mem.Allocator, endpoint: []const u8, fork_block: ?u64) !Self {
        return .{
            .allocator = allocator,
            .endpoint = try allocator.dupe(u8, endpoint),
            .fork_block = fork_block,
            .http_client = std.http.Client{ .allocator = allocator },
            .request_id = 1,
        };
    }
    
    pub fn deinit(self: *Self) void {
        self.allocator.free(self.endpoint);
        self.http_client.deinit();
    }
    
    /// Get block tag for RPC calls (either block number or "latest")
    fn getBlockTag(self: *Self) []const u8 {
        if (self.fork_block) |block| {
            var buf: [32]u8 = undefined;
            const hex = std.fmt.bufPrint(&buf, "0x{x}", .{block}) catch return "latest";
            return self.allocator.dupe(u8, hex) catch return "latest";
        }
        return "latest";
    }
    
    /// Send JSON-RPC request
    fn sendRequest(self: *Self, method: []const u8, params: anytype) !std.json.Value {
        self.request_id += 1;
        
        // Build JSON-RPC request
        var json_buf = std.ArrayList(u8).init(self.allocator);
        defer json_buf.deinit();
        
        var writer = json_buf.writer();
        try std.json.stringify(.{
            .jsonrpc = "2.0",
            .method = method,
            .params = params,
            .id = self.request_id,
        }, .{}, writer);
        
        // Send HTTP POST request
        const uri = try std.Uri.parse(self.endpoint);
        
        var server_header_buffer: [8192]u8 = undefined;
        var req = try self.http_client.open(.POST, uri, .{
            .server_header_buffer = &server_header_buffer,
        });
        defer req.deinit();
        
        req.transfer_encoding = .{ .content_length = json_buf.items.len };
        try req.send();
        try req.writeAll(json_buf.items);
        try req.finish();
        try req.wait();
        
        // Read response
        const body = try req.reader().readAllAlloc(self.allocator, 1024 * 1024); // 1MB max
        defer self.allocator.free(body);
        
        // Parse JSON response
        const parsed = try std.json.parseFromSlice(JsonRpcResponse, self.allocator, body, .{});
        defer parsed.deinit();
        
        if (parsed.value.@"error") |err| {
            std.log.err("RPC error: {s}", .{err.message});
            return error.RpcError;
        }
        
        if (parsed.value.result) |result| {
            // Clone the result to return it
            return try std.json.parseFromValue(std.json.Value, self.allocator, result, .{});
        }
        
        return error.NoResult;
    }
    
    /// eth_getBalance - Get account balance
    pub fn getBalance(self: *Self, address: [20]u8) !u256 {
        const addr_hex = try std.fmt.allocPrint(self.allocator, "0x{}", .{std.fmt.fmtSliceHexLower(&address)});
        defer self.allocator.free(addr_hex);
        
        const block_tag = self.getBlockTag();
        defer if (self.fork_block != null) self.allocator.free(block_tag);
        
        const result = try self.sendRequest("eth_getBalance", .{ addr_hex, block_tag });
        defer result.deinit();
        
        if (result.value.string) |hex| {
            return try parseHexU256(hex);
        }
        return 0;
    }
    
    /// eth_getTransactionCount - Get account nonce
    pub fn getNonce(self: *Self, address: [20]u8) !u64 {
        const addr_hex = try std.fmt.allocPrint(self.allocator, "0x{}", .{std.fmt.fmtSliceHexLower(&address)});
        defer self.allocator.free(addr_hex);
        
        const block_tag = self.getBlockTag();
        defer if (self.fork_block != null) self.allocator.free(block_tag);
        
        const result = try self.sendRequest("eth_getTransactionCount", .{ addr_hex, block_tag });
        defer result.deinit();
        
        if (result.value.string) |hex| {
            return try parseHexU64(hex);
        }
        return 0;
    }
    
    /// eth_getCode - Get contract code
    pub fn getCode(self: *Self, address: [20]u8) ![]const u8 {
        const addr_hex = try std.fmt.allocPrint(self.allocator, "0x{}", .{std.fmt.fmtSliceHexLower(&address)});
        defer self.allocator.free(addr_hex);
        
        const block_tag = self.getBlockTag();
        defer if (self.fork_block != null) self.allocator.free(block_tag);
        
        const result = try self.sendRequest("eth_getCode", .{ addr_hex, block_tag });
        defer result.deinit();
        
        if (result.value.string) |hex| {
            if (std.mem.startsWith(u8, hex, "0x")) {
                const bytes = try self.allocator.alloc(u8, (hex.len - 2) / 2);
                _ = try std.fmt.hexToBytes(bytes, hex[2..]);
                return bytes;
            }
        }
        return &.{};
    }
    
    /// eth_getStorageAt - Get storage value at specific slot
    pub fn getStorageAt(self: *Self, address: [20]u8, slot: u256) !u256 {
        const addr_hex = try std.fmt.allocPrint(self.allocator, "0x{}", .{std.fmt.fmtSliceHexLower(&address)});
        defer self.allocator.free(addr_hex);
        
        var slot_hex_buf: [66]u8 = undefined;
        const slot_hex = try std.fmt.bufPrint(&slot_hex_buf, "0x{x:0>64}", .{slot});
        
        const block_tag = self.getBlockTag();
        defer if (self.fork_block != null) self.allocator.free(block_tag);
        
        const result = try self.sendRequest("eth_getStorageAt", .{ addr_hex, slot_hex, block_tag });
        defer result.deinit();
        
        if (result.value.string) |hex| {
            return try parseHexU256(hex);
        }
        return 0;
    }
    
    /// eth_getProof - Get account proof with storage proofs
    pub fn getProof(self: *Self, address: [20]u8, storage_keys: []const u256) !AccountProof {
        const addr_hex = try std.fmt.allocPrint(self.allocator, "0x{}", .{std.fmt.fmtSliceHexLower(&address)});
        defer self.allocator.free(addr_hex);
        
        // Convert storage keys to hex strings
        var keys_hex = try self.allocator.alloc([]const u8, storage_keys.len);
        defer {
            for (keys_hex) |key| self.allocator.free(key);
            self.allocator.free(keys_hex);
        }
        
        for (storage_keys, 0..) |key, i| {
            keys_hex[i] = try std.fmt.allocPrint(self.allocator, "0x{x:0>64}", .{key});
        }
        
        const block_tag = self.getBlockTag();
        defer if (self.fork_block != null) self.allocator.free(block_tag);
        
        const result = try self.sendRequest("eth_getProof", .{ addr_hex, keys_hex, block_tag });
        defer result.deinit();
        
        // Parse the proof response
        const obj = result.value.object;
        
        var proof: AccountProof = undefined;
        proof.address = address;
        
        if (obj.get("balance")) |bal| {
            if (bal.string) |hex| {
                proof.balance = try parseHexU256(hex);
            }
        }
        
        if (obj.get("nonce")) |n| {
            if (n.string) |hex| {
                proof.nonce = try parseHexU64(hex);
            }
        }
        
        if (obj.get("codeHash")) |ch| {
            if (ch.string) |hex| {
                _ = try std.fmt.hexToBytes(&proof.codeHash, hex[2..]);
            }
        }
        
        if (obj.get("storageHash")) |sh| {
            if (sh.string) |hex| {
                _ = try std.fmt.hexToBytes(&proof.storageHash, hex[2..]);
            }
        }
        
        // TODO: Parse account proof and storage proofs arrays
        proof.accountProof = &.{};
        proof.storageProof = &.{};
        
        return proof;
    }
    
    // Helper functions
    fn parseHexU256(hex: []const u8) !u256 {
        if (hex.len < 2 or !std.mem.startsWith(u8, hex, "0x")) return 0;
        
        const clean_hex = hex[2..];
        if (clean_hex.len == 0) return 0;
        
        var result: u256 = 0;
        for (clean_hex) |c| {
            const digit = switch (c) {
                '0'...'9' => c - '0',
                'a'...'f' => c - 'a' + 10,
                'A'...'F' => c - 'A' + 10,
                else => return error.InvalidHex,
            };
            result = result * 16 + digit;
        }
        return result;
    }
    
    fn parseHexU64(hex: []const u8) !u64 {
        const val = try parseHexU256(hex);
        return @intCast(val & 0xFFFFFFFFFFFFFFFF);
    }
};

// Test with a public endpoint
test "RPC client with public endpoint" {
    const allocator = std.testing.allocator;
    
    // Using a public Ethereum RPC endpoint (Ankr's public endpoint)
    // You can also use: https://eth.llamarpc.com, https://rpc.ankr.com/eth, etc.
    var client = try RpcClient.init(allocator, "https://rpc.ankr.com/eth", null);
    defer client.deinit();
    
    // Test getting Vitalik's address balance (well-known address)
    const vitalik_address = [_]u8{0xd8, 0xdA, 0x6B, 0xF2, 0x69, 0x64, 0xaF, 0x9D, 0x7e, 0xeD, 
                                    0x9e, 0x03, 0xE5, 0x3A, 0x15, 0xD9, 0xB6, 0x67, 0x4D, 0x43};
    
    // These calls would actually hit the network - comment out for normal testing
    // const balance = try client.getBalance(vitalik_address);
    // std.debug.print("Vitalik balance: {d} wei\n", .{balance});
    
    // const nonce = try client.getNonce(vitalik_address);
    // std.debug.print("Vitalik nonce: {d}\n", .{nonce});
    
    _ = vitalik_address;
}