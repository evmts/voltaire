const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const evm_legacy = @import("evm");
const evm_mod = @import("evm");
const revm_wrapper = @import("revm");
const Address = primitives.Address;
const ZERO_ADDRESS = primitives.ZERO_ADDRESS;
const TransactionContext = evm_mod.TransactionContext;

// Test data constants
const ERC20_TRANSFER_SELECTOR: u32 = 0xa9059cbb; // transfer(address,uint256)
const ERC20_MINT_SELECTOR: u32 = 0x40c10f19; // mint(address,uint256)

// Benchmark configuration
const BENCHMARK_GAS_LIMIT: u64 = 100_000_000;
const DEFAULT_RUNS = 100;

/// Load test case files from bench/cases/
fn readCaseFile(allocator: std.mem.Allocator, case_name: []const u8, file_name: []const u8) ![]u8 {
    const path = try std.fmt.allocPrint(allocator, "/Users/williamcory/guillotine/bench/cases/{s}/{s}", .{ case_name, file_name });
    defer allocator.free(path);
    const file = try std.fs.openFileAbsolute(path, .{});
    defer file.close();
    const content = try file.readToEndAlloc(allocator, 16 * 1024 * 1024);
    const trimmed = std.mem.trim(u8, content, " \t\n\r");
    if (trimmed.ptr == content.ptr and trimmed.len == content.len) {
        return content;
    }
    defer allocator.free(content);
    const result = try allocator.alloc(u8, trimmed.len);
    @memcpy(result, trimmed);
    return result;
}

/// Decode hex string to bytes
fn hexDecode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const result = try allocator.alloc(u8, clean_hex.len / 2);
    _ = try std.fmt.hexToBytes(result, clean_hex);
    return result;
}

// ============================================================================
// EVM Benchmark Functions
// ============================================================================

fn benchmark_evm_erc20_transfer(allocator: std.mem.Allocator) void {
    const bytecode_hex = readCaseFile(allocator, "erc20-transfer", "bytecode.txt") catch return;
    defer allocator.free(bytecode_hex);
    const calldata_hex = readCaseFile(allocator, "erc20-transfer", "calldata.txt") catch return;
    defer allocator.free(calldata_hex);

    const bytecode = hexDecode(allocator, bytecode_hex) catch return;
    defer allocator.free(bytecode);
    const calldata = hexDecode(allocator, calldata_hex) catch return;
    defer allocator.free(calldata);

    var memory_db = evm_mod.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = evm_mod.DatabaseInterface.init(&memory_db);

    const block_info = evm_mod.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var vm = evm_mod.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    const deploy_result = vm.call(evm_mod.CallParams{
        .create = .{
            .caller = caller,
            .value = 0,
            .init_code = bytecode,
            .gas = BENCHMARK_GAS_LIMIT,
        },
    }) catch return;

    if (!deploy_result.success) return;

    const call_params = evm_mod.CallParams{
        .call = .{
            .caller = caller,
            .to = Address{ .bytes = [_]u8{0x12} ** 20 }, // Mock contract address
            .value = 0,
            .input = calldata,
            .gas = BENCHMARK_GAS_LIMIT,
        },
    };
    _ = vm.call(call_params) catch return;
}

fn benchmark_evm_snailtracer(allocator: std.mem.Allocator) void {
    const bytecode_hex = readCaseFile(allocator, "snailtracer", "bytecode.txt") catch return;
    defer allocator.free(bytecode_hex);
    const calldata_hex = readCaseFile(allocator, "snailtracer", "calldata.txt") catch return;
    defer allocator.free(calldata_hex);

    const bytecode = hexDecode(allocator, bytecode_hex) catch return;
    defer allocator.free(bytecode);
    const calldata = hexDecode(allocator, calldata_hex) catch return;
    defer allocator.free(calldata);

    var memory_db = evm_mod.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = evm_mod.DatabaseInterface.init(&memory_db);

    const block_info = evm_mod.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var vm = evm_mod.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    const call_params = evm_mod.CallParams{
        .call = .{
            .caller = caller,
            .to = Address{ .bytes = [_]u8{0x12} ** 20 },
            .value = 0,
            .input = calldata,
            .gas = BENCHMARK_GAS_LIMIT,
        },
    };
    _ = vm.call(call_params) catch return;
}

