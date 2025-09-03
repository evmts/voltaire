const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");

const Runner = @This();

allocator: std.mem.Allocator,
database: *evm.Database,
block_info: evm.BlockInfo,
tx_context: evm.TransactionContext,
caller_address: primitives.Address,
verbose: bool,

pub const RunnerError = error{
    InvalidHexCharacter,
    ContractNotFound,
    ExecutionFailed,
    OutputMismatch,
    GasTooLow,
    DeploymentFailed,
    AllocationError,
};

pub const RunnerConfig = struct {
    verbose: bool = false,
    min_gas: ?u64 = null,
    expected_output: ?[]const u8 = null,
};

pub fn init(allocator: std.mem.Allocator, verbose: bool) !Runner {
    // Create database
    var database = try allocator.create(evm.Database);
    database.* = evm.Database.init(allocator);
    
    // Setup caller with large balance
    const caller_address = primitives.Address{ .bytes = [_]u8{0x10} ++ [_]u8{0} ** 18 ++ [_]u8{0x01} };
    try database.set_account(caller_address.bytes, .{
        .balance = std.math.maxInt(u256),
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    // Setup block info and transaction context
    const block_info = evm.BlockInfo{
        .chain_id = 1,
        .number = 20_000_000,
        .timestamp = 1_800_000_000,
        .difficulty = 0,
        .gas_limit = 2_100_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 7,
        .prev_randao = [_]u8{0} ** 32,
        .blob_base_fee = 1000000000,
        .blob_versioned_hashes = &.{},
    };
    
    const tx_context = evm.TransactionContext{
        .gas_limit = 2_100_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    return Runner{
        .allocator = allocator,
        .database = database,
        .block_info = block_info,
        .tx_context = tx_context,
        .caller_address = caller_address,
        .verbose = verbose,
    };
}

pub fn deinit(self: *Runner) void {
    self.database.deinit();
    self.allocator.destroy(self.database);
}

pub fn deployContract(self: *Runner, init_code: []const u8) !struct { address: primitives.Address, runtime_code: []const u8 } {
    if (self.verbose) {
        std.debug.print("Bytecode len={} (attempting CREATE first)\n", .{init_code.len});
    }
    
    // Try CREATE deployment first
    var deploy_evm = try evm.Evm(.{}).init(self.allocator, self.database, self.block_info, self.tx_context, 0, self.caller_address, .CANCUN);
    defer deploy_evm.deinit();
    
    const create_params = evm.CallParams{ 
        .create = .{ 
            .caller = self.caller_address, 
            .value = 0, 
            .init_code = init_code, 
            .gas = 500_000_000 
        } 
    };
    
    const deploy_result = deploy_evm.call(create_params);
    
    if (self.verbose) {
        std.debug.print("CREATE result: success={}, output_len={}, gas_left={}\n", .{ 
            deploy_result.success, 
            deploy_result.output.len, 
            deploy_result.gas_left 
        });
    }
    
    if (deploy_result.success) {
        // For CREATE, we need to get the code from the created contract
        const contract_address = primitives.Address.get_contract_address(self.caller_address, 0);
        const created_account = self.database.get_account(contract_address.bytes) catch null;
        
        if (created_account) |acc| {
            const code = self.database.get_code(acc.code_hash) catch null;
            if (code) |c| {
                if (c.len > 0) {
                    if (self.verbose) {
                        std.debug.print("Found deployed contract code: len={}\n", .{c.len});
                    }
                    return .{ .address = contract_address, .runtime_code = c };
                }
            }
        }
    }
    
    // Fallback: treat provided code as runtime and install directly
    if (self.verbose) {
        std.debug.print("CREATE failed or returned no code; installing as runtime\n", .{});
    }
    
    // Ensure we have valid code before installing
    if (init_code.len == 0) {
        return RunnerError.DeploymentFailed;
    }
    
    const contract_address = primitives.Address{ .bytes = [_]u8{0x42} ++ [_]u8{0} ** 19 };
    const code_hash = try self.database.set_code(init_code);
    try self.database.set_account(contract_address.bytes, .{
        .balance = 0,
        .nonce = 1,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    // Retrieve the code from the database to ensure we're using the database's copy
    const stored_code = try self.database.get_code(code_hash);
    return .{ .address = contract_address, .runtime_code = stored_code };
}

pub const BenchmarkResult = struct {
    success: bool,
    duration_ms: f64,
    gas_used: u64,
    output: []const u8,
};

pub fn runBenchmark(
    self: *Runner,
    contract_address: primitives.Address,
    calldata: []const u8,
    config: RunnerConfig,
) !BenchmarkResult {
    // Create EVM instance for benchmark execution
    var evm_instance = try evm.Evm(.{}).init(
        self.allocator,
        self.database,
        self.block_info,
        self.tx_context,
        0,
        self.caller_address,
        .CANCUN,
    );
    defer evm_instance.deinit();
    
    // Setup call parameters
    const provided_gas: u64 = 1_000_000_000;
    const call_params = evm.CallParams{
        .call = .{
            .caller = self.caller_address,
            .to = contract_address,
            .value = 0,
            .input = calldata,
            .gas = provided_gas,
        },
    };
    
    // Measure execution time
    const start = std.time.Instant.now() catch return RunnerError.ExecutionFailed;
    const result = evm_instance.call(call_params);
    const end = std.time.Instant.now() catch return RunnerError.ExecutionFailed;
    
    if (!result.success) {
        if (self.verbose) {
            std.debug.print("❌ Execution failed: gas_left={}, output_len={}\n", .{ 
                result.gas_left, 
                result.output.len 
            });
            if (result.error_info) |err_info| {
                std.debug.print("Error info: {s}\n", .{err_info});
            }
        }
        return RunnerError.ExecutionFailed;
    }
    
    // Calculate duration in milliseconds
    const duration_ns = end.since(start);
    const duration_ms = @as(f64, @floatFromInt(duration_ns)) / 1_000_000.0;
    
    // Calculate gas used
    const gas_used: u64 = if (result.gas_left <= provided_gas) 
        (provided_gas - result.gas_left) 
    else 
        0;
    
    // Check expected output if provided
    if (config.expected_output) |expected| {
        if (!std.mem.eql(u8, result.output, expected)) {
            if (self.verbose) {
                std.debug.print("❌ Output mismatch\n", .{});
                std.debug.print("  Expected: {x}\n", .{expected});
                std.debug.print("  Got:      {x}\n", .{result.output});
            }
            return RunnerError.OutputMismatch;
        }
    }
    
    // Check minimum gas if provided
    if (config.min_gas) |min_gas| {
        if (gas_used < min_gas) {
            if (self.verbose) {
                std.debug.print("❌ Gas too low: used={}, expected_at_least={}\n", .{ 
                    gas_used, 
                    min_gas 
                });
            }
            return RunnerError.GasTooLow;
        }
    }
    
    return BenchmarkResult{
        .success = true,
        .duration_ms = duration_ms,
        .gas_used = gas_used,
        .output = result.output,
    };
}

pub fn hexDecode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    // Trim all whitespace including newlines first
    const trimmed_input = std.mem.trim(u8, hex_str, " \t\n\r");
    
    const clean_hex = if (std.mem.startsWith(u8, trimmed_input, "0x")) 
        trimmed_input[2..] 
    else 
        trimmed_input;
    
    if (clean_hex.len == 0) {
        return allocator.alloc(u8, 0);
    }
    
    // Check for odd length
    if (clean_hex.len % 2 != 0) {
        return RunnerError.InvalidHexCharacter;
    }
    
    const result = try allocator.alloc(u8, clean_hex.len / 2);
    
    var i: usize = 0;
    while (i < clean_hex.len) : (i += 2) {
        const byte_str = clean_hex[i .. i + 2];
        result[i / 2] = std.fmt.parseInt(u8, byte_str, 16) catch {
            allocator.free(result);
            return RunnerError.InvalidHexCharacter;
        };
    }
    
    return result;
}