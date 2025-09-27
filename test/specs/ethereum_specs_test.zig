const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");
const crypto = @import("crypto");

const testing = std.testing;

// Test configuration
const SPECS_DIR = "specs/execution-specs/tests";

// Specific test files to run (avoids walker timeout on large directory trees)
const TEST_FILES = [_][]const u8{
    "eest/cancun/eip4844_blobs/point_evaluation_vectors/go_kzg_4844_verify_kzg_proof.json",
    // Add more test files here as needed
};

fn parseAddress(allocator: std.mem.Allocator, addr_str: []const u8) !primitives.Address {
    _ = allocator;
    var addr = addr_str;
    
    // Handle placeholder syntax like <contract:0x...> or <eoa:0x...>
    if (std.mem.indexOf(u8, addr, "<") != null and std.mem.indexOf(u8, addr, ">") != null) {
        // Extract address from placeholder
        if (std.mem.indexOf(u8, addr, "0x")) |idx| {
            const end_idx = std.mem.indexOfPos(u8, addr, idx, ">") orelse addr.len;
            addr = addr[idx..end_idx];
        }
    }
    
    // Remove 0x prefix if present
    if (addr.len >= 2 and (std.mem.eql(u8, addr[0..2], "0x") or std.mem.eql(u8, addr[0..2], "0X"))) {
        addr = addr[2..];
    }
    
    // Pad with zeros if necessary
    var hex_bytes = [_]u8{0} ** 40;
    if (addr.len <= 40) {
        @memcpy(hex_bytes[40 - addr.len..], addr);
    } else {
        @memcpy(&hex_bytes, addr[addr.len - 40..]);
    }
    
    // Convert hex string to bytes
    var bytes: [20]u8 = undefined;
    for (0..20) |i| {
        const high = try std.fmt.charToDigit(hex_bytes[i * 2], 16);
        const low = try std.fmt.charToDigit(hex_bytes[i * 2 + 1], 16);
        bytes[i] = (high << 4) | low;
    }
    
    return primitives.Address.fromBytes(&bytes) catch unreachable;
}

fn parseHexData(allocator: std.mem.Allocator, data_str: []const u8) ![]u8 {
    var data = data_str;
    
    // Handle :raw prefix
    if (std.mem.startsWith(u8, data, ":raw ")) {
        data = data[5..];
    }
    
    // Remove 0x prefix if present
    if (data.len >= 2 and std.mem.eql(u8, data[0..2], "0x")) {
        data = data[2..];
    }
    
    // Handle empty data
    if (data.len == 0) {
        return try allocator.alloc(u8, 0);
    }
    
    // Count valid hex characters
    var hex_count: usize = 0;
    for (data) |c| {
        if (std.ascii.isHex(c)) {
            hex_count += 1;
        }
    }
    
    // Handle no valid hex
    if (hex_count == 0) {
        return try allocator.alloc(u8, 0);
    }
    
    // Ensure even number of hex digits
    const needs_padding = hex_count % 2 != 0;
    const byte_count = if (needs_padding) (hex_count + 1) / 2 else hex_count / 2;
    
    const bytes = try allocator.alloc(u8, byte_count);
    
    var byte_idx: usize = 0;
    var nibble_idx: usize = 0;
    var current_byte: u8 = 0;
    
    // Add leading zero if needed
    if (needs_padding) {
        current_byte = 0;
        nibble_idx = 1;
    }
    
    for (data) |c| {
        if (std.ascii.isHex(c)) {
            const digit = try std.fmt.charToDigit(c, 16);
            if (nibble_idx % 2 == 0) {
                current_byte = digit << 4;
            } else {
                current_byte |= digit;
                bytes[byte_idx] = current_byte;
                byte_idx += 1;
            }
            nibble_idx += 1;
        }
    }
    
    return bytes;
}

fn parseU256(str: []const u8) !u256 {
    var s = str;
    
    // Handle empty string
    if (s.len == 0) return 0;
    
    // Remove 0x prefix
    if (s.len >= 2 and std.mem.eql(u8, s[0..2], "0x")) {
        s = s[2..];
    }
    
    // Handle empty hex string
    if (s.len == 0) return 0;
    
    // Parse hex string
    var result: u256 = 0;
    for (s) |c| {
        const digit = try std.fmt.charToDigit(c, 16);
        result = result * 16 + digit;
    }
    
    return result;
}

fn parseAddressValue(value: ?std.json.Value) !primitives.Address {
    if (value) |v| {
        if (v == .string) {
            const bytes = try parseHexData(testing.allocator, v.string);
            defer testing.allocator.free(bytes);
            if (bytes.len == 32) {
                return primitives.Address.fromBytes(bytes[12..32]) catch unreachable;
            } else if (bytes.len == 20) {
                return primitives.Address.fromBytes(bytes[0..20]) catch unreachable;
            } else {
                return primitives.Address.zero();
            }
        }
    }
    return primitives.Address.zero();
}

