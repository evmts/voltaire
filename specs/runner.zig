const std = @import("std");
const testing = std.testing;
const evm = @import("evm");
const primitives = @import("primitives");
const Address = primitives.Address;

// New function to run tests directly from JSON
pub fn runJsonTest(allocator: std.mem.Allocator, test_case: std.json.Value) !void {
    // Skip tests with assembly code in pre-state
    if (test_case.object.get("pre")) |pre| {
        if (pre == .object) {
            var it = pre.object.iterator();
            while (it.next()) |kv| {
                if (kv.value_ptr.*.object.get("code")) |code| {
                    if (code == .string) {
                        if (isAssemblyCode(code.string)) {
                            // Skip assembly tests for now
                            return;
                        }
                    }
                }
            }
        }
    }
    
    // Setup database
    var database = evm.Database.init(allocator);
    defer database.deinit();
    
    // Parse environment
    const env = test_case.object.get("env");
    const block_info = evm.BlockInfo{
        .number = if (env != null and env.?.object.get("currentNumber") != null)
            try parseIntFromJson(env.?.object.get("currentNumber").?)
        else 1,
        
        .timestamp = if (env != null and env.?.object.get("currentTimestamp") != null)
            try parseIntFromJson(env.?.object.get("currentTimestamp").?)
        else 1000,
        
        .gas_limit = if (env != null and env.?.object.get("currentGasLimit") != null)
            try parseIntFromJson(env.?.object.get("currentGasLimit").?)
        else 10000000,
        
        .coinbase = if (env != null and env.?.object.get("currentCoinbase") != null)
            try parseAddress(env.?.object.get("currentCoinbase").?.string)
        else Address.zero(),
        
        .difficulty = if (env != null and env.?.object.get("currentDifficulty") != null)
            try std.fmt.parseInt(u256, env.?.object.get("currentDifficulty").?.string, 0)
        else 0,
        
        .base_fee = if (env != null and env.?.object.get("currentBaseFee") != null)
            try std.fmt.parseInt(u256, env.?.object.get("currentBaseFee").?.string, 0)
        else 10,
        
        .prev_randao = [_]u8{0} ** 32,
    };
    
    // Setup pre-state
    if (test_case.object.get("pre")) |pre| {
        if (pre == .object) {
            var it = pre.object.iterator();
            while (it.next()) |kv| {
                const address = try parseAddress(kv.key_ptr.*);
                const account = kv.value_ptr.*;
                
                // Get or create account
                var acc = (try database.get_account(address.bytes)) orelse evm.Account.zero();
                
                // Set balance
                if (account.object.get("balance")) |balance| {
                    acc.balance = try std.fmt.parseInt(u256, balance.string, 0);
                }
                
                // Set nonce
                if (account.object.get("nonce")) |nonce| {
                    acc.nonce = try parseIntFromJson(nonce);
                }
                
                // Set code
                if (account.object.get("code")) |code| {
                    if (code == .string) {
                        const code_str = code.string;
                        if (!std.mem.eql(u8, code_str, "") and !std.mem.eql(u8, code_str, "0x") and !isAssemblyCode(code_str)) {
                            const hex_data = try parseHexData(allocator, code_str);
                            defer allocator.free(hex_data);
                            
                            if (hex_data.len > 2) { // More than just "0x"
                                const code_bytes = try primitives.Hex.hex_to_bytes(allocator, hex_data);
                                defer allocator.free(code_bytes);
                                const code_hash = try database.set_code(code_bytes);
                                acc.code_hash = code_hash;
                            }
                        }
                    }
                }
                
                // Save the account
                try database.set_account(address.bytes, acc);
                
                // Set storage
                if (account.object.get("storage")) |storage| {
                    if (storage == .object) {
                        var storage_it = storage.object.iterator();
                        while (storage_it.next()) |storage_kv| {
                            const key = try std.fmt.parseInt(u256, storage_kv.key_ptr.*, 0);
                            const value = try std.fmt.parseInt(u256, storage_kv.value_ptr.*.string, 0);
                            try database.set_storage(address.bytes, key, value);
                        }
                    }
                }
            }
        }
    }
    
    // Determine hardfork (currently not used, but would be useful for configuring EVM)
    _ = blk: {
        // Check for network field in expect
        if (test_case.object.get("expect")) |expect_list| {
            if (expect_list == .array and expect_list.array.items.len > 0) {
                const first_expect = expect_list.array.items[0];
                if (first_expect.object.get("network")) |networks| {
                    if (networks == .array and networks.array.items.len > 0) {
                        const net = networks.array.items[0].string;
                        if (std.mem.startsWith(u8, net, ">=")) {
                            break :blk parseHardfork(net[2..]);
                        }
                        break :blk parseHardfork(net);
                    }
                }
            }
        }
        break :blk evm.Hardfork.CANCUN;
    };
    
    // Create EVM with transaction context
    const tx_context = evm.TransactionContext{
        .gas_limit = 10000000,
        .coinbase = block_info.coinbase,
        .chain_id = 1,
    };
    
    var evm_instance = try evm.DefaultEvm.init(
        allocator, 
        &database, 
        block_info, 
        tx_context,
        10, // gas_price
        primitives.Address.zero() // origin
    );
    defer evm_instance.deinit();
    
    // Execute transaction(s)
    const has_transactions = test_case.object.get("transactions") != null;
    const has_transaction = test_case.object.get("transaction") != null;
    
    if (has_transactions or has_transaction) {
        const transactions = if (has_transactions) 
            test_case.object.get("transactions").?.array.items 
        else 
            &[_]std.json.Value{test_case.object.get("transaction").?};
        
        for (transactions) |tx| {
            // Parse transaction data
            const tx_data = if (tx.object.get("data")) |data| blk: {
                const data_str = if (data == .array) data.array.items[0].string else data.string;
                const hex = try parseHexData(allocator, data_str);
                defer allocator.free(hex);
                if (hex.len > 2) {
                    break :blk try primitives.Hex.hex_to_bytes(allocator, hex);
                } else {
                    break :blk try allocator.alloc(u8, 0);
                }
            } else try allocator.alloc(u8, 0);
            defer allocator.free(tx_data);
            
            // Determine sender
            const sender = if (tx.object.get("sender")) |s| 
                try parseAddress(s.string)
            else if (tx.object.get("secretKey") != null)
                // Standard test address for the common test private key
                try Address.fromHex("0xa94f5374fce5edbc8e2a8697c15331677e6ebf0b")
            else
                Address.zero();
            
            // Parse gas limit
            const gas_limit = if (tx.object.get("gasLimit")) |g| blk: {
                if (g == .array) {
                    break :blk try parseIntFromJson(g.array.items[0]);
                } else {
                    break :blk try parseIntFromJson(g);
                }
            } else 1000000;
            
            // Parse value
            const value = if (tx.object.get("value")) |v| blk: {
                const val_str = if (v == .array) v.array.items[0].string else v.string;
                break :blk try std.fmt.parseInt(u256, val_str, 0);
            } else 0;
            
            // Parse to address
            const to = if (tx.object.get("to")) |to_val| 
                try parseAddress(to_val.string) 
            else null;
            
            // Create call params
            const call_params = if (to) |to_addr| 
                evm.CallParams{ .call = .{
                    .caller = sender,
                    .to = to_addr,
                    .value = value,
                    .input = tx_data,
                    .gas = gas_limit,
                }}
            else 
                evm.CallParams{ .create = .{
                    .caller = sender,
                    .value = value,
                    .init_code = tx_data,
                    .gas = gas_limit,
                }};
            
            // Execute transaction
            var result = evm_instance.call(call_params);
            defer result.deinit(allocator);
            // Many tests expect failures, so we don't fail on unsuccessful calls
        }
    }
    
    // TODO: Validate post-state
}

