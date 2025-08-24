# GuillotineEVM Go SDK - Complete Architecture

## Overview

The GuillotineEVM Go SDK provides a comprehensive, ergonomic interface to the high-performance Guillotine EVM implemented in Zig. This SDK wraps all C APIs with idiomatic Go interfaces designed for production use.

## Design Principles

### 1. **Ergonomic First**
- Use Go idioms and conventions throughout
- Hide C memory management completely from users
- Provide both simple and advanced APIs for different use cases
- Use builder patterns for complex configurations

### 2. **Safety & Reliability**
- All types are safe for concurrent use
- Automatic resource cleanup with finalizers
- Comprehensive error handling with typed errors
- No memory leaks or unsafe operations exposed

### 3. **Performance**
- Zero-copy operations where possible
- Efficient C interop with minimal overhead
- Pooling and reuse of expensive resources
- Optional caching for frequently used operations

### 4. **Comprehensive Coverage**
- Complete wrapping of all C APIs
- Full EVM functionality including advanced features
- Rich debugging and introspection capabilities
- Extensive testing with real-world scenarios

## Package Architecture

### Core Packages

```
github.com/evmts/guillotine/bindings/go/
├── primitives/          # Ethereum primitive types
│   ├── address.go       ✅ Address type with validation
│   ├── u256.go         ✅ 256-bit integers with arithmetic
│   ├── hash.go         ✅ 32-byte hash values
│   └── bytes.go        ✅ Variable-length byte arrays
│
├── evm/                # Main EVM execution engine
│   ├── evm.go          ✅ Core EVM with state management
│   ├── config.go       🆕 EVM configuration options
│   ├── context.go      🆕 Execution context and environment
│   └── result.go       ✅ Execution results and debugging
│
├── plan/               # 🆕 Bytecode analysis and execution plans
│   ├── plan.go         # Execution plan inspection
│   ├── analyzer.go     # Jump destination and constant analysis
│   └── optimizer.go    # Plan optimization utilities
│
├── planner/            # 🆕 Bytecode optimization and caching
│   ├── planner.go      # Main planner interface
│   ├── cache.go        # Plan caching with LRU eviction
│   └── strategy.go     # Planning strategies and options
│
├── precompiles/        # 🆕 Ethereum precompiled contracts
│   ├── precompiles.go  # All standard precompiles (0x01-0x0A)
│   ├── ecrecover.go    # Signature recovery utilities
│   ├── hash.go         # SHA256, RIPEMD160, Blake2f
│   ├── bigint.go       # ModExp operations
│   └── elliptic.go     # Elliptic curve operations
│
├── bytecode/           # 🆕 Bytecode parsing and validation
│   ├── bytecode.go     # Main bytecode operations
│   ├── parser.go       # Opcode parsing and validation
│   ├── analyzer.go     # Static analysis and statistics
│   └── disasm.go       # Human-readable disassembly
│
├── hardfork/           # 🆕 Ethereum hardfork management
│   ├── hardfork.go     # Hardfork definitions and utilities
│   ├── features.go     # Feature detection by hardfork
│   └── opcodes.go      # Opcode availability by hardfork
│
├── debug/              # 🆕 Debugging and tracing utilities
│   ├── tracer.go       # Execution tracing
│   ├── profiler.go     # Performance profiling
│   └── inspector.go    # State inspection utilities
│
└── errors/             # 🆕 Comprehensive error handling
    ├── errors.go       # Error types and utilities
    └── codes.go        # Error code definitions
```

## API Design Philosophy

### 1. **Simple APIs for Common Use Cases**

```go
// Simple contract execution
evm := guillotine.NewEVM()
result, err := evm.Execute(ctx, guillotine.Call{
    To:       contractAddress,
    Input:    calldata,
    GasLimit: 1000000,
})
```

### 2. **Advanced APIs for Complex Scenarios**

```go
// Advanced execution with custom configuration
config := guillotine.Config{
    Hardfork:    hardfork.London,
    GasLimit:    30_000_000,
    Tracing:     debug.NewTracer(),
}

evm := guillotine.NewEVMWithConfig(config)
planner := planner.New(planner.WithCaching(1000))

// Pre-analyze bytecode
plan, err := planner.Plan(ctx, bytecode)
if err != nil {
    return err
}

// Execute with plan
result, err := evm.ExecuteWithPlan(ctx, plan, params)
```

### 3. **Builder Patterns for Configuration**

```go
// Precompile execution with builder pattern
result, err := precompiles.ECRecover().
    WithHash(messageHash).
    WithSignature(v, r, s).
    Execute(ctx)

// Bytecode analysis with options
stats, err := bytecode.New(code).
    WithHardfork(hardfork.Cancun).
    WithValidation().
    Analyze(ctx)
```

### 4. **Context Support Throughout**

