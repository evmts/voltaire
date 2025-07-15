const std = @import("std");
const print = std.debug.print;

// Import the client
const Client = @import("../src/client/mod.zig").Client;
const ClientConfig = @import("../src/client/mod.zig").ClientConfig;
const TransportConfig = @import("../src/client/mod.zig").TransportConfig;

// Import comprehensive JSON-RPC types
const JsonRpcMethod = @import("../src/client/jsonrpc/types.zig").JsonRpcMethod;
const JsonRpcRequest = @import("../src/client/jsonrpc/types.zig").JsonRpcRequest;
const JsonRpcResponse = @import("../src/client/jsonrpc/types.zig").JsonRpcResponse;
const JsonValue = @import("../src/client/jsonrpc/types.zig").JsonValue;
const BlockNumber = @import("../src/client/jsonrpc/types.zig").BlockNumber;
const BlockTag = @import("../src/client/jsonrpc/types.zig").BlockTag;
const Address = @import("../src/client/jsonrpc/types.zig").Address;
const Hash = @import("../src/client/jsonrpc/types.zig").Hash;
const TransactionObject = @import("../src/client/jsonrpc/types.zig").TransactionObject;

// Import method helpers
const jsonrpc = @import("../src/client/jsonrpc/methods.zig").jsonrpc;
const createRequest = @import("../src/client/jsonrpc/methods.zig").createRequest;
const buildGetBalanceRequest = @import("../src/client/jsonrpc/methods.zig").buildGetBalanceRequest;

