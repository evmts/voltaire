const std = @import("std");
const Evm = @import("evm");
const Address = @import("Address");

// test {
//     std.testing.log_level = .debug;
// }

const Vm = Evm.Evm;
const Frame = Evm.Frame;
const Contract = Evm.Contract;
const MemoryDatabase = Evm.MemoryDatabase;
const ExecutionError = Evm.ExecutionError;
const DatabaseInterface = Evm.DatabaseInterface;
const Account = Evm.Account;
const Context = Evm.Context;
const RunResult = Evm.RunResult;
const EvmState = Evm.EvmState;
const CreateResult = Evm.CreateResult;

const StateAccount = struct {
    balance: u256,
    nonce: u64,
    code: []const u8,
    storage: std.StringHashMap(u256),
};

const TransactionReceipt = struct {
    status: u8,
    gasUsed: u64,
    logs: []const LogEntry,
};

const LogEntry = struct {
    address: [20]u8,
    topics: []const u256,
    data: []const u8,
    logIndex: u64,
};

const ExecutionStatus = enum {
    Success,
    Revert,
    Invalid,
    OutOfGas,
};

const TestTransaction = struct {
    hash: u256,
    from: [20]u8,
    to: ?[20]u8,
    value: u256,
    input: []const u8,
    gas: u64,
    gasPrice: u256,
    nonce: u64,
    blockNumber: u64,
    transactionIndex: u64,
    preState: std.StringHashMap(StateAccount),
    postState: std.StringHashMap(StateAccount),
    receipt: TransactionReceipt,
    trace: []const u8,
};

const TestBlock = struct {
    number: u64,
    hash: u256,
    timestamp: u64,
    gasLimit: u64,
    gasUsed: u64,
    baseFeePerGas: u256,
    transactions: []const TestTransaction,
};

const TestData = struct {
    blocks: []const TestBlock,
    metadata: std.json.Value,
};

fn parseHexU256(hex: []const u8) !u256 {
    if (hex.len < 2 or !std.mem.eql(u8, hex[0..2], "0x")) {
        return error.InvalidHexFormat;
    }
    
    const hex_digits = hex[2..];
    if (hex_digits.len == 0) {
        return 0;
    }
    
    var result: u256 = 0;
    for (hex_digits) |c| {
        const digit = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return error.InvalidHexCharacter,
        };
        result = result * 16 + digit;
    }
    
    return result;
}

fn parseHexU64(hex: []const u8) !u64 {
    const value = try parseHexU256(hex);
    if (value > std.math.maxInt(u64)) {
        return error.ValueTooLarge;
    }
    return @intCast(value);
}

fn parseHexBytes(allocator: std.mem.Allocator, hex: []const u8) ![]u8 {
    if (hex.len < 2 or !std.mem.eql(u8, hex[0..2], "0x")) {
        return error.InvalidHexFormat;
    }
    
    const hex_digits = hex[2..];
    if (hex_digits.len % 2 != 0) {
        return error.OddLengthHex;
    }
    
    const bytes = try allocator.alloc(u8, hex_digits.len / 2);
    errdefer allocator.free(bytes);
    
    var i: usize = 0;
    while (i < hex_digits.len) : (i += 2) {
        const high = switch (hex_digits[i]) {
            '0'...'9' => hex_digits[i] - '0',
            'a'...'f' => hex_digits[i] - 'a' + 10,
            'A'...'F' => hex_digits[i] - 'A' + 10,
            else => return error.InvalidHexCharacter,
        };
        const low = switch (hex_digits[i + 1]) {
            '0'...'9' => hex_digits[i + 1] - '0',
            'a'...'f' => hex_digits[i + 1] - 'a' + 10,
            'A'...'F' => hex_digits[i + 1] - 'A' + 10,
            else => return error.InvalidHexCharacter,
        };
        bytes[i / 2] = high * 16 + low;
    }
    
    return bytes;
}

