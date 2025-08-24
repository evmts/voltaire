const std = @import("std");

// Import main modules
// pub const FrameConfig = @import("frame_config.zig").FrameConfig;
// pub const Frame = @import("frame.zig").Frame;
pub const StackConfig = @import("stack_config.zig").StackConfig;
pub const Stack = @import("stack.zig").Stack;
pub const MemoryConfig = @import("memory_config.zig").MemoryConfig;
// pub const Planner = @import("planner.zig").Planner;
// pub const createPlanner = @import("planner.zig").createPlanner;
// pub const PlannerConfig = @import("planner_config.zig").PlannerConfig;
// pub const createPlan = @import("plan.zig").createPlan;
// pub const PlanConfig = @import("plan_config.zig").PlanConfig;
// pub const Interpreter = @import("interpreter.zig").Interpreter; // TODO: Add when interpreter.zig is created
pub const Evm = @import("evm.zig").Evm;
pub const Tracer = @import("tracer.zig").Tracer;
pub const DetailedStructLog = @import("tracer.zig").DetailedStructLog;
pub const TracerConfig = @import("tracer.zig").TracerConfig;
pub const MemoryCaptureMode = @import("tracer.zig").MemoryCaptureMode;
pub const LoggingTracer = @import("tracer.zig").LoggingTracer;
pub const FileTracer = @import("tracer.zig").FileTracer;
pub const NoOpTracer = @import("tracer.zig").NoOpTracer;
pub const DebuggingTracer = @import("tracer.zig").DebuggingTracer;

// Export opcode data
// pub const opcode_data = @import("opcode_data.zig");
// pub const BytecodeConfig = @import("bytecode_config.zig").BytecodeConfig;
// pub const createBytecode = @import("bytecode.zig").createBytecode;
// pub const Bytecode = @import("bytecode.zig").Bytecode;

// Export additional core types
pub const BlockInfo = @import("block_info.zig").BlockInfo;
pub const CallParams = @import("call_params.zig").CallParams;
pub const CallResult = @import("call_result.zig").CallResult;
pub const CreatedContracts = @import("created_contracts.zig").CreatedContracts;
pub const DatabaseInterface = @import("database_interface.zig").DatabaseInterface;
pub const Account = @import("database_interface_account.zig").Account;
pub const Hardfork = @import("hardfork.zig").Hardfork;
pub const Host = @import("host.zig").Host;
pub const Memory = @import("memory.zig").Memory;
pub const MemoryError = @import("memory.zig").MemoryError;
pub const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;
pub const Opcode = @import("opcode.zig").Opcode;
pub const opcode_synthetic = @import("opcode_synthetic.zig");
pub const SelfDestruct = @import("self_destruct.zig").SelfDestruct;
// pub const createPlanMinimal = @import("plan_minimal.zig").PlanMinimal;
// pub const createFrameInterpreter = @import("frame_interpreter.zig").FrameInterpreter;

// Run all tests
test {
    // Test main modules
    // _ = FrameConfig;
    // _ = Frame;
    _ = StackConfig;
    _ = Stack;
    // _ = Planner;
    // _ = Interpreter;
    _ = Evm;
    _ = Tracer;
    _ = DetailedStructLog;
    // _ = BytecodeConfig;
    // _ = createBytecode;
    // _ = Bytecode;
    
    // Test additional modules
    _ = BlockInfo;
    _ = CallParams;
    _ = CallResult;
    _ = CreatedContracts;
    _ = DatabaseInterface;
    _ = Hardfork;
    _ = Host;
    _ = Memory;
    _ = MemoryDatabase;
    _ = Opcode;
    _ = opcode_synthetic;
    _ = SelfDestruct;
    _ = Account;
    // _ = createPlanMinimal;
    // _ = createFrameInterpreter;
    
    // Test config modules
    _ = MemoryConfig;
    // _ = PlannerConfig;
    // _ = PlanConfig;
    _ = TracerConfig;
    _ = MemoryCaptureMode;
    _ = LoggingTracer;
    _ = FileTracer;
    _ = NoOpTracer;
    _ = DebuggingTracer;
    // _ = createPlan;
    // _ = opcode_data;
}