fn parseIntFromJson(value: std.json.Value) !u64 {
    return switch (value) {
        .string => |s| try std.fmt.parseInt(u64, s, 0),
        .integer => |i| @intCast(i),
        .number_string => |s| try std.fmt.parseInt(u64, s, 0),
        else => 1,
    };
}

pub const TestData = struct {
    test_name: []const u8,
    source_file: []const u8,
    test_index: usize,
    data: TestCase,
};

pub const TestCase = struct {
    _info: ?TestInfo = null,
    env: ?TestEnv = null,
    pre: ?[]const AccountState = null,
    transaction: ?Transaction = null,
    transactions: ?[]const Transaction = null,
    expect: ?[]const ExpectResult = null,
    post: ?[]const AccountState = null,
    network: ?[]const u8 = null,
};

pub const TestInfo = struct {
    comment: ?[]const u8 = null,
    pytest_marks: ?[]const []const u8 = null,
};

pub const TestEnv = struct {
    currentCoinbase: ?[]const u8 = null,
    currentDifficulty: ?[]const u8 = null,
    currentGasLimit: ?[]const u8 = null,
    currentNumber: ?[]const u8 = null,
    currentTimestamp: ?[]const u8 = null,
    currentRandom: ?[]const u8 = null,
    currentBaseFee: ?[]const u8 = null,
};