fn parseAddress(hex: []const u8) ![20]u8 {
    const bytes = try parseHexBytes(std.testing.allocator, hex);
    defer std.testing.allocator.free(bytes);
    
    if (bytes.len != 20) {
        return error.InvalidAddressLength;
    }
    
    var addr_bytes: [20]u8 = undefined;
    @memcpy(&addr_bytes, bytes);
    return addr_bytes;
}

fn loadTestData(allocator: std.mem.Allocator, path: []const u8) !TestData {
    const file = try std.fs.cwd().openFile(path, .{});
    defer file.close();
    
    const content = try file.readToEndAlloc(allocator, 1024 * 1024 * 1024); // 1GB limit
    defer allocator.free(content);
    
    var parsed = try std.json.parseFromSlice(std.json.Value, allocator, content, .{});
    defer parsed.deinit();
    
    const blocks_array = parsed.value.object.get("blocks").?.array;
    var blocks = try allocator.alloc(TestBlock, blocks_array.items.len);
    errdefer allocator.free(blocks);
    
    for (blocks_array.items, 0..) |block_json, block_idx| {
        const block_obj = block_json.object;
        
        blocks[block_idx] = TestBlock{
            .number = try parseHexU64(block_obj.get("number").?.string),
            .hash = try parseHexU256(block_obj.get("hash").?.string),
            .timestamp = try parseHexU64(block_obj.get("timestamp").?.string),
            .gasLimit = try parseHexU64(block_obj.get("gasLimit").?.string),
            .gasUsed = try parseHexU64(block_obj.get("gasUsed").?.string),
            .baseFeePerGas = try parseHexU256(block_obj.get("baseFeePerGas").?.string),
            .transactions = &.{},
        };
        
        const txs_array = block_obj.get("transactions").?.array;
        var txs = try allocator.alloc(TestTransaction, txs_array.items.len);
        errdefer allocator.free(txs);
        
        for (txs_array.items, 0..) |tx_json, tx_idx| {
            const tx_obj = tx_json.object;
            
            var pre_state = std.StringHashMap(StateAccount).init(allocator);
            errdefer pre_state.deinit();
            
            const pre_state_obj = tx_obj.get("preState").?.object;
            var pre_state_iter = pre_state_obj.iterator();
            while (pre_state_iter.next()) |entry| {
                const addr = entry.key_ptr.*;
                const account_obj = entry.value_ptr.*.object;
                
                var storage = std.StringHashMap(u256).init(allocator);
                errdefer storage.deinit();
                
                const storage_obj = account_obj.get("storage").?.object;
                var storage_iter = storage_obj.iterator();
                while (storage_iter.next()) |storage_entry| {
                    const value = try parseHexU256(storage_entry.value_ptr.*.string);
                    try storage.put(try allocator.dupe(u8, storage_entry.key_ptr.*), value);
                }
                
                const code_hex = account_obj.get("code").?.string;
                const code = try parseHexBytes(allocator, code_hex);
                
                try pre_state.put(try allocator.dupe(u8, addr), StateAccount{
                    .balance = try parseHexU256(account_obj.get("balance").?.string),
                    .nonce = try parseHexU64(account_obj.get("nonce").?.string),
                    .code = code,
                    .storage = storage,
                });
            }
            
            var post_state = std.StringHashMap(StateAccount).init(allocator);
            errdefer post_state.deinit();
            
            const post_state_obj = tx_obj.get("postState").?.object;
            var post_state_iter = post_state_obj.iterator();
            while (post_state_iter.next()) |entry| {
                const addr = entry.key_ptr.*;
                const account_obj = entry.value_ptr.*.object;
                
                var storage = std.StringHashMap(u256).init(allocator);
                errdefer storage.deinit();
                
                const storage_obj = account_obj.get("storage").?.object;
                var storage_iter = storage_obj.iterator();
                while (storage_iter.next()) |storage_entry| {
                    const value = try parseHexU256(storage_entry.value_ptr.*.string);
                    try storage.put(try allocator.dupe(u8, storage_entry.key_ptr.*), value);
                }
                
                const code_hex = account_obj.get("code").?.string;
                const code = try parseHexBytes(allocator, code_hex);
                
                try post_state.put(try allocator.dupe(u8, addr), StateAccount{
                    .balance = try parseHexU256(account_obj.get("balance").?.string),
                    .nonce = try parseHexU64(account_obj.get("nonce").?.string),
                    .code = code,
                    .storage = storage,
                });
            }
            
            const receipt_obj = tx_obj.get("receipt").?.object;
            const logs_array = receipt_obj.get("logs").?.array;
            var logs = try allocator.alloc(LogEntry, logs_array.items.len);
            errdefer allocator.free(logs);
            
            for (logs_array.items, 0..) |log_json, log_idx| {
                const log_obj = log_json.object;
                
                const topics_array = log_obj.get("topics").?.array;
                var topics = try allocator.alloc(u256, topics_array.items.len);
                errdefer allocator.free(topics);
                
                for (topics_array.items, 0..) |topic, topic_idx| {
                    topics[topic_idx] = try parseHexU256(topic.string);
                }
                
                logs[log_idx] = LogEntry{
                    .address = try parseAddress(log_obj.get("address").?.string),
                    .topics = topics,
                    .data = try parseHexBytes(allocator, log_obj.get("data").?.string),
                    .logIndex = try parseHexU64(log_obj.get("logIndex").?.string),
                };
            }
            
            const to_value = tx_obj.get("to");
            const to_addr = if (to_value) |val| blk: {
                if (val == .null) break :blk null;
                const to_str = val.string;
                if (to_str.len == 0 or std.mem.eql(u8, to_str, "null")) break :blk null;
                break :blk try parseAddress(to_str);
            } else null;
            
            txs[tx_idx] = TestTransaction{
                .hash = try parseHexU256(tx_obj.get("hash").?.string),
                .from = try parseAddress(tx_obj.get("from").?.string),
                .to = to_addr,
                .value = try parseHexU256(tx_obj.get("value").?.string),
                .input = try parseHexBytes(allocator, tx_obj.get("input").?.string),
                .gas = try parseHexU64(tx_obj.get("gas").?.string),
                .gasPrice = try parseHexU256(tx_obj.get("gasPrice").?.string),
                .nonce = try parseHexU64(tx_obj.get("nonce").?.string),
                .blockNumber = try parseHexU64(tx_obj.get("blockNumber").?.string),
                .transactionIndex = try parseHexU64(tx_obj.get("transactionIndex").?.string),
                .preState = pre_state,
                .postState = post_state,
                .receipt = TransactionReceipt{
                    .status = @intCast(try parseHexU64(receipt_obj.get("status").?.string)),
                    .gasUsed = try parseHexU64(receipt_obj.get("gasUsed").?.string),
                    .logs = logs,
                },
                .trace = &.{},
            };
        }
        
        blocks[block_idx].transactions = txs;
    }
    
    return TestData{
        .blocks = blocks,
        .metadata = if (parsed.value.object.get("metadata")) |meta| meta else .{ .object = std.json.ObjectMap.init(allocator) },
    };
}