// =============================================================================
// Comprehensive JSON-RPC Union Types Example
// =============================================================================

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    print("=== Guillotine Ethereum Client - JSON-RPC Union Types Example ===\n\n", .{});

    // 1. Initialize client
    const transport_config = TransportConfig.http_config("https://mainnet.infura.io/v3/YOUR_PROJECT_ID");
    const config = ClientConfig.init(transport_config).withChainId(1);
    var client = Client.init(allocator, config) catch |err| {
        print("Failed to initialize client: {}\n", .{err});
        return;
    };
    defer client.deinit();

    // =============================================================================
    // Method 1: Using the comprehensive JsonRpcMethod enum
    // =============================================================================
    print("1. Using JsonRpcMethod enum (viem-like approach):\n", .{});

    // Show all available methods
    print("   Available methods include:\n", .{});
    print("   - ETH: {s}\n", .{JsonRpcMethod.eth_chainId.getMethodName()});
    print("   - ETH: {s}\n", .{JsonRpcMethod.eth_getBalance.getMethodName()});
    print("   - ETH: {s}\n", .{JsonRpcMethod.eth_sendTransaction.getMethodName()});
    print("   - NET: {s}\n", .{JsonRpcMethod.net_version.getMethodName()});
    print("   - WEB3: {s}\n", .{JsonRpcMethod.web3_clientVersion.getMethodName()});
    print("   - DEBUG: {s}\n", .{JsonRpcMethod.debug_traceTransaction.getMethodName()});
    print("   - ADMIN: {s}\n", .{JsonRpcMethod.admin_nodeInfo.getMethodName()});
    print("   - TXPOOL: {s}\n", .{JsonRpcMethod.txpool_status.getMethodName()});
    print("   - PERSONAL: {s}\n", .{JsonRpcMethod.personal_listAccounts.getMethodName()});
    print("   ... and many more!\n\n", .{});

    // =============================================================================
    // Method 2: Using helper functions (similar to viem)
    // =============================================================================
    print("2. Using helper functions (viem-style):\n", .{});

    // Example 1: Get chain ID
    print("   Getting chain ID...\n", .{});
    const chain_id_req = jsonrpc.chainId.request();
    print("   Request: {s} (ID: {})\n", .{ chain_id_req.method, chain_id_req.id });

    // Example 2: Get current block number
    print("   Getting current block number...\n", .{});
    const block_num_req = jsonrpc.blockNumber.request();
    print("   Request: {s} (ID: {})\n", .{ block_num_req.method, block_num_req.id });

    // Example 3: Get gas price
    print("   Getting current gas price...\n", .{});
    const gas_price_req = jsonrpc.gasPrice.request();
    print("   Request: {s} (ID: {})\n", .{ gas_price_req.method, gas_price_req.id });

    // =============================================================================
    // Method 3: Creating complex requests with type safety
    // =============================================================================
    print("\n3. Creating complex requests with type safety:\n", .{});

    // Example 1: Get balance with proper types
    const address: Address = "0x742d35Cc6634C0532925a3b844Bc9e7595f8fA82";
    const block = BlockNumber{ .tag = .latest };
    const balance_req = jsonrpc.getBalance.request(address, block);
    print("   Get balance request: {s} for {s} at {s}\n", .{ balance_req.method, address, BlockTag.latest.toString() });

    // Example 2: Contract call with transaction object
    const transaction = TransactionObject{
        .from = "0x742d35Cc6634C0532925a3b844Bc9e7595f8fA82",
        .to = "0xA0b86a33E6f8A7C7E2a7A67C8D4A8A8A8A8A8A8A",
        .data = "0x70a08231000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f8fa82",
    };
    const call_req = jsonrpc.call.request(transaction, block);
    print("   Contract call request: {s} (ID: {})\n", .{ call_req.method, call_req.id });

    // =============================================================================
    // Method 4: Using the generic createRequest function
    // =============================================================================
    print("\n4. Using the generic createRequest function:\n", .{});

    const generic_req = createRequest(JsonRpcMethod.eth_accounts, JsonValue{ .null = {} });
    print("   Generic request: {s} (ID: {})\n", .{ generic_req.method, generic_req.id });

    // =============================================================================
    // Method 5: Advanced type-safe builders
    // =============================================================================
    print("\n5. Advanced type-safe builders:\n", .{});

    // Build a properly formatted eth_getBalance request
    const typed_balance_req = buildGetBalanceRequest("0x742d35Cc6634C0532925a3b844Bc9e7595f8fA82", BlockNumber{ .number = 18500000 }, allocator) catch |err| {
        print("   Error building balance request: {}\n", .{err});
        return;
    };
    print("   Type-safe balance request: {s} (ID: {})\n", .{ typed_balance_req.method, typed_balance_req.id });

    // =============================================================================
    // Method 6: Response handling with type safety
    // =============================================================================
    print("\n6. Response handling with type safety:\n", .{});

    // Example successful response
    const success_response = JsonRpcResponse{
        .result = JsonValue.fromString("0x1"),
        .err = null,
        .id = 1,
    };

    const parsed_chain_id = jsonrpc.chainId.response(success_response) catch |err| {
        print("   Error parsing chain ID: {}\n", .{err});
        return;
    };
    print("   Parsed chain ID: {}\n", .{parsed_chain_id});

    // Example error response
    const error_response = JsonRpcResponse{
        .result = null,
        .err = JsonRpcError.init(-32000, "execution reverted"),
        .id = 2,
    };

    const error_result = jsonrpc.chainId.response(error_response);
    print("   Error response handling: {}\n", .{error_result});

    // =============================================================================
    // Method 7: Working with different method categories
    // =============================================================================
    print("\n7. Working with different method categories:\n", .{});

    // ETH methods
    const eth_methods = [_]JsonRpcMethod{
        .eth_chainId,
        .eth_getBalance,
        .eth_sendTransaction,
        .eth_call,
        .eth_estimateGas,
    };

    print("   ETH methods:\n", .{});
    for (eth_methods) |method| {
        print("     - {s}\n", .{method.getMethodName()});
    }

    // NET methods
    const net_methods = [_]JsonRpcMethod{
        .net_listening,
        .net_peerCount,
        .net_version,
    };

    print("   NET methods:\n", .{});
    for (net_methods) |method| {
        print("     - {s}\n", .{method.getMethodName()});
    }

    // WEB3 methods
    const web3_methods = [_]JsonRpcMethod{
        .web3_clientVersion,
        .web3_sha3,
    };

    print("   WEB3 methods:\n", .{});
    for (web3_methods) |method| {
        print("     - {s}\n", .{method.getMethodName()});
    }

    // =============================================================================
    // Method 8: Simulating actual client usage
    // =============================================================================
    print("\n8. Simulating actual client usage:\n", .{});

    // Create a mock response for demonstration
    const mock_response = JsonRpcResponse{
        .result = JsonValue.fromString("0x4d2"),
        .err = null,
        .id = 123,
    };

    // Simulate making a request and getting a response
    const req = jsonrpc.blockNumber.request();
    print("   Making request: {s} (ID: {})\n", .{ req.method, req.id });

    // In a real client, you would do: const response = try client.request(req);
    // For this example, we'll use our mock response
    const block_number = jsonrpc.blockNumber.response(mock_response) catch |err| {
        print("   Error parsing response: {}\n", .{err});
        return;
    };
    print("   Response: Block number is {s}\n", .{block_number});

    // =============================================================================
    // Method 9: Error handling patterns
    // =============================================================================
    print("\n9. Error handling patterns:\n", .{});

    // Different types of errors
    const errors = [_]JsonRpcError{
        JsonRpcError.init(JsonRpcError.EXECUTION_REVERTED, "execution reverted"),
        JsonRpcError.init(JsonRpcError.INSUFFICIENT_FUNDS, "insufficient funds"),
        JsonRpcError.init(JsonRpcError.NONCE_TOO_HIGH, "nonce too high"),
        JsonRpcError.init(JsonRpcError.TRANSACTION_UNDERPRICED, "transaction underpriced"),
        JsonRpcError.init(JsonRpcError.UNAUTHORIZED, "unauthorized"),
    };

    print("   Common Ethereum errors:\n", .{});
    for (errors) |err| {
        print("     - Code {}: {s}\n", .{ err.code, err.message });
    }

    // =============================================================================
    // Method 10: Advanced features demonstration
    // =============================================================================
    print("\n10. Advanced features:\n", .{});

    // Block number variations
    const block_variations = [_]BlockNumber{
        BlockNumber{ .tag = .latest },
        BlockNumber{ .tag = .earliest },
        BlockNumber{ .tag = .pending },
        BlockNumber{ .tag = .finalized },
        BlockNumber{ .tag = .safe },
        BlockNumber{ .number = 18500000 },
    };

    print("   Block number variations:\n", .{});
    for (block_variations) |block_var| {
        const json_val = block_var.toJsonValue();
        const str_val = json_val.toString() catch "invalid";
        print("     - {s}\n", .{str_val});
    }

    print("\n=== Example completed successfully! ===\n", .{});
    print("This demonstrates the comprehensive JSON-RPC union types system,\n", .{});
    print("similar to viem's approach but implemented in Zig.\n", .{});
}

