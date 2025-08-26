# Alternative EVM Implementation Plan
**Migration from Plan-based to Schedule-based Architecture**

## Overview

This document outlines the strategy for implementing an alternative EVM execution model using the continuation-passing style architecture with Schedule objects, alongside the existing Plan-based system. The goal is to enable both implementations to coexist during development and testing phases.

## Current Architecture Analysis

### Existing Plan-Based System

**Core Components:**
- **Frame (frame.zig)**: ~2000 lines, handles all opcode execution with `*Self` receivers
- **Planner (planner.zig)**: Analyzes bytecode, creates execution plans with InstructionElement arrays
- **Plan Objects**: Contain `instructionStream: []InstructionElement` and `u256_constants: []WordType`
- **HandlerFn Signature**: `fn (frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn`

**Execution Model:**
- Frame modifies its own state via pointer (`self: *Self`)
- Plan objects provide instruction streams with handler pointers
- Traditional function call dispatch without tail optimization
- PC tracking and jumps managed by Plan objects

### New Schedule-Based System

**Core Components:**
- **StackFrame (stack_frame.zig)**: Implements continuation-passing style with `Self` value receivers
- **Schedule Objects**: Unbounded arrays with null termination instead of InstructionElement slices
- **OpcodeHandler Signature**: `*const fn (frame: Self, next_handler: Schedule) Error!Success`
- **Tail Call Optimization**: `@call(.always_tail, next[0], .{ self, next + 1 })`

**Key Architectural Differences:**

| Aspect | Plan-Based (Current) | Schedule-Based (New) |
|--------|---------------------|----------------------|
| Parameter Style | `self: *Self` (pointer) | `self: Self` (value) |
| Dispatch Method | Function calls | Tail call recursion |
| Handler Signature | `HandlerFn` with anyopaque | `OpcodeHandler` with strong types |
| Instruction Storage | `[]InstructionElement` slices | `[*:null]const *const OpcodeHandler` arrays |
| Memory Layout | Complex union structures | Simple unbounded arrays |
| State Modification | In-place via pointer | Copy-on-modify pattern |

**Schedule Structure:**
```zig
const Schedule = struct {
    schedule: [*]const Item,
    pub const Item = union {
        jump_dest: JumpDestMetadata,
        push_inline: PushInlineMetadata,
        push_pointer: PushPointerMetadata,
        pc: PcMetadata,
        opcode_handler: OpcodeHandler,
    };
};
```

## Implementation Strategy

### Phase 1: Foundation Setup

**1.1 Create Parallel Module Structure**
- Keep existing `src/evm/` modules untouched
- Add new modules for Schedule-based system:
  - `schedule.zig` - Core Schedule data structure
  - `schedule_config.zig` - Configuration options  
  - `planner2.zig` - Schedule generation from bytecode
  - `stack_frame_interpreter.zig` - Integration with EVM

**1.2 Schedule Data Structure Implementation**
```zig
// schedule.zig
pub fn Schedule(comptime config: ScheduleConfig) type {
    return struct {
        items: [*:null]const *const Item,
        
        pub const Item = union(enum) {
            opcode_handler: OpcodeHandler,
            jump_dest: JumpDestMetadata,
            push_inline: PushInlineMetadata,
            push_pointer: PushPointerMetadata,
            pc: PcMetadata,
        };
        
        pub const OpcodeHandler = *const fn (
            frame: StackFrame(config.frame_config), 
            next: Schedule(@This())
        ) Error!Success;
        
        pub fn getOpData(self: @This(), comptime opcode: Opcode) OpDataType {
            // Implementation for extracting opcode-specific metadata
        }
    };
}
```

**1.3 Configuration System**
```zig
// schedule_config.zig
pub const ScheduleConfig = struct {
    frame_config: FrameConfig,
    max_schedule_size: usize = 65536,
    enable_tail_calls: bool = true,
    optimize_for_size: bool = false,
    
    pub fn validate(self: @This()) void {
        // Validation logic
    }
};
```

### Phase 2: Planner2 Implementation

**2.1 Bytecode Analysis Engine**
- Adapt existing planner logic for Schedule generation
- Maintain compatibility with existing bytecode analysis
- Convert Plan-style instruction streams to Schedule arrays

```zig
// planner2.zig  
pub fn Planner2(comptime config: ScheduleConfig) type {
    return struct {
        const Self = @This();
        const ScheduleType = Schedule(config);
        
        pub fn generateSchedule(
            self: *Self, 
            allocator: std.mem.Allocator,
            bytecode: []const u8,
            handlers: [256]*const ScheduleType.OpcodeHandler
        ) !*const ScheduleType {
            // Convert bytecode to null-terminated handler array
            // Handle jump destination analysis
            // Inline metadata for PUSH operations
        }
        
        // Cache management for compiled schedules
        cache: std.AutoHashMap(u64, *ScheduleType),
    };
}
```

**2.2 Handler Function Generation**
- Create handler functions compatible with StackFrame
- Implement tail call optimization patterns
- Maintain existing opcode semantics

```zig
// In planner2.zig - handler generation
fn generateHandlers(comptime FrameType: type) [256]*const FrameType.OpcodeHandler {
    return [256]*const FrameType.OpcodeHandler{
        &FrameType.stop,     // 0x00
        &FrameType.add,      // 0x01
        &FrameType.mul,      // 0x02
        // ... all 256 opcodes
    };
}
```