fn cleanupTestData(allocator: std.mem.Allocator, test_data: TestData) void {
    for (test_data.blocks) |block| {
        for (block.transactions) |*tx| {
            var pre_iter = tx.preState.iterator();
            while (pre_iter.next()) |entry| {
                allocator.free(entry.key_ptr.*);
                allocator.free(entry.value_ptr.*.code);
                var storage_iter = entry.value_ptr.*.storage.iterator();
                while (storage_iter.next()) |storage_entry| {
                    allocator.free(storage_entry.key_ptr.*);
                }
                @constCast(&entry.value_ptr.*.storage).deinit();
            }
            @constCast(&tx.preState).deinit();
            
            var post_iter = tx.postState.iterator();
            while (post_iter.next()) |entry| {
                allocator.free(entry.key_ptr.*);
                allocator.free(entry.value_ptr.*.code);
                var storage_iter = entry.value_ptr.*.storage.iterator();
                while (storage_iter.next()) |storage_entry| {
                    allocator.free(storage_entry.key_ptr.*);
                }
                @constCast(&entry.value_ptr.*.storage).deinit();
            }
            @constCast(&tx.postState).deinit();
            
            allocator.free(tx.input);
            for (tx.receipt.logs) |log| {
                allocator.free(log.topics);
                allocator.free(log.data);
            }
            allocator.free(tx.receipt.logs);
        }
        allocator.free(block.transactions);
    }
    allocator.free(test_data.blocks);
}