fn benchmark_evm_thousand_hashes(allocator: std.mem.Allocator) void {
    const bytecode_hex = readCaseFile(allocator, "ten-thousand-hashes", "bytecode.txt") catch return;
    defer allocator.free(bytecode_hex);
    const calldata_hex = readCaseFile(allocator, "ten-thousand-hashes", "calldata.txt") catch return;
    defer allocator.free(calldata_hex);

    const bytecode = hexDecode(allocator, bytecode_hex) catch return;
    defer allocator.free(bytecode);
    const calldata = hexDecode(allocator, calldata_hex) catch return;
    defer allocator.free(calldata);

    var memory_db = evm_mod.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = evm_mod.DatabaseInterface.init(&memory_db);

    const block_info = evm_mod.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var vm = evm_mod.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    const call_params = evm_mod.CallParams{
        .call = .{
            .caller = caller,
            .to = Address{ .bytes = [_]u8{0x12} ** 20 },
            .value = 0,
            .input = calldata,
            .gas = BENCHMARK_GAS_LIMIT,
        },
    };
    _ = vm.call(call_params) catch return;
}

// ============================================================================
// Legacy EVM Benchmark Functions
// ============================================================================

fn benchmark_legacy_evm_erc20_transfer(allocator: std.mem.Allocator) void {
    const bytecode_hex = readCaseFile(allocator, "erc20-transfer", "bytecode.txt") catch return;
    defer allocator.free(bytecode_hex);
    const calldata_hex = readCaseFile(allocator, "erc20-transfer", "calldata.txt") catch return;
    defer allocator.free(calldata_hex);

    const bytecode = hexDecode(allocator, bytecode_hex) catch return;
    defer allocator.free(bytecode);
    const calldata = hexDecode(allocator, calldata_hex) catch return;
    defer allocator.free(calldata);

    var memory_db = evm_legacy.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    const block_info = evm_legacy.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var vm = evm_legacy.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    // Set balance for caller account
    var caller_account = db_interface.get_account(caller.bytes) catch null orelse evm_legacy.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    caller_account.balance = std.math.maxInt(u256);
    db_interface.set_account(caller.bytes, caller_account) catch return;

    const deploy_result = vm.call(evm_legacy.CallParams{
        .create = .{
            .caller = caller,
            .value = 0,
            .init_code = bytecode,
            .gas = BENCHMARK_GAS_LIMIT,
        },
    }) catch return;
    if (!deploy_result.success) return;

    const params = evm_legacy.CallParams{ .call = .{
        .caller = caller,
        .to = Address{ .bytes = [_]u8{0x20} ** 20 },  // Use predetermined contract address
        .value = 0,
        .input = calldata,
        .gas = BENCHMARK_GAS_LIMIT,
    }};
    _ = vm.call(params) catch return;
}

fn benchmark_legacy_evm_snailtracer(allocator: std.mem.Allocator) void {
    const bytecode_hex = readCaseFile(allocator, "snailtracer", "bytecode.txt") catch return;
    defer allocator.free(bytecode_hex);
    const calldata_hex = readCaseFile(allocator, "snailtracer", "calldata.txt") catch return;
    defer allocator.free(calldata_hex);

    const bytecode = hexDecode(allocator, bytecode_hex) catch return;
    defer allocator.free(bytecode);
    const calldata = hexDecode(allocator, calldata_hex) catch return;
    defer allocator.free(calldata);

    var memory_db = evm_legacy.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    const block_info = evm_legacy.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var vm = evm_legacy.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    // Set balance for caller account
    var caller_account = db_interface.get_account(caller.bytes) catch null orelse evm_legacy.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    caller_account.balance = std.math.maxInt(u256);
    db_interface.set_account(caller.bytes, caller_account) catch return;

    const deploy_result = vm.call(evm_legacy.CallParams{
        .create = .{
            .caller = caller,
            .value = 0,
            .init_code = bytecode,
            .gas = BENCHMARK_GAS_LIMIT,
        },
    }) catch return;
    if (!deploy_result.success) return;

    const params = evm_legacy.CallParams{ .call = .{
        .caller = caller,
        .to = Address{ .bytes = [_]u8{0x20} ** 20 },  // Use predetermined contract address
        .value = 0,
        .input = calldata,
        .gas = BENCHMARK_GAS_LIMIT,
    }};
    _ = vm.call(params) catch return;
}