pub const AccountState = struct {
    address: []const u8,
    balance: ?[]const u8 = null,
    code: ?[]const u8 = null,
    nonce: ?[]const u8 = null,
    storage: ?[]const StorageEntry = null,
};

pub const StorageEntry = struct {
    key: []const u8,
    value: []const u8,
};

pub const Transaction = struct {
    data: ?[]const u8 = null,
    gasLimit: ?[]const u8 = null,
    gasPrice: ?[]const u8 = null,
    nonce: ?[]const u8 = null,
    to: ?[]const u8 = null,
    value: ?[]const u8 = null,
    secretKey: ?[]const u8 = null,
    sender: ?[]const u8 = null,
};

pub const ExpectResult = struct {
    network: ?[]const []const u8 = null,
    result: ?[]const AccountState = null,
    indexes: ?TransactionIndexes = null,
};

pub const TransactionIndexes = struct {
    data: ?usize = null,
    gas: ?usize = null,
    value: ?usize = null,
};

fn parseAddress(addr: []const u8) !Address {
    var clean_addr = addr;
    
    // Handle placeholder syntax like:
    // <contract:0x...>
    // <contract:name:0x...>
    // <eoa:sender:0x...>
    if (std.mem.startsWith(u8, addr, "<") and std.mem.endsWith(u8, addr, ">")) {
        // Find the last occurrence of 0x (in case name contains 0x)
        if (std.mem.lastIndexOf(u8, addr, "0x")) |idx| {
            clean_addr = addr[idx..];
            // Remove trailing >
            if (std.mem.indexOf(u8, clean_addr, ">")) |end_idx| {
                clean_addr = clean_addr[0..end_idx];
            }
        }
    }
    
    // Ensure 0x prefix
    if (!std.mem.startsWith(u8, clean_addr, "0x")) {
        var buf: [42]u8 = undefined;
        buf[0] = '0';
        buf[1] = 'x';
        @memcpy(buf[2..2 + clean_addr.len], clean_addr);
        clean_addr = buf[0..2 + clean_addr.len];
    }
    
    // Ensure proper length (pad with zeros if needed)
    if (clean_addr.len < 42) {
        var padded: [42]u8 = undefined;
        @memcpy(padded[0..clean_addr.len], clean_addr);
        // Fill rest with '0'
        for (clean_addr.len..42) |i| {
            padded[i] = '0';
        }
        return try Address.fromHex(padded[0..42]);
    }
    
    return try Address.fromHex(clean_addr);
}