fn seedDatabase(db: *MemoryDatabase, pre_state: std.StringHashMap(StateAccount)) !void {
    var iter = pre_state.iterator();
    while (iter.next()) |entry| {
        const addr_str = entry.key_ptr.*;
        const account = entry.value_ptr.*;
        
        const address = try parseAddress(addr_str);
        
        const account_data = Account{
            .balance = account.balance,
            .nonce = account.nonce,
            .code_hash = if (account.code.len > 0) blk: {
                var hash: [32]u8 = undefined;
                std.crypto.hash.sha3.Keccak256.hash(account.code, &hash, .{});
                break :blk hash;
            } else [_]u8{0} ** 32,
            .storage_root = [_]u8{0} ** 32,
        };
        
        const db_interface = db.to_database_interface();
        try db_interface.set_account(address, account_data);
        
        if (account.code.len > 0) {
            _ = try db_interface.set_code(account.code);
        }
        
        var storage_iter = account.storage.iterator();
        while (storage_iter.next()) |storage_entry| {
            const slot = try parseHexU256(storage_entry.key_ptr.*);
            const value = storage_entry.value_ptr.*;
            
            try db_interface.set_storage(address, slot, value);
        }
    }
}

fn executeTransaction(allocator: std.mem.Allocator, vm: *Vm, tx: TestTransaction, block: TestBlock) !struct { gas_used: u64, logs_count: usize, success: bool } {
    const context = Context.init_with_values(
        tx.from,
        tx.gasPrice,
        block.number,
        block.timestamp,
        Address.zero(),
        0,
        block.gasLimit,
        1,
        block.baseFeePerGas,
        &.{},
        1,
    );
    vm.set_context(context);
    
    try vm.state.set_balance(tx.from, tx.value + tx.gas * tx.gasPrice);
    try vm.state.set_nonce(tx.from, tx.nonce);
    
    const initial_gas = tx.gas;
    
    if (tx.to) |to_addr| {
        const code = vm.state.get_code(to_addr);
        std.debug.print("    Contract code size: {}\n", .{code.len});
        
        var contract = Contract.init_at_address(
            tx.from,
            to_addr,
            tx.value,
            tx.gas,
            code,
            tx.input,
            false,
        );
        defer contract.deinit(allocator, null);
        
        const result = try vm.interpret(&contract, tx.input);
        defer if (result.output) |out| allocator.free(out);
        
        std.debug.print("    Execution status: {}\n", .{result.status});
        if (result.status != .Success) {
            std.debug.print("    Gas left: {}\n", .{result.gas_left});
            if (result.output) |output| {
                std.debug.print("    Output/revert data: {x}\n", .{std.fmt.fmtSliceHexLower(output[0..@min(100, output.len)])});
            }
        }
        
        const gas_used = initial_gas - result.gas_left;
        const logs_count = vm.state.logs.items.len;
        const success = result.status == .Success;
        
        return .{
            .gas_used = gas_used,
            .logs_count = logs_count,
            .success = success,
        };
    } else {
        const create_result = try vm.create_contract(
            tx.from,
            tx.value,
            tx.input,
            tx.gas,
        );
        defer if (create_result.output) |out| allocator.free(out);
        
        const gas_used = initial_gas - create_result.gas_left;
        const logs_count = vm.state.logs.items.len;
        const success = create_result.success;
        
        return .{
            .gas_used = gas_used,
            .logs_count = logs_count,
            .success = success,
        };
    }
}