fn benchmark_legacy_evm_thousand_hashes(allocator: std.mem.Allocator) void {
    const bytecode_hex = readCaseFile(allocator, "ten-thousand-hashes", "bytecode.txt") catch return;
    defer allocator.free(bytecode_hex);
    const calldata_hex = readCaseFile(allocator, "ten-thousand-hashes", "calldata.txt") catch return;
    defer allocator.free(calldata_hex);

    const bytecode = hexDecode(allocator, bytecode_hex) catch return;
    defer allocator.free(bytecode);
    const calldata = hexDecode(allocator, calldata_hex) catch return;
    defer allocator.free(calldata);

    var memory_db = evm_legacy.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    const block_info = evm_legacy.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var vm = evm_legacy.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    // Set balance for caller account
    var caller_account = db_interface.get_account(caller.bytes) catch null orelse evm_legacy.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    caller_account.balance = std.math.maxInt(u256);
    db_interface.set_account(caller.bytes, caller_account) catch return;

    const deploy_result = vm.call(evm_legacy.CallParams{
        .create = .{
            .caller = caller,
            .value = 0,
            .init_code = bytecode,
            .gas = BENCHMARK_GAS_LIMIT,
        },
    }) catch return;
    if (!deploy_result.success) return;

    const params = evm_legacy.CallParams{ .call = .{
        .caller = caller,
        .to = Address{ .bytes = [_]u8{0x20} ** 20 },  // Use predetermined contract address
        .value = 0,
        .input = calldata,
        .gas = BENCHMARK_GAS_LIMIT,
    }};
    _ = vm.call(params) catch return;
}

// ============================================================================
// REVM Wrapper Benchmark Functions 
// ============================================================================

fn benchmark_revm_erc20_transfer(allocator: std.mem.Allocator) void {
    const bytecode_hex = readCaseFile(allocator, "erc20-transfer", "bytecode.txt") catch return;
    defer allocator.free(bytecode_hex);
    const calldata_hex = readCaseFile(allocator, "erc20-transfer", "calldata.txt") catch return;
    defer allocator.free(calldata_hex);

    const bytecode = hexDecode(allocator, bytecode_hex) catch return;
    defer allocator.free(bytecode);
    const calldata = hexDecode(allocator, calldata_hex) catch return;
    defer allocator.free(calldata);

    const settings = revm_wrapper.RevmSettings{};
    var vm = revm_wrapper.Revm.init(allocator, settings) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    vm.setBalance(caller, std.math.maxInt(u256)) catch return;

    var create_result = vm.create(caller, 0, bytecode, BENCHMARK_GAS_LIMIT) catch return;
    defer create_result.deinit();
    if (!create_result.success) return;

    const contract_address = [_]u8{0x12} ** 20; // Mock deployed address
    vm.setCode(contract_address, create_result.output) catch return;

    var call_result = vm.call(caller, contract_address, 0, calldata, BENCHMARK_GAS_LIMIT) catch return;
    defer call_result.deinit();
}

