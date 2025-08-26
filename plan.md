# Simplified EVM Architecture Migration Plan
**From Complex Plans to Simple Schedules**

## Overview

This document outlines the migration to a dramatically simplified EVM execution model that eliminates the complex Plan/Planner system in favor of simple Schedule objects with continuation-passing style execution.

## Key Architectural Insight

The new architecture eliminates all Plan complexity in favor of just two simple data structures:
- `constants: [*]const u256` - Simple constant array
- `schedule: [*]const Item` - Simple schedule array

**Advanced planning** = passing sophisticated constants and schedule items
**Debug planning** = passing debug instructions into the schedule
**Simple planning** = passing basic schedule items

## Current vs New Architecture

### Current Plan-Based System (Being Eliminated)

**Complex Components:**
- **Planner (planner.zig)**: ~2000 lines of complex bytecode analysis
- **Plan Objects**: Complex `instructionStream: []InstructionElement` with unions
- **PlanAdvanced/PlanDebug/PlanMinimal**: Multiple specialized plan types
- **HandlerFn**: Complex `fn (frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn`
- **frame_interpreter.zig**: Will be removed entirely

### New Simplified System

**Simple Components:**
- **stack_frame.zig**: Continuation-passing execution with `Self` values
- **Simple Schedule**: Just `constants: [*]const u256, schedule: [*]const Item`
- **OpcodeHandler**: `*const fn (frame: Self, next_handler: Schedule) Error!Success`
- **Tail Call Optimization**: `@call(.always_tail, next[0], .{ self, next + 1 })`

**Key Simplifications:**

| Aspect | Old (Complex) | New (Simple) |
|--------|---------------|--------------|
| Plan Types | PlanAdvanced, PlanDebug, PlanMinimal | Just Schedule |
| Instruction Storage | `[]InstructionElement` unions | `[*]const Item` arrays |
| Constants Management | Complex constant inlining | Simple `[*]const u256` |
| Bytecode Analysis | Complex planner.zig | Simple bytecode.zig |
| Execution | frame_interpreter.zig | stack_frame.zig |
| Caching | Complex LRU with hash maps | Simple as needed |

## Implementation Strategy

### Clean Separation of Concerns

**Module Responsibilities:**
- **`bytecode.zig`** - All bytecode analysis and understanding
- **`evm.zig`** - Schedule generation decisions and orchestration  
- **`stack_frame.zig`** - Pure schedule execution

### Phase 1: Bytecode Analysis (bytecode.zig)

**1.1 Enhanced Bytecode Analysis**
```zig
// bytecode.zig
pub const Bytecode = struct {
    code: []const u8,
    jump_destinations: std.AutoHashMap(u16, JumpDestInfo),
    push_data: std.ArrayList(PushInfo),
    
    pub fn analyze(allocator: std.mem.Allocator, code: []const u8) !Bytecode {
        // Move complex analysis logic from planner.zig here
        // Identify jump destinations, push data, gas costs
        // This replaces the complex planner analysis
    }
    
    pub fn getJumpDests(self: *const Bytecode) []const JumpDestInfo {
        // Simple access to analyzed jump destinations
    }
    
    pub fn getPushData(self: *const Bytecode, pc: u16) ?PushInfo {
        // Get push data for specific PC
    }
};
```

**1.2 Simple Analysis Results**
- No complex Plan objects - just analysis data
- Jump destination metadata
- Push value extraction
- Gas cost pre-calculation where beneficial

### Phase 2: EVM Schedule Generation (evm.zig)

**2.1 Simple Schedule Generation**
```zig
// In evm.zig
pub fn generateSchedule(
    self: *Self,
    allocator: std.mem.Allocator, 
    bytecode: *const Bytecode
) !struct {
    constants: [*]const u256,
    schedule: [*]const StackFrame.Schedule.Item,
} {
    // Simple logic - no complex planner
    // Use bytecode.zig analysis results
    // Generate simple constants array
    // Generate simple schedule array
    // Decision making about simple vs advanced schedules (future)
}
```

**2.2 EVM Method Integration**
```zig
// In evm.zig - replaces complex planner usage
pub fn analyze(self: *Self, code: []const u8) !ScheduleResult {
    const bytecode_info = try Bytecode.analyze(self.allocator, code);
    return self.generateSchedule(self.allocator, &bytecode_info);
}
```

### Phase 3: Pure Schedule Execution (stack_frame.zig)

**3.1 Schedule Interface**
- StackFrame just takes constants + schedule arrays
- No knowledge of bytecode analysis
- Pure execution engine with tail calls
- Already implemented - just needs integration