fn verifyPostState(db: *MemoryDatabase, expected: std.StringHashMap(StateAccount)) !void {
    var iter = expected.iterator();
    while (iter.next()) |entry| {
        const addr_str = entry.key_ptr.*;
        const expected_account = entry.value_ptr.*;
        
        const address = try parseAddress(addr_str);
        
        const db_interface = db.to_database_interface();
        const actual_opt = try db_interface.get_account(address);
        if (actual_opt == null and (expected_account.balance != 0 or expected_account.nonce != 0 or expected_account.code.len != 0)) {
            std.debug.print("Account not found: {s}\n", .{addr_str});
            return error.AccountNotFound;
        }
        
        const actual_info = actual_opt orelse Account{
            .balance = 0,
            .nonce = 0,
            .code_hash = [_]u8{0} ** 32,
            .storage_root = [_]u8{0} ** 32,
        };
        
        if (actual_info.balance != expected_account.balance) {
            std.debug.print("Balance mismatch for {s}: expected {}, got {}\n", .{ addr_str, expected_account.balance, actual_info.balance });
            return error.BalanceMismatch;
        }
        
        if (actual_info.nonce != expected_account.nonce) {
            std.debug.print("Nonce mismatch for {s}: expected {}, got {}\n", .{ addr_str, expected_account.nonce, actual_info.nonce });
            return error.NonceMismatch;
        }
        
        if (expected_account.code.len > 0) {
            var expected_hash: [32]u8 = undefined;
            std.crypto.hash.sha3.Keccak256.hash(expected_account.code, &expected_hash, .{});
            if (!std.mem.eql(u8, &actual_info.code_hash, &expected_hash)) {
                std.debug.print("Code hash mismatch for {s}\n", .{addr_str});
                return error.CodeMismatch;
            }
        }
        
        var storage_iter = expected_account.storage.iterator();
        while (storage_iter.next()) |storage_entry| {
            const slot = try parseHexU256(storage_entry.key_ptr.*);
            const expected_value = storage_entry.value_ptr.*;
            
            const actual_value = try db_interface.get_storage(address, slot);
            
            if (actual_value != expected_value) {
                std.debug.print("Storage mismatch for {s} slot {}: expected {}, got {}\n", .{ addr_str, slot, expected_value, actual_value });
                return error.StorageMismatch;
            }
        }
    }
}

fn verifyGasUsage(actual: u64, expected: u64) !void {
    if (actual != expected) {
        std.debug.print("Gas usage mismatch: expected {}, got {}\n", .{ expected, actual });
        return error.GasUsageMismatch;
    }
}

fn verifyLogs(vm: *Vm, expected_logs: []const LogEntry) !void {
    const actual_logs = vm.state.logs.items;
    if (actual_logs.len != expected_logs.len) {
        std.debug.print("Log count mismatch: expected {}, got {}\n", .{ expected_logs.len, actual_logs.len });
        return error.LogCountMismatch;
    }
    
    for (actual_logs, expected_logs, 0..) |actual, expected, i| {
        if (!std.mem.eql(u8, &actual.address, &expected.address)) {
            std.debug.print("Log {} address mismatch\n", .{i});
            return error.LogAddressMismatch;
        }
        
        if (actual.topics.len != expected.topics.len) {
            std.debug.print("Log {} topics count mismatch: expected {}, got {}\n", .{ i, expected.topics.len, actual.topics.len });
            return error.LogTopicsCountMismatch;
        }
        
        for (actual.topics, expected.topics, 0..) |actual_topic, expected_topic, j| {
            if (actual_topic != expected_topic) {
                std.debug.print("Log {} topic {} mismatch\n", .{ i, j });
                return error.LogTopicMismatch;
            }
        }
        
        if (!std.mem.eql(u8, actual.data, expected.data)) {
            std.debug.print("Log {} data mismatch\n", .{i});
            return error.LogDataMismatch;
        }
    }
}