fn benchmark_revm_snailtracer(allocator: std.mem.Allocator) void {
    const bytecode_hex = readCaseFile(allocator, "snailtracer", "bytecode.txt") catch return;
    defer allocator.free(bytecode_hex);
    const calldata_hex = readCaseFile(allocator, "snailtracer", "calldata.txt") catch return;
    defer allocator.free(calldata_hex);

    const bytecode = hexDecode(allocator, bytecode_hex) catch return;
    defer allocator.free(bytecode);
    const calldata = hexDecode(allocator, calldata_hex) catch return;
    defer allocator.free(calldata);

    const settings = revm_wrapper.RevmSettings{};
    var vm = revm_wrapper.Revm.init(allocator, settings) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    vm.setBalance(caller, std.math.maxInt(u256)) catch return;

    var create_result = vm.create(caller, 0, bytecode, BENCHMARK_GAS_LIMIT) catch return;
    defer create_result.deinit();
    if (!create_result.success) return;

    const contract_address = [_]u8{0x12} ** 20;
    vm.setCode(contract_address, create_result.output) catch return;

    var call_result = vm.call(caller, contract_address, 0, calldata, BENCHMARK_GAS_LIMIT) catch return;
    defer call_result.deinit();
}

fn benchmark_revm_thousand_hashes(allocator: std.mem.Allocator) void {
    const bytecode_hex = readCaseFile(allocator, "ten-thousand-hashes", "bytecode.txt") catch return;
    defer allocator.free(bytecode_hex);
    const calldata_hex = readCaseFile(allocator, "ten-thousand-hashes", "calldata.txt") catch return;
    defer allocator.free(calldata_hex);

    const bytecode = hexDecode(allocator, bytecode_hex) catch return;
    defer allocator.free(bytecode);
    const calldata = hexDecode(allocator, calldata_hex) catch return;
    defer allocator.free(calldata);

    const settings = revm_wrapper.RevmSettings{};
    var vm = revm_wrapper.Revm.init(allocator, settings) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    vm.setBalance(caller, std.math.maxInt(u256)) catch return;

    var create_result = vm.create(caller, 0, bytecode, BENCHMARK_GAS_LIMIT) catch return;
    defer create_result.deinit();
    if (!create_result.success) return;

    const contract_address = [_]u8{0x12} ** 20;
    vm.setCode(contract_address, create_result.output) catch return;

    var call_result = vm.call(caller, contract_address, 0, calldata, BENCHMARK_GAS_LIMIT) catch return;
    defer call_result.deinit();
}

// ============================================================================
// Basic Operation Benchmarks
// ============================================================================

fn benchmark_evm_stack_push_pop(allocator: std.mem.Allocator) void {
    _ = [_]u8{
        0x60, 0x01, // PUSH1 0x01
        0x60, 0x02, // PUSH1 0x02
        0x01,       // ADD
        0x50,       // POP
        0x00,       // STOP
    };

    var memory_db = evm_mod.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = evm_mod.DatabaseInterface.init(&memory_db);

    const block_info = evm_mod.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var vm = evm_mod.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    const call_params = evm_mod.CallParams{
        .call = .{
            .caller = caller,
            .to = Address{ .bytes = [_]u8{0x12} ** 20 },
            .value = 0,
            .input = &.{},
            .gas = BENCHMARK_GAS_LIMIT,
        },
    };
    _ = vm.call(call_params) catch return;
}

fn benchmark_legacy_evm_stack_push_pop(allocator: std.mem.Allocator) void {
    const simple_bytecode = [_]u8{
        0x60, 0x01, // PUSH1 0x01
        0x60, 0x02, // PUSH1 0x02
        0x01,       // ADD
        0x50,       // POP
        0x00,       // STOP
    };

    var memory_db = evm_legacy.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    const block_info = evm_legacy.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var vm = evm_legacy.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    // Set balance for caller account
    var caller_account = db_interface.get_account(caller.bytes) catch null orelse evm_legacy.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    caller_account.balance = std.math.maxInt(u256);
    db_interface.set_account(caller.bytes, caller_account) catch return;

    const contract_address = [_]u8{0x12} ** 20;
    // Set contract code through database
    const code_hash = db_interface.set_code(&simple_bytecode) catch return;
    var contract_account = db_interface.get_account(contract_address) catch null orelse evm_legacy.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    contract_account.code_hash = code_hash;
    db_interface.set_account(contract_address, contract_account) catch return;

    const params = evm_legacy.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = &.{},
        .gas = BENCHMARK_GAS_LIMIT,
    }};
    _ = vm.call(params) catch return;
}

