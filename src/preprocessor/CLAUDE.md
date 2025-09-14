# CLAUDE.md - Preprocessor Module AI Context

## MISSION CRITICAL: Bytecode Analysis and Optimization

The preprocessor module analyzes and optimizes EVM bytecode before execution. **ANY error in preprocessing can cause incorrect execution or performance degradation.** Preprocessing must preserve exact EVM semantics while enabling optimizations.

## Critical Implementation Details

### Bytecode Preprocessing Pipeline
- **Static Analysis**: Identify opcode patterns and control flow
- **Jump Destination Analysis**: Build jump tables for JUMPDEST validation
- **Optimization Passes**: Apply safe bytecode transformations
- **Validation**: Ensure transformed code maintains identical behavior
- **Caching**: Store preprocessing results for reuse

### Key Responsibilities
- **Pattern Recognition**: Identify common opcode sequences for fusion
- **Control Flow Graph**: Build CFG for advanced optimizations
- **Dead Code Elimination**: Remove unreachable code sections
- **Constant Folding**: Optimize constant expressions at analysis time
- **Gas Estimation**: Predict execution costs for optimization decisions

### Critical Safety Requirements
- NEVER change observable EVM behavior
- Maintain identical gas consumption patterns
- Preserve all side effects (storage writes, events, calls)
- Handle preprocessing failures gracefully with fallback to original code
- Ensure optimizations are deterministic and reproducible

### Optimization Categories
```zig
pub const OptimizationPass = enum {
    JumpDestAnalysis,    // Required for execution safety
    PatternFusion,       // Combine common patterns
    ConstantPropagation, // Propagate known constant values
    DeadCodeElimination, // Remove unreachable code
    GasOptimization,     // Optimize gas usage patterns
};
```

### Performance Impact Analysis
- Measure preprocessing overhead vs execution speedup
- Cache preprocessing results to amortize analysis costs
- Profile optimization effectiveness on real contracts
- Balance analysis depth with preprocessing time

### Validation and Testing
- Differential testing against unoptimized execution
- Property preservation verification
- Regression testing for optimization correctness
- Fuzz testing with random bytecode patterns

### Emergency Procedures
- Disable optimizations on validation failures
- Fallback to unoptimized execution path
- Report preprocessing bugs with reproduction data
- Monitor optimization effectiveness and safety metrics

Remember: **Preprocessor optimizations must be invisible to contract execution.** Any observable behavior change can break contract assumptions and cause financial losses.