# Performance Comparison Plan

## Objective
Compare the performance of the old EVM implementation (with nullable Operation pointers) versus the new optimized implementation (without nullable Operation pointers).

## Current State
- We have the old `src/evm` implementation checked out
- Our optimization commit is already made but not currently checked out
- We will keep benchmark code constant and only change `src/evm` files

## Key Lessons Learned
- Always verify output files are actually updated with new timestamps
- Check file contents to ensure benchmarks actually ran
- Watch for silent failures in benchmark tools
- Different benchmark runs should never have identical results

## Execution Plan

### Phase 1: Benchmark Old Implementation

1. **Verify we have old implementation**
   ```bash
   grep -n "orelse" src/evm/jump_table/jump_table.zig
   ```

2. **Clean and rebuild with ReleaseFast**
   ```bash
   rm -rf zig-cache zig-out target
   zig build build-evm-runner -Doptimize=ReleaseFast
   ```

3. **Copy optimized binary to benchmark directory**
   ```bash
   cp zig-out/bin/evm-runner bench/official/evms/zig/evm-runner
   ```

4. **Run benchmarks with reduced iterations**
   ```bash
   cd bench/official
   ./bench compare --num-runs 2 --internal-runs 2 --js-runs 1 --js-internal-runs 1 --export markdown
   ```

5. **CRITICAL: Verify results file was generated**
   ```bash
   ls -la results.md
   # Ensure file exists and has current timestamp
   cat results.md | grep -A5 "snailtracer" | grep "Guillotine"
   # Verify we have actual benchmark data
   ```

6. **Save old results**
   ```bash
   git add results.md
   git commit -m "📊 docs: save benchmark results with old implementation"
   ```

### Phase 2: Benchmark New Implementation

1. **Checkout our optimized implementation**
   ```bash
   cd /Users/williamcory/Guillotine
   git checkout HEAD -- src/evm/
   ```

2. **Verify we have new implementation**
   ```bash
   grep -n "orelse" src/evm/jump_table/jump_table.zig || echo "Good: No orelse found"
   ```

3. **Clean and rebuild with ReleaseFast**
   ```bash
   rm -rf zig-cache zig-out target
   zig build build-evm-runner -Doptimize=ReleaseFast
   ```

4. **Copy optimized binary to benchmark directory**
   ```bash
   cp zig-out/bin/evm-runner bench/official/evms/zig/evm-runner
   ```

5. **Run benchmarks with same parameters**
   ```bash
   cd bench/official
   ./bench compare --num-runs 2 --internal-runs 2 --js-runs 1 --js-internal-runs 1 --export markdown
   ```

6. **CRITICAL: Verify results file was updated**
   ```bash
   ls -la results.md
   # Check timestamp is current
   # If not updated, check for errors in benchmark output
   ```

7. **Save new results**
   ```bash
   git add results.md
   git commit -m "📊 docs: save benchmark results with optimized implementation"
   ```

### Phase 3: Compare Results

1. **View the diff**
   ```bash
   git diff HEAD~1 HEAD -- results.md
   ```

2. **Generate summary of key metrics**
   - Focus on snailtracer performance
   - Compare erc20 operations
   - Note opcode performance differences

## Key Metrics to Track

1. **snailtracer** - Compute-intensive benchmark
2. **erc20-transfer** - Common operation benchmark  
3. **ten-thousand-hashes** - Hash-intensive benchmark
4. **opcodes-arithmetic** - Basic opcode performance

## Expected Outcome

We expect to see significant performance improvements in compute-intensive benchmarks (snailtracer) due to:
- Removed null checks in hot path
- Eliminated orelse operation overhead
- Better branch prediction

The improvements should be most visible in benchmarks that execute many opcodes.