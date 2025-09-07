const std = @import("std");
const log = @import("../log.zig");
const evm = @import("root.zig");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const Log = @import("call_result.zig").Log;

pub const FixtureRunner = struct {
    allocator: std.mem.Allocator,
    database: *evm.Database,
    evm_instance: *evm.DefaultEvm,
    
    const Self = @This();
    
    pub fn init(allocator: std.mem.Allocator) !Self {
        const database = try allocator.create(evm.Database);
        database.* = evm.Database.init(allocator);
        errdefer {
            database.deinit();
            allocator.destroy(database);
        }
        
        const block_info = evm.BlockInfo{
            .chain_id = 1,
            .number = 1,
            .timestamp = 1000,
            .difficulty = 100,
            .gas_limit = 30000000,
            .coinbase = primitives.ZERO_ADDRESS,
            .base_fee = 1000000000,
            .prev_randao = [_]u8{0} ** 32,
            .blob_base_fee = 1000000000,
            .blob_versioned_hashes = &.{},
        };

        const context = evm.TransactionContext{
            .gas_limit = 30000000,
            .coinbase = primitives.ZERO_ADDRESS,
            .chain_id = 1,
        };
        
        const evm_instance = try allocator.create(evm.DefaultEvm);
        evm_instance.* = try evm.DefaultEvm.init(
            allocator,
            database,
            block_info,
            context,
            0,
            primitives.ZERO_ADDRESS,
            .CANCUN
        );
        
        return Self{
            .allocator = allocator,
            .database = database,
            .evm_instance = evm_instance,
        };
    }
    
    pub fn deinit(self: *Self) void {
        self.evm_instance.deinit();
        self.allocator.destroy(self.evm_instance);
        self.database.deinit();
        self.allocator.destroy(self.database);
    }
    
    pub fn runFixture(
        self: *Self,
        init_code: []const u8,
        calldata: []const u8,
        verbose: bool,
    ) !FixtureResult {
        // Directly install bytecode like the differential tests do
        // This is more reliable than trying CREATE first
        const target_address = Address{ .bytes = [_]u8{0} ** 19 ++ [_]u8{0x20} };
        
        const code_hash = try self.database.set_code(init_code);
        try self.database.set_account(target_address.bytes, evm.Account{
            .nonce = 1,  // Set nonce to 1 like differential tests
            .balance = 0,
            .code_hash = code_hash,
            .storage_root = [_]u8{0} ** 32,
        });
        
        if (verbose) log.debug("Direct install at address: {x}, code_len={}, code_hash={x}\n", .{ target_address, init_code.len, code_hash });

        // Verify contract is properly deployed
        const deployed_code = self.evm_instance.get_code(target_address);
        if (deployed_code.len == 0) {
            return error.NoCodeAtTarget;
        } else if (verbose) {
            log.debug("✓ Contract found at {x}, code_len={}\n", .{ target_address, deployed_code.len });
        }

        // Set up initial state for ERC20 benchmarks if needed
        if (calldata.len >= 4) {
            const selector = (@as(u32, calldata[0]) << 24) |
                (@as(u32, calldata[1]) << 16) |
                (@as(u32, calldata[2]) << 8) |
                @as(u32, calldata[3]);
            
            const needs_balance = switch (selector) {
                0xa9059cbb, // transfer(address,uint256)
                0x095ea7b3, // approve(address,uint256)
                0x23b872dd, // transferFrom(address,address,uint256)
                => true,
                else => false,
            };
            
            if (needs_balance) {
                const balance_amount: u256 = 1000000 * std.math.pow(u256, 10, 18);
                
                var slot_preimage = [_]u8{0} ** 64;
                var storage_slot_bytes: [32]u8 = undefined;
                std.crypto.hash.sha3.Keccak256.hash(&slot_preimage, &storage_slot_bytes, .{});
                
                const storage_slot = std.mem.readInt(u256, &storage_slot_bytes, .big);
                
                try self.database.set_storage(target_address.bytes, storage_slot, balance_amount);
                
                const total_supply_slot: u256 = 2;
                try self.database.set_storage(target_address.bytes, total_supply_slot, balance_amount);
                
                if (verbose) log.debug("✓ Set up ERC20 balance: {} tokens for sender\n", .{balance_amount});
            }
        }

        // Execute the contract
        const call_params = evm.CallParams{
            .call = .{
                .caller = primitives.ZERO_ADDRESS,
                .to = target_address,
                .value = 0,
                .input = calldata,
                .gas = 30_000_000,
            },
        };

        const result = self.evm_instance.call(call_params);
        
        // Validate execution succeeded
        if (!result.success) {
            return error.ExecutionFailed;
        }

        const gas_provided: u64 = 30_000_000;
        const gas_used: u64 = gas_provided - result.gas_left;

        // Validate realistic gas consumption
        const min_gas_for_any_transaction: u64 = 21000;
        if (gas_used < min_gas_for_any_transaction) {
            return error.UnrealisticGasUsage;
        }

        // Additional validation based on calldata
        if (calldata.len >= 4) {
            const selector = (@as(u32, calldata[0]) << 24) |
                (@as(u32, calldata[1]) << 16) |
                (@as(u32, calldata[2]) << 8) |
                @as(u32, calldata[3]);

            const min_expected_gas: u64 = switch (selector) {
                0xa9059cbb => 50000, // transfer()
                0x095ea7b3 => 45000, // approve()
                0x40c10f19 => 55000, // mint()
                0x30627b7c => 100000, // snailtracer Benchmark()
                else => 30000,
            };

            if (gas_used < min_expected_gas) {
                return error.InsufficientGasUsage;
            }
            
            // Validate return values for known operations
            switch (selector) {
                0xa9059cbb, 0x095ea7b3, 0x40c10f19 => {
                    if (result.output.len != 32) {
                        return error.InvalidReturnLength;
                    }
                    
                    // Check that it's a proper boolean true
                    var is_true = true;
                    for (result.output[0..31]) |byte| {
                        if (byte != 0) is_true = false;
                    }
                    if (result.output[31] != 1) is_true = false;
                    
                    if (!is_true) {
                        return error.OperationReturnedFalse;
                    }
                },
                0x30627b7c => {
                    if (result.output.len == 0) {
                        return error.NoReturnData;
                    }
                },
                else => {},
            }
        }

        return FixtureResult{
            .success = result.success,
            .gas_used = gas_used,
            .output = result.output,
            .logs = result.logs,
        };
    }
    
    pub fn loadAndRunFixture(
        self: *Self,
        fixture_dir: []const u8,
        verbose: bool,
    ) !FixtureResult {
        const bc_path = try std.fmt.allocPrint(self.allocator, "{s}/bytecode.txt", .{fixture_dir});
        defer self.allocator.free(bc_path);
        const cd_path = try std.fmt.allocPrint(self.allocator, "{s}/calldata.txt", .{fixture_dir});
        defer self.allocator.free(cd_path);

        const bc_text = try std.fs.cwd().readFileAlloc(self.allocator, bc_path, 16 * 1024 * 1024);
        defer self.allocator.free(bc_text);
        const cd_text = try std.fs.cwd().readFileAlloc(self.allocator, cd_path, 16 * 1024 * 1024);
        defer self.allocator.free(cd_text);

        const bc_bytes = try hex_decode(self.allocator, bc_text);
        defer self.allocator.free(bc_bytes);
        
        const cd_trimmed = std.mem.trim(u8, cd_text, &std.ascii.whitespace);
        const cd_bytes = if (std.mem.eql(u8, cd_trimmed, "0x") or cd_trimmed.len == 0)
            try self.allocator.alloc(u8, 0)
        else
            try hex_decode(self.allocator, cd_text);
        defer self.allocator.free(cd_bytes);

        return self.runFixture(bc_bytes, cd_bytes, verbose);
    }
};

pub const FixtureResult = struct {
    success: bool,
    gas_used: u64,
    output: []const u8,
    logs: []const Log,
};

fn hex_decode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const trimmed = std.mem.trim(u8, clean_hex, &std.ascii.whitespace);
    if (trimmed.len == 0) return allocator.alloc(u8, 0);
    
    const result = try allocator.alloc(u8, trimmed.len / 2);
    var i: usize = 0;
    while (i < trimmed.len) : (i += 2) {
        const byte_str = trimmed[i .. i + 2];
        result[i / 2] = std.fmt.parseInt(u8, byte_str, 16) catch {
            return error.InvalidHexCharacter;
        };
    }
    return result;
}