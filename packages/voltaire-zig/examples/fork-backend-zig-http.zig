//! Zig HTTP Example for ForkBackend RPC Client
//!
//! Demonstrates using std.http.Client for JSON-RPC transport.
//! Based on Zig 0.15.1 std.http.Client API.
//!
//! Usage:
//!   zig build-exe examples/fork-backend-zig-http.zig
//!   ./fork-backend-zig-http https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
//!
//! Reference: https://gist.github.com/Zorgatone/968ce86711aecea984a2c4a9771eed5f

const std = @import("std");
const primitives = @import("primitives");
const state_manager = @import("state-manager");
const Address = primitives.Address;
const Hash = primitives.Hash;

/// HTTP JSON-RPC client using std.http.Client
pub const HttpRpcClient = struct {
    allocator: std.mem.Allocator,
    http_client: std.http.Client,
    url: []const u8,

    pub fn init(allocator: std.mem.Allocator, url: []const u8) !HttpRpcClient {
        return .{
            .allocator = allocator,
            .http_client = .{ .allocator = allocator },
            .url = try allocator.dupe(u8, url),
        };
    }

    pub fn deinit(self: *HttpRpcClient) void {
        self.allocator.free(self.url);
        self.http_client.deinit();
    }

    /// Fetch eth_getProof (account + storage)
    pub fn getProof(
        self: *HttpRpcClient,
        address: Address.Address,
        slots: []const u256,
        block_tag: []const u8,
    ) !state_manager.RpcClient.EthProof {
        // Format address as hex string
        const addr_hex = try std.fmt.allocPrint(
            self.allocator,
            "0x{x}",
            .{std.fmt.fmtSliceHexLower(&address.bytes)},
        );
        defer self.allocator.free(addr_hex);

        // Format slots as hex array
        var slots_json = std.ArrayList(u8){};
        defer slots_json.deinit(self.allocator);
        try slots_json.append(self.allocator, '[');
        for (slots, 0..) |slot, i| {
            if (i > 0) try slots_json.appendSlice(self.allocator, ",");
            try std.fmt.format(slots_json.writer(self.allocator), "\"0x{x}\"", .{slot});
        }
        try slots_json.append(self.allocator, ']');

        // Build JSON-RPC request body
        const body = try std.fmt.allocPrint(
            self.allocator,
            \\{{"jsonrpc":"2.0","method":"eth_getProof","params":["{s}",{s},"{s}"],"id":1}}
        ,
            .{ addr_hex, slots_json.items, block_tag },
        );
        defer self.allocator.free(body);

        // Make HTTP request
        const response_body = try self.post(body);
        defer self.allocator.free(response_body);

        // Parse JSON response
        return try self.parseProofResponse(response_body);
    }

    /// Fetch eth_getCode
    pub fn getCode(
        self: *HttpRpcClient,
        address: Address.Address,
        block_tag: []const u8,
    ) ![]const u8 {
        // Format address
        const addr_hex = try std.fmt.allocPrint(
            self.allocator,
            "0x{x}",
            .{std.fmt.fmtSliceHexLower(&address.bytes)},
        );
        defer self.allocator.free(addr_hex);

        // Build request
        const body = try std.fmt.allocPrint(
            self.allocator,
            \\{{"jsonrpc":"2.0","method":"eth_getCode","params":["{s}","{s}"],"id":1}}
        ,
            .{ addr_hex, block_tag },
        );
        defer self.allocator.free(body);

        // Make request
        const response_body = try self.post(body);
        defer self.allocator.free(response_body);

        // Parse response
        return try self.parseCodeResponse(response_body);
    }

    /// HTTP POST helper using std.http.Client (Zig 0.15.1)
    fn post(self: *HttpRpcClient, body: []const u8) ![]const u8 {
        const uri = try std.Uri.parse(self.url);

        // Create request
        var request = try self.http_client.request(.POST, uri, .{
            .headers = .{ .content_type = "application/json" },
        });
        defer request.deinit();

        // Send body
        try request.send(body);

        // Finish and get response
        const response = try request.finish();

        // Read response body
        var response_buffer = std.ArrayList(u8){};
        defer response_buffer.deinit(self.allocator);

        var reader_buffer: [8192]u8 = undefined;
        while (true) {
            const bytes_read = try response.read(&reader_buffer);
            if (bytes_read == 0) break;
            try response_buffer.appendSlice(self.allocator, reader_buffer[0..bytes_read]);
        }

        return try self.allocator.dupe(u8, response_buffer.items);
    }

    /// Parse eth_getProof JSON response
    fn parseProofResponse(self: *HttpRpcClient, json: []const u8) !state_manager.RpcClient.EthProof {
        // Simplified JSON parsing - real implementation would use json.parse()
        // For demo, return mock data
        _ = json;

        return state_manager.RpcClient.EthProof{
            .nonce = 5,
            .balance = 1000000000000000000, // 1 ETH
            .code_hash = Hash.ZERO,
            .storage_root = Hash.ZERO,
            .storage_proof = &[_]state_manager.RpcClient.EthProof.StorageProof{},
        };
    }

    /// Parse eth_getCode JSON response
    fn parseCodeResponse(self: *HttpRpcClient, json: []const u8) ![]const u8 {
        // Simplified - real implementation would parse JSON result field
        _ = json;

        // Return mock bytecode
        const code = [_]u8{ 0x60, 0x60, 0x60, 0x40 };
        return try self.allocator.dupe(u8, &code);
    }
};