fn parseHexData(allocator: std.mem.Allocator, data: []const u8) ![]u8 {
    var clean_data = data;
    
    // Handle :raw prefix
    if (std.mem.startsWith(u8, data, ":raw ")) {
        clean_data = data[5..];
    }
    
    // Handle concatenated :raw data
    if (std.mem.indexOf(u8, clean_data, ",:raw ")) |_| {
        var parts = std.mem.tokenizeSequence(u8, clean_data, ",:raw ");
        var result = std.ArrayList(u8){};
        defer result.deinit(allocator);
        
        while (parts.next()) |part| {
            var p = part;
            if (std.mem.startsWith(u8, p, "0x")) {
                p = p[2..];
            }
            try result.appendSlice(allocator, p);
        }
        
        var final = try allocator.alloc(u8, result.items.len + 2);
        final[0] = '0';
        final[1] = 'x';
        @memcpy(final[2..], result.items);
        return final;
    }
    
    // Replace contract/eoa placeholders with addresses
    // Format: <contract:0xADDRESS> or <contract:name:0xADDRESS>
    var result = try allocator.alloc(u8, clean_data.len * 2); // Allocate extra for safety
    var write_idx: usize = 0;
    var read_idx: usize = 0;
    
    while (read_idx < clean_data.len) {
        if (read_idx + 1 < clean_data.len and clean_data[read_idx] == '<') {
            // Look for closing >
            if (std.mem.indexOf(u8, clean_data[read_idx..], ">")) |end_offset| {
                const placeholder = clean_data[read_idx..read_idx + end_offset + 1];
                // Extract the address from placeholder
                if (std.mem.lastIndexOf(u8, placeholder, "0x")) |addr_idx| {
                    const addr_end = placeholder.len - 1; // Before >
                    const addr = placeholder[addr_idx..addr_end];
                    // Copy just the address part (without 0x prefix) padded to 40 chars
                    if (addr.len >= 2 and std.mem.startsWith(u8, addr, "0x")) {
                        const addr_hex = addr[2..];
                        // Pad address to 40 hex chars (20 bytes)
                        var j: usize = 0;
                        while (j < 40 - addr_hex.len) : (j += 1) {
                            result[write_idx] = '0';
                            write_idx += 1;
                        }
                        @memcpy(result[write_idx..write_idx + addr_hex.len], addr_hex);
                        write_idx += addr_hex.len;
                    }
                }
                read_idx += end_offset + 1;
                continue;
            }
        }
        result[write_idx] = clean_data[read_idx];
        write_idx += 1;
        read_idx += 1;
    }
    
    // Resize to actual size
    const trimmed = result[0..write_idx];
    
    // Ensure 0x prefix
    if (!std.mem.startsWith(u8, trimmed, "0x")) {
        const with_prefix = try allocator.alloc(u8, write_idx + 2);
        with_prefix[0] = '0';
        with_prefix[1] = 'x';
        @memcpy(with_prefix[2..], trimmed);
        allocator.free(result);
        return with_prefix;
    }
    
    // Copy to final result
    const final_result = try allocator.alloc(u8, write_idx);
    @memcpy(final_result, trimmed);
    allocator.free(result);
    return final_result;
}

fn isAssemblyCode(code: []const u8) bool {
    // Assembly code starts with { or :asm
    // :raw prefix indicates actual bytecode, not assembly
    if (std.mem.startsWith(u8, code, ":raw ")) {
        return false; // This is bytecode, not assembly
    }
    return std.mem.startsWith(u8, code, "{") or std.mem.startsWith(u8, code, ":asm ");
}

fn parseHardfork(network: []const u8) evm.Hardfork {
    if (std.mem.eql(u8, network, "Shanghai")) return .SHANGHAI;
    if (std.mem.eql(u8, network, "Cancun")) return .CANCUN;
    if (std.mem.eql(u8, network, "Paris")) return .SHANGHAI; // Map Paris to Shanghai
    if (std.mem.eql(u8, network, "London")) return .LONDON;
    if (std.mem.eql(u8, network, "Berlin")) return .BERLIN;
    if (std.mem.eql(u8, network, "Byzantium")) return .BYZANTIUM;
    if (std.mem.eql(u8, network, "Homestead")) return .HOMESTEAD;
    if (std.mem.eql(u8, network, "Frontier")) return .FRONTIER;
    return .CANCUN; // Default to latest
}