test "hardfork test - block 22906813" {
    const allocator = std.testing.allocator;
    
    // Skip test if data file doesn't exist
    std.fs.cwd().access("test/data/blocks/block-22906813.json", .{}) catch {
        return error.SkipZigTest;
    };
    
    const test_data = try loadTestData(allocator, "test/data/blocks/block-22906813.json");
    defer cleanupTestData(allocator, test_data);
    
    for (test_data.blocks) |block| {
        std.debug.print("Testing block {}\n", .{block.number});
        
        for (block.transactions, 0..) |tx, tx_idx| {
            std.debug.print("  Transaction {}: {x}\n", .{ tx_idx, tx.hash });
            std.debug.print("    From: {x}, To: {?x}, Value: {}, Gas: {}\n", .{ 
                std.fmt.fmtSliceHexLower(&tx.from),
                if (tx.to) |to| std.fmt.fmtSliceHexLower(&to) else std.fmt.fmtSliceHexLower(&[_]u8{}),
                tx.value,
                tx.gas,
            });
            
            var memory_db = MemoryDatabase.init(allocator);
            defer memory_db.deinit();
            
            try seedDatabase(&memory_db, tx.preState);
            
            const db_interface = memory_db.to_database_interface();
            var vm = try Vm.init(allocator, db_interface, null, null);
            defer vm.deinit();
            
            const result = try executeTransaction(allocator, &vm, tx, block);
            
            std.debug.print("    Expected status: {}, Got success: {}\n", .{ tx.receipt.status, result.success });
            std.debug.print("    Expected gas: {}, Got gas: {}\n", .{ tx.receipt.gasUsed, result.gas_used });
            
            if (tx.receipt.status == 1 and !result.success) {
                std.debug.print("    ERROR: Transaction should have succeeded but failed!\n", .{});
                if (tx.input.len > 0) {
                    std.debug.print("    Input data (first 100 bytes): {x}\n", .{
                        std.fmt.fmtSliceHexLower(tx.input[0..@min(100, tx.input.len)])
                    });
                }
            }
            
            try std.testing.expectEqual(tx.receipt.status == 1, result.success);
            
            try verifyGasUsage(result.gas_used, tx.receipt.gasUsed);
            
            try verifyPostState(&memory_db, tx.postState);
            
            try verifyLogs(&vm, tx.receipt.logs);
        }
    }
}

test "hardfork test - block 22906814" {
    const allocator = std.testing.allocator;
    
    // Skip test if data file doesn't exist
    std.fs.cwd().access("test/data/blocks/block-22906814.json", .{}) catch {
        return error.SkipZigTest;
    };
    
    const test_data = try loadTestData(allocator, "test/data/blocks/block-22906814.json");
    defer cleanupTestData(allocator, test_data);
    
    for (test_data.blocks) |block| {
        std.debug.print("Testing block {}\n", .{block.number});
        
        for (block.transactions, 0..) |tx, tx_idx| {
            std.debug.print("  Transaction {}: {x}\n", .{ tx_idx, tx.hash });
            std.debug.print("    From: {x}, To: {?x}, Value: {}, Gas: {}\n", .{ 
                std.fmt.fmtSliceHexLower(&tx.from),
                if (tx.to) |to| std.fmt.fmtSliceHexLower(&to) else std.fmt.fmtSliceHexLower(&[_]u8{}),
                tx.value,
                tx.gas,
            });
            
            var memory_db = MemoryDatabase.init(allocator);
            defer memory_db.deinit();
            
            try seedDatabase(&memory_db, tx.preState);
            
            const db_interface = memory_db.to_database_interface();
            var vm = try Vm.init(allocator, db_interface, null, null);
            defer vm.deinit();
            
            const result = try executeTransaction(allocator, &vm, tx, block);
            
            std.debug.print("    Expected status: {}, Got success: {}\n", .{ tx.receipt.status, result.success });
            std.debug.print("    Expected gas: {}, Got gas: {}\n", .{ tx.receipt.gasUsed, result.gas_used });
            
            if (tx.receipt.status == 1 and !result.success) {
                std.debug.print("    ERROR: Transaction should have succeeded but failed!\n", .{});
                if (tx.input.len > 0) {
                    std.debug.print("    Input data (first 100 bytes): {x}\n", .{
                        std.fmt.fmtSliceHexLower(tx.input[0..@min(100, tx.input.len)])
                    });
                }
            }
            
            try std.testing.expectEqual(tx.receipt.status == 1, result.success);
            
            try verifyGasUsage(result.gas_used, tx.receipt.gasUsed);
            
            try verifyPostState(&memory_db, tx.postState);
            
            try verifyLogs(&vm, tx.receipt.logs);
        }
    }
}