/// Create RpcClient vtable from HttpRpcClient
pub fn createRpcVTable(http_client: *HttpRpcClient) state_manager.RpcClient {
    return .{
        .ptr = http_client,
        .vtable = &.{
            .getProof = httpGetProof,
            .getCode = httpGetCode,
        },
    };
}

fn httpGetProof(
    ptr: *anyopaque,
    address: Address.Address,
    slots: []const u256,
    block_tag: []const u8,
) anyerror!state_manager.RpcClient.EthProof {
    const client: *HttpRpcClient = @ptrCast(@alignCast(ptr));
    return client.getProof(address, slots, block_tag);
}

fn httpGetCode(
    ptr: *anyopaque,
    address: Address.Address,
    block_tag: []const u8,
) anyerror![]const u8 {
    const client: *HttpRpcClient = @ptrCast(@alignCast(ptr));
    return client.getCode(address, block_tag);
}

/// Demo: Use HttpRpcClient with ForkBackend
pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Get RPC URL from args
    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    if (args.len < 2) {
        std.debug.print("Usage: {s} <RPC_URL>\n", .{args[0]});
        std.debug.print("Example: {s} https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY\n", .{args[0]});
        return;
    }

    const rpc_url = args[1];

    std.debug.print("Zig HTTP RPC Client Demo\n", .{});
    std.debug.print("RPC URL: {s}\n\n", .{rpc_url});

    // Create HTTP client
    var http_client = try HttpRpcClient.init(allocator, rpc_url);
    defer http_client.deinit();

    // Create RPC vtable
    const rpc_vtable = createRpcVTable(&http_client);

    // Create ForkBackend with HTTP client
    var fork_backend = try state_manager.ForkBackend.init(
        allocator,
        rpc_vtable,
        "latest",
        .{ .max_size = 1000, .eviction_policy = .lru },
    );
    defer fork_backend.deinit();

    // Test address (Vitalik's address)
    const test_addr = Address.Address{
        .bytes = [_]u8{ 0xd8, 0xdA, 0x6B, 0xF2, 0x69, 0x64, 0xaF, 0x9D, 0x7e, 0xEd, 0x9e, 0x03, 0xE5, 0x34, 0x15, 0xD3, 0x7a, 0xA9, 0x60, 0x45 },
    };

    std.debug.print("Fetching account for address: 0x{x}\n", .{std.fmt.fmtSliceHexLower(&test_addr.bytes)});

    // Fetch account
    const account = fork_backend.fetchAccount(test_addr) catch |err| {
        std.debug.print("Error fetching account: {}\n", .{err});
        return;
    };

    std.debug.print("Account fetched successfully!\n", .{});
    std.debug.print("  Nonce: {}\n", .{account.nonce});
    std.debug.print("  Balance: {} wei\n", .{account.balance});
    std.debug.print("  Code Hash: 0x{x}\n", .{std.fmt.fmtSliceHexLower(&account.code_hash)});

    // Fetch code
    std.debug.print("\nFetching code...\n", .{});
    const code = fork_backend.fetchCode(test_addr) catch |err| {
        std.debug.print("Error fetching code: {}\n", .{err});
        return;
    };

    std.debug.print("Code fetched: {} bytes\n", .{code.len});
    if (code.len > 0) {
        std.debug.print("  First 20 bytes: 0x{x}\n", .{std.fmt.fmtSliceHexLower(code[0..@min(20, code.len)])});
    }

    std.debug.print("\n✅ Demo complete!\n", .{});
}

// Tests
test "HttpRpcClient - init and deinit" {
    const allocator = std.testing.allocator;
    var client = try HttpRpcClient.init(allocator, "http://localhost:8545");
    defer client.deinit();

    try std.testing.expectEqualStrings("http://localhost:8545", client.url);
}

test "createRpcVTable - creates valid vtable" {
    const allocator = std.testing.allocator;
    var client = try HttpRpcClient.init(allocator, "http://localhost:8545");
    defer client.deinit();

    const vtable = createRpcVTable(&client);
    try std.testing.expect(vtable.ptr != null);
    try std.testing.expect(vtable.vtable != null);
}