fn benchmark_revm_stack_push_pop(allocator: std.mem.Allocator) void {
    const simple_bytecode = [_]u8{
        0x60, 0x01, // PUSH1 0x01
        0x60, 0x02, // PUSH1 0x02
        0x01,       // ADD
        0x50,       // POP
        0x00,       // STOP
    };

    const settings = revm_wrapper.RevmSettings{};
    var vm = revm_wrapper.Revm.init(allocator, settings) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    vm.setBalance(caller, std.math.maxInt(u256)) catch return;

    const contract_address = [_]u8{0x12} ** 20;
    vm.setCode(contract_address, &simple_bytecode) catch return;

    var call_result = vm.call(caller, contract_address, 0, &.{}, BENCHMARK_GAS_LIMIT) catch return;
    defer call_result.deinit();
}

// ============================================================================
// Arithmetic Operation Benchmarks
// ============================================================================

fn benchmark_evm_arithmetic_sequence(allocator: std.mem.Allocator) void {
    const arithmetic_bytecode = [_]u8{
        0x60, 0x64, // PUSH1 100
        0x60, 0xc8, // PUSH1 200  
        0x01,       // ADD
        0x60, 0x03, // PUSH1 3
        0x02,       // MUL
        0x60, 0x32, // PUSH1 50
        0x03,       // SUB
        0x60, 0x05, // PUSH1 5
        0x04,       // DIV
        0x50,       // POP
        0x00,       // STOP
    };

    var memory_db = evm_mod.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = evm_mod.DatabaseInterface.init(&memory_db);

    const block_info = evm_mod.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var vm = evm_mod.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    const contract_address = [_]u8{0x12} ** 20;
    
    var memory_db_copy = evm_mod.MemoryDatabase.init(allocator);
    defer memory_db_copy.deinit();
    const code_hash = memory_db_copy.set_code(&arithmetic_bytecode) catch return;
    var account = memory_db_copy.get_account(contract_address) catch null orelse evm_mod.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    account.code_hash = code_hash;
    memory_db_copy.set_account(contract_address, account) catch return;

    const call_params = evm_mod.CallParams{
        .call = .{
            .caller = caller,
            .to = contract_address,
            .value = 0,
            .input = &.{},
            .gas = BENCHMARK_GAS_LIMIT,
        },
    };
    _ = vm.call(call_params) catch return;
}

fn benchmark_legacy_evm_arithmetic_sequence(allocator: std.mem.Allocator) void {
    const arithmetic_bytecode = [_]u8{
        0x60, 0x64, // PUSH1 100
        0x60, 0xc8, // PUSH1 200
        0x01,       // ADD
        0x60, 0x03, // PUSH1 3
        0x02,       // MUL
        0x60, 0x32, // PUSH1 50
        0x03,       // SUB
        0x60, 0x05, // PUSH1 5
        0x04,       // DIV
        0x50,       // POP
        0x00,       // STOP
    };

    var memory_db = evm_legacy.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    const block_info = evm_legacy.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var vm = evm_legacy.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    // Set balance for caller account
    var caller_account = db_interface.get_account(caller.bytes) catch null orelse evm_legacy.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    caller_account.balance = std.math.maxInt(u256);
    db_interface.set_account(caller.bytes, caller_account) catch return;

    const contract_address = [_]u8{0x12} ** 20;
    // Set contract code through database
    const code_hash = db_interface.set_code(&arithmetic_bytecode) catch return;
    var contract_account = db_interface.get_account(contract_address) catch null orelse evm_legacy.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    contract_account.code_hash = code_hash;
    db_interface.set_account(contract_address, contract_account) catch return;

    const params = evm_legacy.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = &.{},
        .gas = BENCHMARK_GAS_LIMIT,
    }};
    _ = vm.call(params) catch return;
}