test "hardfork test - all blocks" {
    const allocator = std.testing.allocator;
    
    const block_files = [_][]const u8{
        "test/data/blocks/block-22906813.json",
        "test/data/blocks/block-22906814.json",
        "test/data/blocks/block-22906815.json",
        "test/data/blocks/block-22906816.json",
        "test/data/blocks/block-22906817.json",
        "test/data/blocks/block-22906818.json",
        "test/data/blocks/block-22906819.json",
        "test/data/blocks/block-22906820.json",
        "test/data/blocks/block-22906821.json",
        "test/data/blocks/block-22906822.json",
    };
    
    for (block_files) |file_path| {
        std.debug.print("\nTesting file: {s}\n", .{file_path});
        
        // Skip test if data file doesn't exist
        std.fs.cwd().access(file_path, .{}) catch {
            std.debug.print("  Skipping (file not found)\n", .{});
            continue;
        };
        
        const test_data = try loadTestData(allocator, file_path);
        defer cleanupTestData(allocator, test_data);
        
        for (test_data.blocks) |block| {
            std.debug.print("Testing block {}\n", .{block.number});
            
            for (block.transactions, 0..) |tx, tx_idx| {
                std.debug.print("  Transaction {}: {x}\n", .{ tx_idx, tx.hash });
                std.debug.print("    From: {x}, To: {?x}, Value: {}, Gas: {}\n", .{ 
                    std.fmt.fmtSliceHexLower(&tx.from),
                    if (tx.to) |to| std.fmt.fmtSliceHexLower(&to) else std.fmt.fmtSliceHexLower(&[_]u8{}),
                    tx.value,
                    tx.gas,
                });
                
                var memory_db = MemoryDatabase.init(allocator);
                defer memory_db.deinit();
                
                try seedDatabase(&memory_db, tx.preState);
                
                const db_interface = memory_db.to_database_interface();
                var vm = try Vm.init(allocator, db_interface, null, null);
                defer vm.deinit();
                
                const result = try executeTransaction(allocator, &vm, tx, block);
                
                std.debug.print("    Expected status: {}, Got success: {}\n", .{ tx.receipt.status, result.success });
                std.debug.print("    Expected gas: {}, Got gas: {}\n", .{ tx.receipt.gasUsed, result.gas_used });
                
                if (tx.receipt.status == 1 and !result.success) {
                    std.debug.print("    ERROR: Transaction should have succeeded but failed!\n", .{});
                    if (tx.input.len > 0) {
                        std.debug.print("    Input data (first 100 bytes): {x}\n", .{
                            std.fmt.fmtSliceHexLower(tx.input[0..@min(100, tx.input.len)])
                        });
                    }
                }
                
                try std.testing.expectEqual(tx.receipt.status == 1, result.success);
                
                try verifyGasUsage(result.gas_used, tx.receipt.gasUsed);
                
                try verifyPostState(&memory_db, tx.postState);
                
                try verifyLogs(&vm, tx.receipt.logs);
            }
        }
    }
}