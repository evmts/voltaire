# Performance Optimization Outline for Guillotine EVM

## Current Performance Baseline (vs REVM)
- **snailtracer**: 2.10x slower (1481ms vs 707ms)
- **ten-thousand-hashes**: 1.94x slower (36ms vs 19ms)  
- **erc20-transfer**: 1.06x slower (73ms vs 69ms)
- **erc20-mint**: 1.06x slower (45ms vs 43ms)
- **erc20-approval-transfer**: 1.11x slower (60ms vs 54ms)
- **opcodes-push-pop**: 1.39x slower (2.08ms vs 1.50ms)

## Performance Issues by Priority

### 🟢 Phase 1: Quick Wins (Easy Implementation, High Impact)

#### 1. Issue #338/337 - Optimize memory expansion with inline wrapper
- **Complexity**: Easy - Just add inline wrapper function
- **Impact**: High - 4.6M calls can skip function overhead
- **Risk**: Low - Simple refactoring
- **Expected Gain**: 5-10% on memory-heavy benchmarks

#### 2. Issue #339 - Micro-optimize stack operations
- **Complexity**: Easy - Add `@setRuntimeSafety(false)`
- **Impact**: Medium - 18M+ calls save a few instructions each
- **Risk**: Low - Compiler hint only
- **Expected Gain**: 2-5% overall

#### 3. Issue #335 - Use single big-endian loads for PUSH
- **Complexity**: Easy - Replace loops with `std.mem.readInt`
- **Impact**: Medium - PUSH operations very common
- **Risk**: Low - Well-understood optimization
- **Expected Gain**: 10-20% on PUSH-heavy code

### 🟡 Phase 2: Moderate Complexity

#### 4. Issue #334 - Direct memory access optimization
- **Complexity**: Medium - Combine multiple API calls
- **Impact**: Medium - Reduces function call overhead
- **Risk**: Medium - Need careful testing
- **Expected Gain**: 5-10% on memory operations

#### 5. Issue #333 - Simplify precompile dispatch
- **Complexity**: Medium - Replace hashmap with array
- **Impact**: Low-Medium - Precompiles less common
- **Risk**: Low - Straightforward refactoring
- **Expected Gain**: Faster precompile execution

#### 6. Issue #332 - Remove intermediate buffers in hash precompiles
- **Complexity**: Medium - Stream data directly
- **Impact**: Low - Reduces allocations
- **Risk**: Low - Localized change
- **Expected Gain**: Less GC pressure

### 🔴 Phase 3: Complex Refactoring

#### 7. Issue #342 - Smart pre-allocation for memory/stack
- **Complexity**: High - Add profiling system
- **Impact**: High - Reduces allocation overhead significantly
- **Risk**: Medium - More complex state management
- **Expected Gain**: 50% reduction in allocation calls

#### 8. Issue #341 - Mandatory extended entries
- **Complexity**: High - Change analysis system
- **Impact**: Medium - Removes conditionals in hot path
- **Risk**: Medium - Affects contract loading
- **Expected Gain**: 1-2% overall improvement

#### 9. Issue #340 - True block-level fast path
- **Complexity**: Very High - Major interpreter refactoring
- **Impact**: Very High - Biggest potential gain
- **Risk**: High - Complex validation logic
- **Expected Gain**: 40%+ on compute-heavy benchmarks

## Recommended Implementation Order

1. **Week 1**: Complete Phase 1 (Issues #338, #339, #335)
   - Quick wins to build momentum
   - Low risk, good gains
   - Learn the codebase

2. **Week 2**: Phase 2 (Issues #334, #333, #332)
   - Moderate complexity builds on Phase 1
   - Good risk/reward ratio
   - Sets up for bigger changes

3. **Week 3-4**: Phase 3 (Issues #342, #341, #340)
   - Tackle in order of increasing complexity
   - #340 has biggest payoff but highest risk
   - May require multiple iterations

## Success Metrics

### Target Performance (vs REVM)
- **snailtracer**: 2.10x → 1.50x (29% improvement)
- **ten-thousand-hashes**: 1.94x → 1.30x (33% improvement)
- **opcodes-push-pop**: 1.39x → 1.10x (21% improvement)
- **erc20-***: 1.06-1.11x → 1.00-1.05x (5% improvement)

### Key Performance Indicators
1. Reduction in function call overhead
2. Elimination of unnecessary allocations
3. Direct memory access patterns
4. Inline hot path execution
5. Pre-computed analysis data

## Notes
- Always benchmark after each change
- Create PRs even for failed attempts (marked DO NOT MERGE)
- Stack successful changes, isolate failures
- Focus on relative performance vs REVM, not absolute times
- Small improvements compound - even 1% matters