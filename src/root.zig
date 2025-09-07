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
pub const StackConfig = @import("stack/stack_config.zig").StackConfig;
pub const Stack = @import("stack/stack.zig").Stack;
pub const MemoryConfig = @import("memory/memory_config.zig").MemoryConfig;
pub const Memory = @import("memory/memory.zig").Memory;
pub const MemoryError = @import("memory/memory.zig").MemoryError;

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
pub const precompiles = @import("precompiles/precompiles.zig");

// Database and state modules
pub const BlockInfo = @import("evm/block_info.zig").DefaultBlockInfo;
pub const CompactBlockInfo = @import("evm/block_info.zig").CompactBlockInfo;
pub const BlockInfoConfig = @import("evm/block_info_config.zig").BlockInfoConfig;
pub const CallParams = @import("evm/call_params.zig").CallParams({});
pub const CallResult = @import("evm/call_result.zig").CallResult({});
pub const CreatedContracts = @import("storage/created_contracts.zig").CreatedContracts;
pub const Database = @import("storage/database.zig").Database;
pub const Account = @import("storage/database_interface_account.zig").Account;
pub const AccessList = @import("storage/access_list.zig").AccessList;
pub const Hardfork = @import("eips_and_hardforks/hardfork.zig").Hardfork;
pub const Eips = @import("eips_and_hardforks/eips.zig").Eips;
pub const MemoryDatabase = @import("storage/memory_database.zig").MemoryDatabase;
pub const SelfDestruct = @import("storage/self_destruct.zig").SelfDestruct;
pub const Log = @import("evm/logs.zig").Log;
pub const TransactionContext = @import("evm/transaction_context.zig").TransactionContext;
pub const AuthorizationProcessor = @import("eips_and_hardforks/authorization_processor.zig").AuthorizationProcessor;
pub const AuthorizationError = @import("eips_and_hardforks/authorization_processor.zig").AuthorizationError;
pub const kzg_setup = @import("precompiles/kzg_setup.zig");

// Re-export from evm module for compatibility
pub const Primitives = @import("primitives");
pub const Provider = @import("provider");

// Run tests
test {
    // Test EVM modules
    _ = @import("evm/evm_tests.zig");
    _ = @import("evm/dispatch.zig");
    _ = @import("evm/handlers_arithmetic.zig");
    _ = @import("evm/handlers_bitwise.zig");
    _ = @import("evm/handlers_comparison.zig");
    _ = @import("evm/handlers_context.zig");
    _ = @import("evm/handlers_jump.zig");
    _ = @import("evm/handlers_keccak.zig");
    _ = @import("evm/handlers_log.zig");
    _ = @import("evm/handlers_memory.zig");
    _ = @import("evm/handlers_stack.zig");
    _ = @import("evm/handlers_storage.zig");
    _ = @import("evm/handlers_system.zig");
    
    // Test bytecode modules
    _ = @import("bytecode/bytecode_tests.zig");
    _ = @import("bytecode/bytecode_jump_validation_tests.zig");
    
    // Test C API modules
    _ = @import("root_c.zig");
}