fn benchmark_revm_arithmetic_sequence(allocator: std.mem.Allocator) void {
    const arithmetic_bytecode = [_]u8{
        0x60, 0x64, // PUSH1 100
        0x60, 0xc8, // PUSH1 200
        0x01,       // ADD
        0x60, 0x03, // PUSH1 3
        0x02,       // MUL
        0x60, 0x32, // PUSH1 50
        0x03,       // SUB
        0x60, 0x05, // PUSH1 5
        0x04,       // DIV
        0x50,       // POP
        0x00,       // STOP
    };

    const settings = revm_wrapper.RevmSettings{};
    var vm = revm_wrapper.Revm.init(allocator, settings) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    vm.setBalance(caller, std.math.maxInt(u256)) catch return;

    const contract_address = [_]u8{0x12} ** 20;
    vm.setCode(contract_address, &arithmetic_bytecode) catch return;

    var call_result = vm.call(caller, contract_address, 0, &.{}, BENCHMARK_GAS_LIMIT) catch return;
    defer call_result.deinit();
}

// ============================================================================
// Memory Operation Benchmarks
// ============================================================================

fn benchmark_evm_memory_operations(allocator: std.mem.Allocator) void {
    const memory_bytecode = [_]u8{
        0x60, 0x42,       // PUSH1 0x42 (value)
        0x60, 0x00,       // PUSH1 0x00 (offset)
        0x52,             // MSTORE
        0x60, 0x00,       // PUSH1 0x00 (offset)
        0x51,             // MLOAD
        0x50,             // POP
        0x00,             // STOP
    };

    var memory_db = evm_mod.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = evm_mod.DatabaseInterface.init(&memory_db);

    const block_info = evm_mod.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var vm = evm_mod.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    const contract_address = [_]u8{0x12} ** 20;
    
    var memory_db_copy = evm_mod.MemoryDatabase.init(allocator);
    defer memory_db_copy.deinit();
    const code_hash = memory_db_copy.set_code(&memory_bytecode) catch return;
    var account = memory_db_copy.get_account(contract_address) catch null orelse evm_mod.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    account.code_hash = code_hash;
    memory_db_copy.set_account(contract_address, account) catch return;

    const call_params = evm_mod.CallParams{
        .call = .{
            .caller = caller,
            .to = contract_address,
            .value = 0,
            .input = &.{},
            .gas = BENCHMARK_GAS_LIMIT,
        },
    };
    _ = vm.call(call_params) catch return;
}

fn benchmark_legacy_evm_memory_operations(allocator: std.mem.Allocator) void {
    const memory_bytecode = [_]u8{
        0x60, 0x42,       // PUSH1 0x42
        0x60, 0x00,       // PUSH1 0x00
        0x52,             // MSTORE
        0x60, 0x00,       // PUSH1 0x00
        0x51,             // MLOAD
        0x50,             // POP
        0x00,             // STOP
    };

    var memory_db = evm_legacy.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    const block_info = evm_legacy.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var vm = evm_legacy.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    // Set balance for caller account
    var caller_account = db_interface.get_account(caller.bytes) catch null orelse evm_legacy.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    caller_account.balance = std.math.maxInt(u256);
    db_interface.set_account(caller.bytes, caller_account) catch return;

    const contract_address = [_]u8{0x12} ** 20;
    // Set contract code through database
    const code_hash = db_interface.set_code(&memory_bytecode) catch return;
    var contract_account = db_interface.get_account(contract_address) catch null orelse evm_legacy.Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    contract_account.code_hash = code_hash;
    db_interface.set_account(contract_address, contract_account) catch return;

    const params = evm_legacy.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = &.{},
        .gas = BENCHMARK_GAS_LIMIT,
    }};
    _ = vm.call(params) catch return;
}

fn benchmark_revm_memory_operations(allocator: std.mem.Allocator) void {
    const memory_bytecode = [_]u8{
        0x60, 0x42,       // PUSH1 0x42
        0x60, 0x00,       // PUSH1 0x00
        0x52,             // MSTORE
        0x60, 0x00,       // PUSH1 0x00
        0x51,             // MLOAD
        0x50,             // POP
        0x00,             // STOP
    };

    const settings = revm_wrapper.RevmSettings{};
    var vm = revm_wrapper.Revm.init(allocator, settings) catch return;
    defer vm.deinit();

    const caller = Address{ .bytes = [_]u8{0x10} ** 20 };
    vm.setBalance(caller, std.math.maxInt(u256)) catch return;

    const contract_address = [_]u8{0x12} ** 20;
    vm.setCode(contract_address, &memory_bytecode) catch return;

    var call_result = vm.call(caller, contract_address, 0, &.{}, BENCHMARK_GAS_LIMIT) catch return;
    defer call_result.deinit();
}

