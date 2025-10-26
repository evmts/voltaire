# ABI Benchmarks - Performance Results

## Summary

Comprehensive performance comparison of ABI encoding/decoding implementations across **guil** (@tevm/primitives), **ethers**, and **viem**.

### Overall Winner by Category

| Function | Winner | Runner-up | Performance Gap |
|----------|--------|-----------|-----------------|
| **encodeAbiParameters** | viem / guil (tie) | ethers | ~18x faster |
| **decodeAbiParameters** | guil | viem | 4x faster, 39x faster than ethers |
| **computeSelector** | guil | ethers | 1.05x faster |
| **encodeFunctionData** | guil | viem | 1.03x faster, 6.5x faster than ethers |
| **decodeFunctionData** | guil | viem | 5x faster, 25x faster than ethers |
| **encodePacked** | viem | guil | 1.17x faster, 11x faster than ethers |

## Detailed Results

### 1. encodeAbiParameters

**Test cases:** Simple (uint256) and complex (address, bytes32, arrays, strings)

| Library | ops/sec | Mean (ms) | Winner |
|---------|---------|-----------|--------|
| guil | 270,053 | 0.0037 | Runner-up |
| ethers | 14,845 | 0.0674 | Slowest |
| viem | 270,313 | 0.0037 | Fastest |

**Key takeaway:** viem and guil are essentially tied, both ~18x faster than ethers.

---

### 2. decodeAbiParameters

**Test cases:** Simple and complex parameter decoding

| Library | ops/sec | Mean (ms) | Winner |
|---------|---------|-----------|--------|
| guil | 703,308 | 0.0014 | Fastest |
| ethers | 17,993 | 0.0556 | Slowest |
| viem | 174,157 | 0.0057 | Runner-up |

**Key takeaway:** guil dominates with 4x faster than viem, 39x faster than ethers.

---

### 3. computeSelector

**Test cases:** Common ERC-20 function signatures (transfer, balanceOf, approve, transferFrom)

| Library | ops/sec | Mean (ms) | Winner |
|---------|---------|-----------|--------|
| guil | 49,337 | 0.0203 | Fastest |
| ethers | 47,198 | 0.0212 | Runner-up |
| viem | 44,431 | 0.0225 | Slowest |

**Key takeaway:** Very competitive - all three libraries perform similarly, guil marginally faster.

---

### 4. encodeFunctionData

**Test cases:** Simple transfer and complex DEX swap (5 parameters)

| Library | ops/sec | Mean (ms) | Winner |
|---------|---------|-----------|--------|
| guil | 64,422 | 0.0155 | Fastest |
| ethers | 9,918 | 0.1008 | Slowest |
| viem | 62,338 | 0.0160 | Runner-up |

**Key takeaway:** guil and viem are very close, both ~6-7x faster than ethers.

---

### 5. decodeFunctionData

**Test cases:** Decoding simple and complex function calls

| Library | ops/sec | Mean (ms) | Winner |
|---------|---------|-----------|--------|
| guil | 261,868 | 0.0038 | Fastest |
| ethers | 10,480 | 0.0954 | Slowest |
| viem | 50,978 | 0.0196 | Runner-up |

**Key takeaway:** guil is 5x faster than viem, 25x faster than ethers for decoding.

---

### 6. encodePacked

**Test cases:** Mixed types (address, uint256, string) and various integer sizes

| Library | ops/sec | Mean (ms) | Winner |
|---------|---------|-----------|--------|
| guil | 676,511 | 0.0015 | Runner-up |
| ethers | 72,621 | 0.0138 | Slowest |
| viem | 788,794 | 0.0013 | Fastest |

**Key takeaway:** viem leads, 1.17x faster than guil, 11x faster than ethers.

---

## Performance Insights

### Guil Strengths
- **Decoding dominance**: Exceptional decoding performance (4-25x faster than competitors)
- **Consistent performance**: Top 2 in 5 out of 6 categories
- **Function data**: Best at complete function call encoding/decoding

### Viem Strengths
- **Encoding speed**: Fastest at parameter encoding and packed encoding
- **Modern API**: Efficient type system with minimal overhead
- **Memory efficiency**: Optimized buffer handling

### Ethers Weaknesses
- **Significantly slower**: 6-39x slower than guil/viem in most operations
- **Heavy overhead**: Interface and AbiCoder add substantial overhead
- **Trade-off**: Feature-rich but at the cost of performance

### Performance Patterns
1. **Decoding is harder than encoding**: Guil's dominance in decoding suggests optimized parsing
2. **Simple vs Complex**: Performance gaps widen with complex data structures
3. **Ethers bottleneck**: Consistent 6-39x slowdown suggests architectural overhead
4. **Guil/Viem parity**: Both modern implementations achieve similar performance

## Test Environment

- **Runtime**: Bun
- **Benchmark tool**: Vitest bench
- **Test data**: Production-realistic scenarios (ERC-20, DEX swaps, multi-parameter functions)
- **Warmup**: Yes (vitest default)
- **Iterations**: Adaptive (vitest determines optimal sample size)

## Recommendations

### For Performance-Critical Applications
- **Decoding-heavy**: Use **guil** (4-25x faster decoding)
- **Encoding-heavy**: Use **viem** (marginal advantage)
- **Balanced workload**: Use **guil** (best overall performance)

### For General Use
- **Modern stack**: **viem** (great performance + modern API)
- **Established codebase**: **ethers** (if migration cost > performance benefit)
- **New projects**: **guil** or **viem** (both excellent)

## Running These Benchmarks

```bash
# Run all ABI benchmarks
bun run vitest bench comparisons/abi/

# Run specific benchmark
bun run vitest bench comparisons/abi/encodeAbiParameters.bench.ts
bun run vitest bench comparisons/abi/decodeAbiParameters.bench.ts
bun run vitest bench comparisons/abi/computeSelector.bench.ts
bun run vitest bench comparisons/abi/encodeFunctionData.bench.ts
bun run vitest bench comparisons/abi/decodeFunctionData.bench.ts
bun run vitest bench comparisons/abi/encodePacked.bench.ts
```

## Files Created

Total: 26 files (25 TypeScript + 1 Markdown README)

### Benchmark Suites (6)
- encodeAbiParameters.bench.ts
- decodeAbiParameters.bench.ts
- computeSelector.bench.ts
- encodeFunctionData.bench.ts
- decodeFunctionData.bench.ts
- encodePacked.bench.ts

### Implementations (18)
- 6 guil implementations (*-guil.ts)
- 6 ethers implementations (*-ethers.ts)
- 6 viem implementations (*-viem.ts)

### Documentation (2)
- README.md (setup and usage guide)
- RESULTS.md (this file - benchmark results)
- docs.ts (automated documentation generator)

---

*Benchmarks run on: October 25, 2024*
*Platform: Bun + Vitest*
*Test data: Production-realistic scenarios*
