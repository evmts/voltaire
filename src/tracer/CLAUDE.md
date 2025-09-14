# CLAUDE.md - Tracer Module AI Context

## MISSION CRITICAL: Execution Monitoring and Debugging

The tracer module provides detailed execution monitoring, debugging, and analysis capabilities. **Tracer bugs can hide critical issues or provide incorrect debugging information.** Tracing must be accurate without affecting execution correctness.

## Critical Implementation Details

### Tracing Architecture
- **EIP-2929 Access Tracking**: Monitor cold/warm storage access
- **Opcode-Level Tracing**: Record every instruction execution
- **Stack/Memory Monitoring**: Track state changes at each step
- **Gas Consumption Analysis**: Precise gas usage tracking
- **Call Frame Tracing**: Monitor call depth and context switches

### Key Responsibilities
- **Execution Tracing**: Record instruction-by-instruction execution
- **State Change Monitoring**: Track all state modifications
- **Performance Analysis**: Identify gas usage patterns
- **Debug Information**: Provide detailed execution context
- **Error Analysis**: Capture failure conditions and contexts

### Tracer Types
- **Structural Tracer**: Basic execution flow and state changes
- **Call Tracer**: Focus on call/return patterns and gas usage
- **4Byte Tracer**: Track function signature usage
- **Prestate Tracer**: Capture state before/after execution
- **Custom Tracers**: User-defined tracing logic

### Critical Safety Requirements
- NEVER modify execution state during tracing
- Maintain perfect isolation between tracer and EVM
- Handle tracer failures gracefully without affecting execution
- Ensure tracing overhead doesn't change gas calculations

### Performance Optimization
- Conditional tracing (enable/disable per opcode type)
- Efficient data structure for trace storage
- Memory pooling for trace objects
- Lazy evaluation of expensive trace data

### Emergency Procedures
- Disable tracing on memory exhaustion
- Handle tracer crashes without stopping EVM execution
- Validate trace data integrity
- Fallback to minimal tracing on errors

Remember: **Tracers are observers, never participants.** They must not influence execution while providing accurate debugging information.