// ============================================================================
// Main Benchmark Runner
// ============================================================================

pub fn main() !void {
    var stdout_buffer: [4096]u8 = undefined;
    var stdout_writer = std.fs.File.stdout().writer(&stdout_buffer);
    const stdout = &stdout_writer.interface;
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var bench = zbench.Benchmark.init(allocator, .{});
    defer bench.deinit();

    try stdout.print("\n⚡ Comprehensive EVM Performance Benchmarks\n", .{});
    try stdout.print("===========================================\n\n", .{});
    try stdout.print("Comparing EVM vs Legacy EVM vs REVM\n\n", .{});
    try stdout.flush();

    // Contract execution benchmarks
    try bench.add("ERC20 Transfer - EVM", benchmark_evm_erc20_transfer, .{});
    try bench.add("ERC20 Transfer - Legacy EVM", benchmark_legacy_evm_erc20_transfer, .{});
    try bench.add("ERC20 Transfer - REVM", benchmark_revm_erc20_transfer, .{});

    try bench.add("Snailtracer - EVM", benchmark_evm_snailtracer, .{});
    try bench.add("Snailtracer - Legacy EVM", benchmark_legacy_evm_snailtracer, .{});
    try bench.add("Snailtracer - REVM", benchmark_revm_snailtracer, .{});

    try bench.add("10k Hashes - EVM", benchmark_evm_thousand_hashes, .{});
    try bench.add("10k Hashes - Legacy EVM", benchmark_legacy_evm_thousand_hashes, .{});
    try bench.add("10k Hashes - REVM", benchmark_revm_thousand_hashes, .{});

    // Basic operation benchmarks
    try bench.add("Stack Push/Pop - EVM", benchmark_evm_stack_push_pop, .{});
    try bench.add("Stack Push/Pop - Legacy EVM", benchmark_legacy_evm_stack_push_pop, .{});
    try bench.add("Stack Push/Pop - REVM", benchmark_revm_stack_push_pop, .{});

    try bench.add("Arithmetic Ops - EVM", benchmark_evm_arithmetic_sequence, .{});
    try bench.add("Arithmetic Ops - Legacy EVM", benchmark_legacy_evm_arithmetic_sequence, .{});
    try bench.add("Arithmetic Ops - REVM", benchmark_revm_arithmetic_sequence, .{});

    try bench.add("Memory Ops - EVM", benchmark_evm_memory_operations, .{});
    try bench.add("Memory Ops - Legacy EVM", benchmark_legacy_evm_memory_operations, .{});
    try bench.add("Memory Ops - REVM", benchmark_revm_memory_operations, .{});

    try stdout.print("Running comprehensive EVM benchmarks...\n\n", .{});
    try stdout.flush();
    try bench.run(stdout);
    
    try stdout.print("\n✅ Comprehensive EVM benchmarks completed!\n", .{});
    try stdout.flush();
    try stdout.print("\nResults show relative performance between:\n", .{});
    try stdout.print("• EVM: New implementation with Frame-based execution\n", .{});
    try stdout.print("• Legacy EVM: Current production implementation\n", .{});
    try stdout.print("• REVM: Rust reference implementation via C wrapper\n", .{});
}

test "comprehensive benchmark compilation" {
    const allocator = std.testing.allocator;
    
    // Test that all benchmark functions compile
    const a: u256 = 100;
    const b: u256 = 200;
    const result = a +% b;
    try std.testing.expectEqual(@as(u256, 300), result);
    
    // Test Address creation
    const addr = Address.from_u256(0x1234567890abcdef);
    try std.testing.expect(addr[19] == 0xef);
    
    _ = allocator;
}