### Phase 3: Integration Layer

**3.1 Dual EVM Support**
- Extend existing EVM to support both execution models
- Add runtime selection between Plan and Schedule execution
- Maintain identical external interfaces

```zig
// In evm.zig
pub const ExecutionMode = enum {
    plan_based,    // Original frame.zig execution
    schedule_based // New stack_frame.zig execution  
};

pub fn Evm(comptime config: EvmConfig) type {
    return struct {
        execution_mode: ExecutionMode,
        
        // Existing Plan-based components
        planner: if (config.execution_mode == .plan_based) 
            Planner(config.planner_config) else void,
        frame: if (config.execution_mode == .plan_based)
            Frame(config.frame_config) else void,
            
        // New Schedule-based components  
        planner2: if (config.execution_mode == .schedule_based)
            Planner2(config.schedule_config) else void,
        stack_frame: if (config.execution_mode == .schedule_based)
            StackFrame(config.frame_config) else void,
    };
}
```

**3.2 Shared Components**
- Database interface remains unchanged
- Host interface compatible with both models
- Memory and stack components work with both systems

### Phase 4: Testing and Validation

**4.1 Parallel Test Suite**
- Run identical test cases against both implementations
- Validate execution results are identical
- Performance benchmarking between approaches

**4.2 Migration Testing**
- Test bytecode that works with both systems
- Verify state consistency between models
- Ensure no regressions in existing functionality

## Implementation Details

### Memory Management

**Plan-Based (Current)**
- Frame modifies state in-place via pointers
- Plan objects allocated separately from execution context
- Complex memory layout with unions and slices

**Schedule-Based (New)**  
- Frame passed by value, modifications create new state
- Schedule arrays allocated once, reused across executions
- Simple linear memory layout for cache efficiency

### Performance Considerations

**Tail Call Optimization Benefits:**
- Eliminates function call overhead
- Improves branch prediction
- Reduces stack depth for long execution sequences

**Value vs Pointer Trade-offs:**
- `Self` values: Better cache locality, enable optimizations
- `*Self` pointers: Less copying, traditional imperative style

**Memory Layout:**
- Schedule arrays: Linear, cache-friendly access patterns
- Plan instruction streams: Complex but flexible metadata

### Compatibility Matrix

| Component | Plan-Based | Schedule-Based | Shared |
|-----------|------------|----------------|--------|
| Database Interface | ✓ | ✓ | ✓ |
| Host Interface | ✓ | ✓ | ✓ |  
| Memory System | ✓ | ✓ | ✓ |
| Stack Implementation | ✓ | ✓ | ✓ |
| Tracer System | ✓ | ✓ | ✓ |
| Gas Tracking | ✓ | ✓ | ✓ |
| Frame Execution | ✓ | - | - |
| StackFrame Execution | - | ✓ | - |
| Plan Generation | ✓ | - | - |
| Schedule Generation | - | ✓ | - |

## Migration Path

### Development Phases

**Phase 1 (Foundation)**
- [ ] Implement Schedule data structures
- [ ] Create basic planner2.zig skeleton
- [ ] Add configuration systems
- [ ] Setup parallel build targets

**Phase 2 (Core Logic)**  
- [ ] Port bytecode analysis from planner.zig
- [ ] Implement Schedule generation algorithms
- [ ] Create handler function templates
- [ ] Add caching mechanisms

**Phase 3 (Integration)**
- [ ] Extend EVM to support both modes
- [ ] Create execution mode selection
- [ ] Implement shared component interfaces
- [ ] Add runtime switching capabilities

**Phase 4 (Validation)**
- [ ] Port existing test suite to Schedule system
- [ ] Add performance benchmarks
- [ ] Validate functional correctness
- [ ] Document performance characteristics

### Risk Mitigation

**Technical Risks:**
- Tail call optimization not working as expected
- Performance regression from value semantics
- Memory usage increase from Schedule arrays

**Mitigation Strategies:**
- Comprehensive benchmarking during development
- Fallback mechanisms to Plan-based execution
- Gradual rollout with feature flags

**Compatibility Risks:**
- Breaking changes to existing interfaces
- Test failures from behavioral differences

**Mitigation Strategies:**  
- Maintain identical external APIs
- Extensive cross-validation testing
- Feature flags for gradual migration

## Success Metrics

### Performance Goals
- Execution speed: Equal or better than Plan-based system
- Memory usage: Similar or reduced compared to current system  
- Cache efficiency: Improved due to linear memory layout

### Quality Goals
- Test coverage: 100% compatibility with existing tests
- Correctness: Identical execution results between both systems
- Maintainability: Clear separation of concerns between systems

## Conclusion

The Schedule-based architecture represents a significant evolution in EVM execution strategy, leveraging continuation-passing style and tail call optimization for improved performance. By maintaining parallel implementations during development, we can ensure a smooth transition while preserving the stability of the existing Plan-based system.

The key insight from the telegram conversation is that the Schedule system using unbounded arrays with null termination provides better cache locality and enables powerful optimizations through tail calls, while maintaining the flexibility to handle complex opcode metadata requirements.

This migration plan allows for gradual adoption, comprehensive testing, and the ability to fall back to the proven Plan-based system if issues arise during development.