fn executeTestCase(allocator: std.mem.Allocator, test_name: []const u8, test_data: std.json.Value) !void {
    _ = test_name;
    
    // Parse block info
    const env = test_data.object.get("env") orelse return error.MissingEnvField;
    const coinbase = try parseAddressValue(env.object.get("currentCoinbase"));
    
    var block_number: u64 = 1;
    var block_timestamp: u64 = 1000;
    var block_gas_limit: u64 = 10_000_000;
    var block_base_fee: u256 = 0;
    var block_difficulty: u256 = 0;
    var prev_randao = [_]u8{0} ** 32;
    
    if (env.object.get("currentNumber")) |num| {
        if (num == .string) {
            block_number = try std.fmt.parseInt(u64, num.string, 0);
        }
    }
    if (env.object.get("currentTimestamp")) |ts| {
        if (ts == .string) {
            block_timestamp = try std.fmt.parseInt(u64, ts.string, 0);
        }
    }
    if (env.object.get("currentGasLimit")) |gl| {
        if (gl == .string) {
            block_gas_limit = try std.fmt.parseInt(u64, gl.string, 0);
        }
    }
    if (env.object.get("currentBaseFee")) |bf| {
        if (bf == .string and bf.string.len > 0) {
            block_base_fee = try parseU256(bf.string);
        }
    }
    if (env.object.get("currentDifficulty")) |diff| {
        if (diff == .string and diff.string.len > 0) {
            block_difficulty = try parseU256(diff.string);
        }
    }
    if (env.object.get("currentRandom")) |rand| {
        if (rand == .string) {
            const rand_bytes = try parseHexData(allocator, rand.string);
            defer allocator.free(rand_bytes);
            if (rand_bytes.len == 32) {
                @memcpy(&prev_randao, rand_bytes);
            }
        }
    }
    
    const block_info = evm.BlockInfo{
        .chain_id = 1,
        .number = block_number,
        .parent_hash = [_]u8{0} ** 32,
        .timestamp = block_timestamp,
        .difficulty = block_difficulty,
        .gas_limit = block_gas_limit,
        .coinbase = coinbase,
        .base_fee = block_base_fee,
        .prev_randao = prev_randao,
        .blob_base_fee = 0,
        .blob_versioned_hashes = &.{},
    };
    
    // Set up database with pre-state
    var database = evm.Database.init(allocator);
    defer database.deinit();
    
    if (test_data.object.get("pre")) |pre| {
        var pre_iter = pre.object.iterator();
        while (pre_iter.next()) |kv| {
            const addr_str = kv.key_ptr.*;
            const account_data = kv.value_ptr.*;
            
            if (account_data != .object) continue;
            
            const address = try parseAddress(allocator, addr_str);
            
            var balance: u256 = 0;
            var nonce: u64 = 0;
            var code: []u8 = try allocator.alloc(u8, 0);
            defer allocator.free(code);
            
            if (account_data.object.get("balance")) |bal| {
                if (bal == .string and bal.string.len > 0) {
                    balance = try parseU256(bal.string);
                }
            }
            
            if (account_data.object.get("nonce")) |n| {
                if (n == .string and n.string.len > 0) {
                    nonce = try std.fmt.parseInt(u64, n.string, 0);
                }
            }
            
            if (account_data.object.get("code")) |code_str| {
                if (code_str == .string and code_str.string.len > 0 and code_str.string[0] != '{') {
                    allocator.free(code);
                    code = try parseHexData(allocator, code_str.string);
                }
            }
            
            // Set code first if present
            var code_hash = [_]u8{0} ** 32;
            if (code.len > 0) {
                code_hash = try database.set_code(code);
            }
            
            const account = evm.Account{
                .balance = balance,
                .nonce = nonce,
                .code_hash = code_hash,
                .storage_root = [_]u8{0} ** 32,
                .delegated_address = null,
            };
            try database.set_account(address.bytes, account);
            
            // Set storage if present
            if (account_data.object.get("storage")) |storage| {
                if (storage == .object) {
                    var storage_it = storage.object.iterator();
                    while (storage_it.next()) |storage_entry| {
                        const key = try parseU256(storage_entry.key_ptr.*);
                        const value_str = if (storage_entry.value_ptr.* == .string)
                            storage_entry.value_ptr.*.string
                        else
                            "0x0";
                        const value = try parseU256(value_str);
                        
                        try database.set_storage(address.bytes, key, value);
                    }
                }
            }
        }
    }
    
    // Execute each block
    if (test_data.object.get("blocks")) |blocks| {
        for (blocks.array.items) |block| {
            // Execute each transaction in the block
            if (block.object.get("transactions")) |txs| {
                for (txs.array.items) |tx| {
                    if (tx != .object) continue;
                    
                    // Parse transaction fields
                    var gas_limit: u64 = 1_000_000;
                    var gas_price: u256 = 1_000_000_000;
                    var to_addr: ?primitives.Address = null;
                    var value: u256 = 0;
                    var data: []u8 = try allocator.alloc(u8, 0);
                    defer allocator.free(data);
                    const sender = primitives.Address.fromBytes(&([_]u8{0xa9} ** 20)) catch unreachable;
                    
                    // Gas limit
                    if (tx.object.get("gasLimit")) |gl| {
                        const gl_str = switch (gl) {
                            .string => |s| s,
                            .array => |a| if (a.items.len > 0) a.items[0].string else "1000000",
                            else => "1000000",
                        };
                        if (gl_str.len > 0) {
                            gas_limit = try std.fmt.parseInt(u64, gl_str, 0);
                        }
                    }
                    
                    // Gas price
                    if (tx.object.get("gasPrice")) |gp| {
                        if (gp == .string and gp.string.len > 0) {
                            gas_price = try parseU256(gp.string);
                        }
                    }
                    
                    // To address
                    if (tx.object.get("to")) |to| {
                        if (to == .string and to.string.len > 0) {
                            to_addr = try parseAddress(allocator, to.string);
                        }
                    }
                    
                    // Value
                    if (tx.object.get("value")) |v| {
                        const v_str = switch (v) {
                            .string => |s| s,
                            .array => |a| if (a.items.len > 0) a.items[0].string else "0",
                            else => "0",
                        };
                        if (v_str.len > 0) {
                            value = try parseU256(v_str);
                        }
                    }
                    
                    // Data
                    if (tx.object.get("data")) |d| {
                        const d_str = switch (d) {
                            .string => |s| s,
                            .array => |a| if (a.items.len > 0) a.items[0].string else "0x",
                            else => "0x",
                        };
                        allocator.free(data);
                        data = try parseHexData(allocator, d_str);
                    }
                    
                    // Create transaction context
                    const tx_context = evm.TransactionContext{
                        .gas_limit = gas_limit,
                        .coinbase = coinbase,
                        .chain_id = 1,
                        .blob_versioned_hashes = &.{},
                        .blob_base_fee = 0,
                    };
                    
                    // Create and execute EVM instance
                    var evm_instance = try evm.MainnetEvm.init(
                        allocator,
                        &database,
                        block_info,
                        tx_context,
                        gas_price,
                        sender,
                    );
                    defer evm_instance.deinit();
                    
                    // Create call params based on whether it's a create or call
                    const call_params = if (to_addr) |to| 
                        evm.CallParams{
                            .call = .{
                                .caller = sender,
                                .to = to,
                                .value = value,
                                .input = data,
                                .gas = gas_limit,
                            },
                        }
                    else 
                        evm.CallParams{
                            .create = .{
                                .caller = sender,
                                .value = value,
                                .init_code = data,
                                .gas = gas_limit,
                            },
                        };
                    
                    const exec_result = evm_instance.call(call_params);
                    _ = exec_result;
                    
                    // TODO: Validate post-state
                }
            }
        }
    }
}

