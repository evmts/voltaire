const std = @import("std");
const evm = @import("root.zig");
const primitives = @import("primitives");
const log = @import("log.zig");
const CallParams = @import("call_params.zig").CallParams;
const CallResult = @import("call_result.zig").CallResult;
const revm = @import("revm");

/// Simple differential tracer that compares basic execution results
pub const DifferentialTracer = struct {
    allocator: std.mem.Allocator,
    guillotine_evm: *evm.Evm(.{ .TracerType = evm.tracer.JSONRPCTracer }),
    revm_vm: *revm.Revm,

    pub fn init(
        allocator: std.mem.Allocator,
        database: *evm.Database,
        block_info: evm.BlockInfo,
        tx_context: evm.TransactionContext,
        caller: primitives.Address,
    ) !DifferentialTracer {
        // Create Guillotine EVM with JSON-RPC tracing
        const guillotine = try allocator.create(evm.Evm(.{ .TracerType = evm.tracer.JSONRPCTracer }));
        errdefer allocator.destroy(guillotine);
        
        guillotine.* = try evm.Evm(.{ .TracerType = evm.tracer.JSONRPCTracer }).init(
            allocator,
            database,
            block_info,
            tx_context,
            0, // initial_refund
            caller,
            .CANCUN,
        );
        errdefer guillotine.deinit();
        
        // Create REVM instance
        const revm_vm = try allocator.create(revm.Revm);
        errdefer allocator.destroy(revm_vm);
        
        revm_vm.* = try revm.Revm.init(allocator, .{
            .gas_limit = tx_context.gas_limit,
            .chain_id = block_info.chain_id,
            .block_number = block_info.number,
            .block_timestamp = block_info.timestamp,
            .block_gas_limit = block_info.gas_limit,
            .block_difficulty = @intCast(block_info.difficulty),
            .block_basefee = @intCast(block_info.base_fee),
            .coinbase = block_info.coinbase,
        });
        errdefer revm_vm.deinit();
        
        // Sync initial state from Guillotine database to REVM
        if (try database.get_account(caller.bytes)) |account| {
            try revm_vm.setBalance(caller, account.balance);
            
            if (!std.mem.eql(u8, &account.code_hash, &([_]u8{0} ** 32))) {
                const code = try database.get_code(account.code_hash);
                try revm_vm.setCode(caller, code);
            }
        }
        
        return DifferentialTracer{
            .allocator = allocator,
            .guillotine_evm = guillotine,
            .revm_vm = revm_vm,
        };
    }
    
    pub fn deinit(self: *DifferentialTracer) void {
        self.guillotine_evm.deinit();
        self.allocator.destroy(self.guillotine_evm);
        self.revm_vm.deinit();
        self.allocator.destroy(self.revm_vm);
    }
    
    pub fn call(self: *DifferentialTracer, params: CallParams) !CallResult {
        // Convert EVM CallParams to REVM CallParams
        const revm_params = switch (params) {
            .call => |p| revm.CallParams{ .call = .{
                .caller = p.caller,
                .to = p.to,
                .value = p.value,
                .input = p.input,
                .gas = p.gas,
            } },
            .callcode => |p| revm.CallParams{ .callcode = .{
                .caller = p.caller,
                .to = p.to,
                .value = p.value,
                .input = p.input,
                .gas = p.gas,
            } },
            .delegatecall => |p| revm.CallParams{ .delegatecall = .{
                .caller = p.caller,
                .to = p.to,
                .input = p.input,
                .gas = p.gas,
            } },
            .staticcall => |p| revm.CallParams{ .staticcall = .{
                .caller = p.caller,
                .to = p.to,
                .input = p.input,
                .gas = p.gas,
            } },
            .create => |p| revm.CallParams{ .create = .{
                .caller = p.caller,
                .value = p.value,
                .init_code = p.init_code,
                .gas = p.gas,
            } },
            .create2 => |p| revm.CallParams{ .create2 = .{
                .caller = p.caller,
                .value = p.value,
                .init_code = p.init_code,
                .salt = p.salt,
                .gas = p.gas,
            } },
        };
        
        // Execute on REVM first
        var revm_result = try self.revm_vm.call(revm_params);
        defer revm_result.deinit();
        
        // Execute on Guillotine
        const guillotine_result = try self.guillotine_evm.call(params);
        
        // Compare results
        if (revm_result.success != guillotine_result.success) {
            log.err("❌ SUCCESS MISMATCH: REVM={}, Guillotine={}", .{ 
                revm_result.success, 
                guillotine_result.success 
            });
        } else {
            log.info("✅ Success status matches: {}", .{revm_result.success});
        }
        
        // Compare gas (both now have gas_left)
        if (revm_result.gas_left != guillotine_result.gas_left) {
            log.err("❌ GAS MISMATCH: REVM gas_left={}, Guillotine gas_left={}", .{ 
                    revm_result.gas_left, 
                    guillotine_result.gas_left 
                });
            } else {
                log.info("✅ Gas matches: gas_left={}", .{revm_result.gas_left});
            }
            
            if (!std.mem.eql(u8, revm_result.output, guillotine_result.output)) {
                log.err("❌ OUTPUT MISMATCH: REVM len={}, Guillotine len={}", .{ 
                    revm_result.output.len, 
                    guillotine_result.output.len 
                });
                
                if (revm_result.output.len > 0) {
                    log.err("  REVM output (first 32 bytes): {x}", .{
                        revm_result.output[0..@min(32, revm_result.output.len)]
                    });
                }
                if (guillotine_result.output.len > 0) {
                    log.err("  Guillotine output (first 32 bytes): {x}", .{
                        guillotine_result.output[0..@min(32, guillotine_result.output.len)]
                    });
                }
            } else {
                log.info("✅ Output matches: {} bytes", .{revm_result.output.len});
            }
        
        return guillotine_result;
    }
};