```go
// All operations support context for cancellation/timeout
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

result, err := evm.Execute(ctx, params)
if errors.Is(err, context.DeadlineExceeded) {
    // Handle timeout
}
```

## Concurrency Model

### Thread Safety
- All public types are safe for concurrent use
- Internal synchronization using `sync.RWMutex` where needed
- No shared mutable state in public APIs

### Resource Management
- Automatic cleanup using Go finalizers
- Explicit `Close()` methods for immediate cleanup
- Resource pooling for expensive objects (EVM instances, planners)

### Goroutine Integration
- All blocking operations respect context cancellation
- No goroutines created internally unless explicitly requested
- Channel-based APIs for streaming operations where appropriate

## Error Handling Strategy

### Typed Errors
```go
type ErrorCode int

const (
    ErrOutOfGas ErrorCode = iota
    ErrStackOverflow
    ErrStackUnderflow
    ErrInvalidJump
    ErrInvalidOpcode
    ErrRevert
    // ... more error codes
)

type ExecutionError struct {
    Code    ErrorCode
    Message string
    Cause   error
}
```

### Error Wrapping
```go
// Errors implement Go's standard error wrapping
var execErr *errors.ExecutionError
if errors.As(err, &execErr) {
    switch execErr.Code {
    case errors.ErrOutOfGas:
        // Handle out of gas
    case errors.ErrRevert:
        // Handle revert with reason
    }
}
```

## Performance Considerations

### Memory Management
- Zero-copy operations for large data (bytecode, state)
- Pooling of frequently allocated objects
- Efficient C interop with minimal allocations

### Caching Strategy
- Optional plan caching in planner package
- LRU eviction for memory management
- Configurable cache sizes and policies

### Batch Operations
- Batch APIs for multiple operations
- Reduced C call overhead
- Efficient state transitions

## Testing Strategy

### Unit Testing
- Comprehensive test coverage for all packages
- Property-based testing for complex algorithms
- Benchmark tests for performance-critical paths

### Integration Testing
- End-to-end testing with real contracts
- Cross-package integration scenarios
- Performance regression testing

### Fuzz Testing
- Fuzzing of bytecode parsing and execution
- Security-focused fuzzing scenarios
- Automated vulnerability detection

## Examples and Use Cases

### 1. **Smart Contract Deployment and Execution**
```go
evm := guillotine.NewEVM()

// Deploy contract
deployResult, err := evm.Deploy(ctx, guillotine.Deployment{
    Code:      contractBytecode,
    GasLimit:  1000000,
    Value:     primitives.ZeroU256(),
})

// Call contract method
callResult, err := evm.Call(ctx, guillotine.Call{
    To:        deployResult.Address,
    Input:     methodCalldata,
    GasLimit:  100000,
})
```

### 2. **Bytecode Analysis and Optimization**
```go
// Analyze bytecode
analyzer := bytecode.New(contractCode)
stats, err := analyzer.Analyze(ctx)

fmt.Printf("Instructions: %d\n", stats.InstructionCount)
fmt.Printf("Jump destinations: %d\n", stats.JumpDestinations)
fmt.Printf("Complexity score: %f\n", stats.ComplexityScore)

// Optimize with planner
planner := planner.New()
plan, err := planner.Plan(ctx, contractCode)
```

### 3. **Precompile Integration**
```go
// Use precompiles directly
hash := precompiles.SHA256(data)
address, err := precompiles.ECRecover(messageHash, signature)
result, err := precompiles.ModExp(base, exponent, modulus)
```

### 4. **Hardfork Compatibility Testing**
```go
// Test across different hardforks
for _, hf := range hardfork.All() {
    config := guillotine.Config{Hardfork: hf}
    evm := guillotine.NewEVMWithConfig(config)
    
    result, err := evm.Execute(ctx, testCase)
    results[hf] = result
}
```

### 5. **Advanced Debugging and Tracing**
```go
// Enable detailed tracing
tracer := debug.NewTracer().
    WithInstructions().
    WithGasTracking().
    WithStorageAccess()

config := guillotine.Config{
    Tracer: tracer,
}

evm := guillotine.NewEVMWithConfig(config)
result, err := evm.Execute(ctx, params)

// Analyze trace
trace := tracer.GetTrace()
for _, step := range trace.Steps {
    fmt.Printf("PC: %d, Op: %s, Gas: %d\n", 
        step.PC, step.Opcode, step.Gas)
}
```

## Migration and Compatibility

### From Existing Code
- Backward compatibility with existing simple APIs
- Migration helpers for common patterns
- Clear upgrade paths for advanced features

### Version Management
- Semantic versioning with clear compatibility promises
- Feature flags for experimental functionality
- Deprecation warnings with migration guidance

This architecture provides a comprehensive, ergonomic, and performant Go interface to the entire GuillotineEVM C API while maintaining Go idioms and best practices throughout.