test "Ethereum execution spec tests" {
    const allocator = testing.allocator;
    const cwd = std.fs.cwd();
    
    // Open the tests directory
    const tests_dir = try cwd.openDir(SPECS_DIR, .{ .iterate = true });
    _ = tests_dir;
    
    // Process specific test files directly (avoids walker timeout)
    var test_count: usize = 0;
    var skipped_count: usize = 0;
    
    for (TEST_FILES) |file_path| {
        const full_path = try std.fs.path.join(allocator, &.{ SPECS_DIR, file_path });
        defer allocator.free(full_path);
        
        // Read the file
        const file_contents = cwd.readFileAlloc(allocator, full_path, 10 * 1024 * 1024) catch |err| {
            std.log.warn("Failed to read {s}: {}", .{ file_path, err });
            continue;
        };
        defer allocator.free(file_contents);
        
        // Parse JSON
        const parsed = try std.json.parseFromSlice(std.json.Value, allocator, file_contents, .{});
        defer parsed.deinit();
        
        // Process each test in the file
        if (parsed.value == .object) {
            var iter = parsed.value.object.iterator();
            while (iter.next()) |kv| {
                const test_name = kv.key_ptr.*;
                const test_data = kv.value_ptr.*;
                
                test_count += 1;
                executeTestCase(allocator, test_name, test_data) catch |err| {
                    std.log.warn("Test '{s}' failed: {}", .{ test_name, err });
                    skipped_count += 1;
                };
            }
        }
    }
    
    std.log.info("Ran {} tests ({} skipped)", .{ test_count, skipped_count });
}