pub fn runTest(allocator: std.mem.Allocator, test_data: TestData) !void {
    // Skip tests with assembly code in pre-state
    if (test_data.data.pre) |pre_state| {
        for (pre_state) |account| {
            if (account.code) |code| {
                if (isAssemblyCode(code)) {
                    // Skip assembly tests for now
                    return;
                }
            }
        }
    }
    
    // Setup database
    var database = evm.Database.init(allocator);
    defer database.deinit();
    
    // Determine hardfork (currently not used, but would be useful for configuring EVM)
    _ = blk: {
        if (test_data.data.network) |network| {
            break :blk parseHardfork(network);
        } else if (test_data.data.expect) |expect_list| {
            if (expect_list.len > 0) {
                if (expect_list[0].network) |networks| {
                    if (networks.len > 0) {
                        // Parse network from expect section
                        const net = networks[0];
                        if (std.mem.startsWith(u8, net, ">=")) {
                            break :blk parseHardfork(net[2..]);
                        }
                        break :blk parseHardfork(net);
                    }
                }
            }
        }
        break :blk evm.Hardfork.CANCUN;
    };
    
    // Setup block environment
    const env = test_data.data.env;
    const block_info = evm.BlockInfo{
        .number = if (env != null and env.?.currentNumber != null)
            try std.fmt.parseInt(u64, env.?.currentNumber.?, 0)
        else 1,
        
        .timestamp = if (env != null and env.?.currentTimestamp != null)
            try std.fmt.parseInt(u64, env.?.currentTimestamp.?, 0)
        else 1000,
        
        .gas_limit = if (env != null and env.?.currentGasLimit != null)
            try std.fmt.parseInt(u64, env.?.currentGasLimit.?, 0)
        else 10000000,
        
        .coinbase = if (env != null and env.?.currentCoinbase != null)
            try parseAddress(env.?.currentCoinbase.?)
        else Address.zero(),
        
        .difficulty = if (env != null and env.?.currentDifficulty != null)
            try std.fmt.parseInt(u256, env.?.currentDifficulty.?, 0)
        else 0,
        
        .base_fee = if (env != null and env.?.currentBaseFee != null)
            try std.fmt.parseInt(u256, env.?.currentBaseFee.?, 0)
        else 10,
        
        .prev_randao = [_]u8{0} ** 32,
    };
    
    // Setup pre-state
    if (test_data.data.pre) |pre_state| {
        for (pre_state) |account| {
            const address = try parseAddress(account.address);
            
            // Get or create account
            var acc = (try database.get_account(address.bytes)) orelse evm.Account.zero();
            
            // Set balance
            if (account.balance) |balance| {
                acc.balance = try std.fmt.parseInt(u256, balance, 0);
            }
            
            // Set nonce
            if (account.nonce) |nonce| {
                acc.nonce = try std.fmt.parseInt(u64, nonce, 0);
            }
            
            // Set code
            if (account.code) |code| {
                if (!std.mem.eql(u8, code, "") and !std.mem.eql(u8, code, "0x") and !isAssemblyCode(code)) {
                    const hex_data = try parseHexData(allocator, code);
                    defer allocator.free(hex_data);
                    
                    if (hex_data.len > 2) { // More than just "0x"
                        const code_bytes = try primitives.Hex.hex_to_bytes(allocator, hex_data);
                        defer allocator.free(code_bytes);
                        const code_hash = try database.set_code(code_bytes);
                        acc.code_hash = code_hash;
                    }
                }
            }
            
            // Save the account
            try database.set_account(address.bytes, acc);
            
            // Set storage
            if (account.storage) |storage| {
                for (storage) |entry| {
                    const key = try std.fmt.parseInt(u256, entry.key, 0);
                    const value = try std.fmt.parseInt(u256, entry.value, 0);
                    try database.set_storage(address.bytes, key, value);
                }
            }
        }
    }
    
    // Create EVM with transaction context
    const tx_context = evm.TransactionContext{
        .gas_limit = 10000000,
        .coinbase = block_info.coinbase,
        .chain_id = 1,
    };
    
    var evm_instance = try evm.DefaultEvm.init(
        allocator, 
        &database, 
        block_info, 
        tx_context,
        10, // gas_price
        primitives.Address.zero() // origin
    );
    defer evm_instance.deinit();
    
    // Execute transaction(s)
    const transactions = test_data.data.transactions orelse 
        if (test_data.data.transaction) |tx| &[_]Transaction{tx} else null;
    
    if (transactions) |txs| {
        for (txs) |tx| {
            // Parse transaction data
            const tx_data = if (tx.data) |data| blk: {
                const hex = try parseHexData(allocator, data);
                defer allocator.free(hex);
                if (hex.len > 2) {
                    break :blk try primitives.Hex.hex_to_bytes(allocator, hex);
                } else {
                    break :blk try allocator.alloc(u8, 0);
                }
            } else try allocator.alloc(u8, 0);
            defer allocator.free(tx_data);
            
            // Determine sender
            const sender = if (tx.sender) |s| 
                try parseAddress(s)
            else if (tx.secretKey != null)
                // Standard test address for the common test private key
                try Address.fromHex("0xa94f5374fce5edbc8e2a8697c15331677e6ebf0b")
            else
                Address.zero();
            
            // Parse to address
            const to_opt = if (tx.to) |to| try parseAddress(to) else null;
            const value = if (tx.value) |v| try std.fmt.parseInt(u256, v, 0) else 0;
            const gas = if (tx.gasLimit) |g| try std.fmt.parseInt(u64, g, 0) else 1000000;
            
            // Create call params
            const call_params = if (to_opt) |to_addr| 
                evm.CallParams{ .call = .{
                    .caller = sender,
                    .to = to_addr,
                    .value = value,
                    .input = tx_data,
                    .gas = gas,
                }}
            else 
                evm.CallParams{ .create = .{
                    .caller = sender,
                    .value = value,
                    .init_code = tx_data,
                    .gas = gas,
                }};
            
            // Execute transaction
            var result = evm_instance.call(call_params);
            defer result.deinit(allocator);
            // Many tests expect failures, so we don't fail on unsuccessful calls
        }
    }
    
    // Validate post-state
    if (test_data.data.post) |post_state| {
        for (post_state) |expected| {
            const address = try parseAddress(expected.address);
            
            // Check balance
            if (expected.balance) |expected_bal| {
                const exp = try std.fmt.parseInt(u256, expected_bal, 0);
                const actual_account = try database.get_account(address.bytes);
                const actual = if (actual_account) |acc| acc.balance else 0;
                try testing.expectEqual(exp, actual);
            }
            
            // Check nonce
            if (expected.nonce) |expected_nonce| {
                const exp = try std.fmt.parseInt(u64, expected_nonce, 0);
                const actual_account = try database.get_account(address.bytes);
                const actual = if (actual_account) |acc| acc.nonce else 0;
                try testing.expectEqual(exp, actual);
            }
            
            // Check code
            if (expected.code) |expected_code| {
                if (!std.mem.eql(u8, expected_code, "") and !std.mem.eql(u8, expected_code, "0x") and !isAssemblyCode(expected_code)) {
                    const hex_data = try parseHexData(allocator, expected_code);
                    defer allocator.free(hex_data);
                    
                    if (hex_data.len > 2) {
                        const exp_bytes = try primitives.Hex.hex_to_bytes(allocator, hex_data);
                        defer allocator.free(exp_bytes);
                        
                        const actual_account = try database.get_account(address.bytes);
                        const actual_bytes = if (actual_account) |acc| try database.get_code(acc.code_hash) else &[_]u8{};
                        
                        try testing.expectEqualSlices(u8, exp_bytes, actual_bytes);
                    }
                }
            }
            
            // Check storage
            if (expected.storage) |storage| {
                for (storage) |entry| {
                    const key = try std.fmt.parseInt(u256, entry.key, 0);
                    const exp_value = try std.fmt.parseInt(u256, entry.value, 0);
                    const actual_value = try database.get_storage(address.bytes, key);
                    try testing.expectEqual(exp_value, actual_value);
                }
            }
        }
    } else if (test_data.data.expect) |expect_list| {
        // Handle expect format (alternative to post)
        for (expect_list) |expectation| {
            if (expectation.result) |result| {
                for (result) |expected| {
                    const address = try parseAddress(expected.address);
                    
                    // Check balance
                    if (expected.balance) |expected_bal| {
                        const exp = try std.fmt.parseInt(u256, expected_bal, 0);
                        const actual_account = try database.get_account(address.bytes);
                        const actual = if (actual_account) |acc| acc.balance else 0;
                        try testing.expectEqual(exp, actual);
                    }
                    
                    // Check nonce
                    if (expected.nonce) |expected_nonce| {
                        const exp = try std.fmt.parseInt(u64, expected_nonce, 0);
                        const actual_account = try database.get_account(address.bytes);
                        const actual = if (actual_account) |acc| acc.nonce else 0;
                        try testing.expectEqual(exp, actual);
                    }
                    
                    // Check storage
                    if (expected.storage) |storage| {
                        for (storage) |entry| {
                            const key = try std.fmt.parseInt(u256, entry.key, 0);
                            const exp_value = try std.fmt.parseInt(u256, entry.value, 0);
                            const actual_value = try database.get_storage(address.bytes, key);
                            try testing.expectEqual(exp_value, actual_value);
                        }
                    }
                }
            }
        }
    }
}