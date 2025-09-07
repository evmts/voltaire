//! Guillotine - High-Performance Ethereum Virtual Machine in Zig
//!
//! This is the main entry point for the Guillotine implementation.
//! It re-exports all the modules from their new organized structure.

const std = @import("std");

// Re-export everything from evm/root.zig
pub const Frame = @import("evm/frame.zig").Frame;
pub const FrameConfig = @import("evm/frame_config.zig").FrameConfig;
pub const FrameDispatch = @import("evm/dispatch.zig").Dispatch;
pub const frame_mod = @import("evm/frame.zig");
pub const frame = @import("evm/frame.zig");
pub const frame_handlers = @import("evm/frame_handlers.zig");

// Stack and memory modules
pub const StackConfig = @import("evm/stack_config.zig").StackConfig;
pub const Stack = @import("evm/stack.zig").Stack;
pub const MemoryConfig = @import("evm/memory_config.zig").MemoryConfig;
pub const Memory = @import("evm/memory.zig").Memory;
pub const MemoryError = @import("evm/memory.zig").MemoryError;

// EVM main module and configuration
pub const Evm = @import("evm/evm.zig").Evm;
pub const EvmConfig = @import("evm/evm_config.zig").EvmConfig;

// Fixtures for testing
pub const FixtureContract = @import("evm/fixtures/popular_contracts.zig").FixtureContract;
pub const ContractName = @import("evm/fixtures/popular_contracts.zig").ContractName;
pub const FixtureRunner = @import("evm/fixture_runner.zig").FixtureRunner;

// Default EVM types
pub const DefaultEvm = Evm(.{});

// Tracer modules
pub const tracer = @import("evm/tracer.zig");
pub const Tracer = @import("evm/tracer.zig").Tracer;
pub const DetailedStructLog = @import("evm/tracer.zig").DetailedStructLog;
pub const TracerConfig = @import("evm/tracer.zig").TracerConfig;
pub const MemoryCaptureMode = @import("evm/tracer.zig").MemoryCaptureMode;
pub const LoggingTracer = @import("evm/tracer.zig").LoggingTracer;
pub const FileTracer = @import("evm/tracer.zig").FileTracer;
pub const NoOpTracer = @import("evm/tracer.zig").NoOpTracer;
pub const DebuggingTracer = @import("evm/tracer.zig").DebuggingTracer;
pub const differential_tracer = @import("evm/differential_tracer.zig");
pub const trace_comparer = @import("evm/trace_comparer.zig");
pub const JSONRPCTracer = @import("evm/tracer.zig").JSONRPCTracer;

// Logging
pub const log = @import("log.zig");

// Bytecode modules
pub const BytecodeConfig = @import("bytecode/bytecode_config.zig").BytecodeConfig;
pub const Bytecode = @import("bytecode/bytecode.zig").Bytecode;
pub const BytecodeStats = @import("bytecode/bytecode_stats.zig").BytecodeStats;
pub const bytecode = @import("bytecode/bytecode.zig");

// Dispatch module
pub const dispatch = @import("evm/dispatch.zig");

// Opcode and instruction data
pub const Opcode = @import("opcodes/opcode.zig").Opcode;
pub const OpcodeData = @import("opcodes/opcode_data.zig");
pub const OpcodeSynthetic = @import("opcodes/opcode_synthetic.zig");
pub const opcode_synthetic = @import("opcodes/opcode_synthetic.zig");
pub const opcode_data = @import("opcodes/opcode_data.zig");

// Precompiles module
pub const precompiles = @import("evm/precompiles.zig");

// Database and state modules
pub const BlockInfo = @import("evm/block_info.zig").DefaultBlockInfo;
pub const CompactBlockInfo = @import("evm/block_info.zig").CompactBlockInfo;
pub const BlockInfoConfig = @import("evm/block_info_config.zig").BlockInfoConfig;
pub const CallParams = @import("evm/call_params.zig").CallParams({});
pub const CallResult = @import("evm/call_result.zig").CallResult({});
pub const CreatedContracts = @import("evm/created_contracts.zig").CreatedContracts;
pub const Database = @import("evm/database.zig").Database;
pub const Account = @import("evm/database_interface_account.zig").Account;
pub const AccessList = @import("evm/access_list.zig").AccessList;
pub const Hardfork = @import("evm/hardfork.zig").Hardfork;
pub const Eips = @import("evm/eips.zig").Eips;
pub const MemoryDatabase = @import("evm/memory_database.zig").MemoryDatabase;
pub const SelfDestruct = @import("evm/self_destruct.zig").SelfDestruct;
pub const Log = @import("evm/logs.zig").Log;
pub const TransactionContext = @import("evm/transaction_context.zig").TransactionContext;
pub const AuthorizationProcessor = @import("evm/authorization_processor.zig").AuthorizationProcessor;
pub const AuthorizationError = @import("evm/authorization_processor.zig").AuthorizationError;
pub const kzg_setup = @import("evm/kzg_setup.zig");

// Re-export from evm module for compatibility
pub const Primitives = @import("primitives");
pub const Provider = @import("provider");

// Run tests
test {
    _ = @import("evm/root.zig");
}