```zig
// stack_frame.zig - already mostly done
pub fn execute(
    self: Self,
    constants: [*]const u256,
    schedule: [*]const Schedule.Item,
) Error!Success {
    // Pure execution - no analysis logic
    // Just follow the schedule with tail calls
}
```

### Phase 4: Integration and Cleanup

**4.1 Replace Complex Components**
- Remove `planner.zig` entirely (move logic to bytecode.zig and evm.zig)
- Remove `frame_interpreter.zig` entirely (replaced by stack_frame.zig)
- Remove all Plan* modules (PlanAdvanced, PlanDebug, etc.)
- Simplify EVM to just use the new analysis + execution flow

**4.2 Update EVM Integration**
```zig
// evm.zig - simplified from current complex version
pub fn execute_frame(self: *Self, code: []const u8, ...) !CallResult {
    // Replace complex planner usage:
    // OLD: const plan = try self.planner.getOrAnalyze(code, handlers, hardfork);
    
    // NEW: Simple analysis + execution
    const schedule_result = try self.analyze(code);
    const result = try self.stack_frame.execute(schedule_result.constants, schedule_result.schedule);
    return result;
}
```

**4.3 Clean Architecture Benefits**
- **bytecode.zig**: Pure analysis, no execution logic
- **evm.zig**: Orchestration and decision making, simple schedule generation
- **stack_frame.zig**: Pure execution, no analysis logic
- **No complex caching** unless specifically needed for performance
- **No complex Plan objects** - just simple arrays

### Phase 5: Testing and Validation

**5.1 Simplified Testing**
- Test bytecode analysis in bytecode.zig
- Test schedule generation in evm.zig  
- Test schedule execution in stack_frame.zig
- Integration tests for the full flow

**5.2 Performance Validation**
- Compare new simplified architecture against current system
- Validate tail call optimization benefits
- Ensure no regressions from simplification

## Key Implementation Benefits

### Massive Simplification
- **Eliminate thousands of lines** of complex Plan/Planner code
- **Two simple arrays** replace complex union structures
- **Clean separation** of analysis vs execution vs orchestration

### Performance Improvements
- **Tail call optimization** eliminates dispatch overhead
- **Linear memory layout** improves cache efficiency  
- **Value semantics** enable better compiler optimizations
- **Simpler code paths** reduce complexity overhead

### Development Benefits  
- **Easier to understand** - clear module responsibilities
- **Easier to test** - pure functions with simple inputs/outputs
- **Easier to debug** - less indirection and complex state
- **Easier to extend** - just modify the relevant module

## Migration Checklist

### Phase 1: Enhanced Bytecode Analysis
- [ ] Move complex analysis from planner.zig to bytecode.zig
- [ ] Implement `Bytecode.analyze()` method
- [ ] Extract jump destinations and push data
- [ ] Test bytecode analysis in isolation

### Phase 2: EVM Schedule Generation  
- [ ] Add `evm.analyze()` method
- [ ] Implement simple schedule generation in evm.zig
- [ ] Generate constants and schedule arrays
- [ ] Test schedule generation

### Phase 3: Integration
- [ ] Update `evm.execute_frame()` to use new flow
- [ ] Remove planner.zig usage from EVM
- [ ] Remove frame_interpreter.zig usage
- [ ] Test full integration

### Phase 4: Cleanup
- [ ] Delete planner.zig and all Plan* modules  
- [ ] Delete frame_interpreter.zig
- [ ] Update build.zig to remove deleted modules
- [ ] Update tests to use new architecture

## Conclusion

The new simplified architecture eliminates thousands of lines of complex code in favor of two simple arrays:
- `constants: [*]const u256` 
- `schedule: [*]const Item`

This dramatic simplification provides multiple benefits:

**Architectural Clarity:** Clean separation between bytecode analysis (bytecode.zig), orchestration (evm.zig), and execution (stack_frame.zig)

**Performance Gains:** Tail call optimization, better cache locality, and elimination of complex dispatch overhead

**Development Velocity:** Easier to understand, test, debug, and extend than the current complex Plan system

**Maintainability:** Pure functions with simple inputs/outputs replace complex stateful objects

The migration path is straightforward: move analysis logic to bytecode.zig, add simple schedule generation to evm.zig, integrate with existing stack_frame.zig execution, then delete the complex Plan system entirely.

This represents a fundamental simplification that maintains all the power of the original system while dramatically reducing complexity.