// =============================================================================
// Helper Functions for Examples
// =============================================================================

/// Demonstrate how to handle different response types
fn handleResponse(comptime T: type, response: JsonRpcResponse) !T {
    if (response.isError()) {
        if (response.err) |err| {
            std.debug.print("JSON-RPC Error {}: {s}\n", .{ err.code, err.message });
        }
        return error.JsonRpcError;
    }

    const result = response.result orelse return error.NoResult;
    return result.getResult(T);
}

/// Demonstrate creating requests for different method types
fn createMethodRequest(method: JsonRpcMethod, params: JsonValue) JsonRpcRequest {
    return JsonRpcRequest{
        .method = method.getMethodName(),
        .params = params,
        .id = std.time.nanoTimestamp(),
    };
}

/// Show how to work with the comprehensive type system
fn demonstrateTypeSystem() void {
    print("\n=== Type System Demonstration ===\n", .{});

    // All available method categories
    const method_categories = [_]struct { name: []const u8, methods: []const JsonRpcMethod }{
        .{ .name = "ETH", .methods = &[_]JsonRpcMethod{ .eth_accounts, .eth_blockNumber, .eth_call, .eth_chainId, .eth_coinbase, .eth_estimateGas, .eth_gasPrice, .eth_getBalance, .eth_getCode, .eth_sendTransaction, .eth_sign, .eth_syncing } },
        .{ .name = "NET", .methods = &[_]JsonRpcMethod{ .net_listening, .net_peerCount, .net_version } },
        .{ .name = "WEB3", .methods = &[_]JsonRpcMethod{ .web3_clientVersion, .web3_sha3 } },
        .{ .name = "DEBUG", .methods = &[_]JsonRpcMethod{ .debug_traceTransaction, .debug_traceCall } },
        .{ .name = "ADMIN", .methods = &[_]JsonRpcMethod{ .admin_nodeInfo, .admin_peers } },
        .{ .name = "TXPOOL", .methods = &[_]JsonRpcMethod{ .txpool_status, .txpool_inspect } },
        .{ .name = "PERSONAL", .methods = &[_]JsonRpcMethod{ .personal_listAccounts, .personal_newAccount } },
    };

    for (method_categories) |category| {
        print("   {s} methods:\n", .{category.name});
        for (category.methods) |method| {
            print("     - {s}\n", .{method.getMethodName()});
        }
    }
}

/// Example of using the type system for method validation
fn validateMethod(method_name: []const u8) bool {
    const all_methods = [_]JsonRpcMethod{
        .eth_accounts,    .eth_blockNumber, .eth_call,           .eth_chainId, .eth_coinbase,
        .eth_estimateGas, .eth_gasPrice,    .eth_getBalance,     .eth_getCode, .net_listening,
        .net_peerCount,   .net_version,     .web3_clientVersion,
        .web3_sha3,
        // ... add more as needed
    };

    for (all_methods) |method| {
        if (std.mem.eql(u8, method_name, method.getMethodName())) {
            return true;
        }
    }
    return false;
}

// =============================================================================
// JsonRpcError alias for cleaner imports
// =============================================================================
const JsonRpcError = @import("../src/client/jsonrpc/types.zig").JsonRpcError;
