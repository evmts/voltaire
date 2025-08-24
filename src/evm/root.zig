/// EVM module root - High-performance Ethereum Virtual Machine implementation
/// 
/// This module provides a complete EVM implementation with pluggable components:
/// - Frame-based execution contexts with configurable stack and memory
/// - Bytecode analysis and optimization via the Planner system
/// - Pluggable database interface for state management
/// - Comprehensive tracing and debugging capabilities
/// - Support for all Ethereum hard forks and EIPs
/// 
/// Key components:
/// - `Evm`: Main virtual machine orchestrating execution
/// - `Frame`: Execution context with stack, memory, and gas tracking
/// - `Planner`: Bytecode analysis and optimization
/// - `DatabaseInterface`: Pluggable state storage abstraction
/// - `Host`: External operations interface for calls and environment queries
const std = @import("std");

// Core frame and execution modules
pub const FrameConfig = @import("frame_config.zig").FrameConfig;
pub const Frame = @import("frame.zig").Frame;
pub const FrameInterpreter = @import("frame_interpreter.zig").FrameInterpreter;
pub const createFrameInterpreter = @import("frame_interpreter.zig").createFrameInterpreter;

// Stack and memory modules
pub const StackConfig = @import("stack_config.zig").StackConfig;
pub const Stack = @import("stack.zig").Stack;
pub const MemoryConfig = @import("memory_config.zig").MemoryConfig;
pub const Memory = @import("memory.zig").Memory;
pub const MemoryError = @import("memory.zig").MemoryError;

// Planner and bytecode analysis
pub const Planner = @import("planner.zig").Planner;
pub const createPlanner = @import("planner.zig").createPlanner;
pub const PlannerConfig = @import("planner_config.zig").PlannerConfig;
pub const Plan = @import("plan.zig").Plan;
pub const createPlan = @import("plan.zig").createPlan;
pub const PlanConfig = @import("plan_config.zig").PlanConfig;
pub const PlanMinimal = @import("plan_minimal.zig").PlanMinimal;
pub const PlanAdvanced = @import("plan_advanced.zig").PlanAdvanced;
pub const PlanDebug = @import("plan_debug.zig").PlanDebug;

// EVM main module and configuration
pub const Evm = @import("evm.zig").Evm;
pub const EvmConfig = @import("evm.zig").EvmConfig;
pub const PlannerStrategy = @import("evm.zig").PlannerStrategy;

// Default EVM type for backward compatibility
pub const DefaultEvm = Evm(.{});

// Tracer modules
pub const Tracer = @import("tracer.zig").Tracer;
pub const DetailedStructLog = @import("tracer.zig").DetailedStructLog;
pub const TracerConfig = @import("tracer.zig").TracerConfig;
pub const MemoryCaptureMode = @import("tracer.zig").MemoryCaptureMode;
pub const LoggingTracer = @import("tracer.zig").LoggingTracer;
pub const FileTracer = @import("tracer.zig").FileTracer;
pub const NoOpTracer = @import("tracer.zig").NoOpTracer;
pub const DebuggingTracer = @import("tracer.zig").DebuggingTracer;

// Bytecode modules
pub const BytecodeConfig = @import("bytecode_config.zig").BytecodeConfig;
pub const Bytecode = @import("bytecode.zig").Bytecode;
pub const createBytecode = @import("bytecode.zig").createBytecode;
pub const BytecodeStats = @import("bytecode_stats.zig").BytecodeStats;

// Opcode and instruction data
pub const Opcode = @import("opcode.zig").Opcode;
pub const OpcodeData = @import("opcode_data.zig");
pub const OpcodeSynthetic = @import("opcode_synthetic.zig");
pub const opcode_synthetic = @import("opcode_synthetic.zig");

// Precompiles module
pub const precompiles = @import("precompiles.zig");

// Database and state modules
pub const BlockInfo = @import("block_info.zig").BlockInfo;
pub const CallParams = @import("call_params.zig").CallParams;
pub const CallResult = @import("call_result.zig").CallResult;
pub const CreatedContracts = @import("created_contracts.zig").CreatedContracts;
pub const DatabaseInterface = @import("database_interface.zig").DatabaseInterface;
pub const Account = @import("database_interface_account.zig").Account;
pub const AccessList = @import("access_list.zig").AccessList;
pub const Hardfork = @import("hardfork.zig").Hardfork;
pub const Host = @import("host.zig").Host;
pub const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;
pub const SelfDestruct = @import("self_destruct.zig").SelfDestruct;
pub const Log = @import("logs.zig").Log;

// Run all tests
test {
    // Test core modules
    _ = FrameConfig;
    _ = Frame;
    _ = FrameInterpreter;
    _ = createFrameInterpreter;
    
    // Test stack and memory
    _ = StackConfig;
    _ = Stack;
    _ = MemoryConfig;
    _ = Memory;
    _ = MemoryError;
    
    // Test planner and bytecode
    _ = Planner;
    _ = createPlanner;
    _ = PlannerConfig;
    _ = Plan;
    _ = createPlan;
    _ = PlanConfig;
    _ = PlanMinimal;
    // _ = PlanAdvanced; // NOTE: Module has compilation errors that need to be fixed
    // _ = PlanDebug; // NOTE: Module has compilation errors that need to be fixed
    
    // Test EVM
    _ = Evm;
    _ = EvmConfig;
    _ = PlannerStrategy;
    
    // Test tracer modules
    _ = Tracer;
    _ = DetailedStructLog;
    _ = TracerConfig;
    _ = MemoryCaptureMode;
    _ = LoggingTracer;
    _ = FileTracer;
    _ = NoOpTracer;
    _ = DebuggingTracer;
    
    // Test bytecode modules
    _ = BytecodeConfig;
    _ = Bytecode;
    _ = createBytecode;
    _ = BytecodeStats;
    
    // Test opcodes
    _ = Opcode;
    _ = OpcodeData;
    _ = OpcodeSynthetic;
    _ = opcode_synthetic;
    
    // Test additional modules
    _ = BlockInfo;
    _ = CallParams;
    _ = CallResult;
    _ = CreatedContracts;
    _ = DatabaseInterface;
    _ = Account;
    _ = Hardfork;
    _ = Host;
    _ = MemoryDatabase;
    _ = SelfDestruct;
    _ = AccessList;
}
