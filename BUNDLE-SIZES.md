# Bundle Size Comparison

> Generated: 2025-11-04T09:03:04.430Z

## WASM Build Modes

| Mode | Size | Optimization | Use Case |
|------|------|--------------|----------|
| ReleaseSmall (optimized for size) | 286.00 KB | Size | Production |
| ReleaseFast (optimized for speed) | 2.33 MB | Speed | Benchmarking |
| Keccak256 WASM | 252.17 KB | N/A | Hashing |

**Size Impact:** ReleaseFast is 8.34x larger than ReleaseSmall (+2099.20 KB)

## TypeScript Primitives (Tree-Shaken)

| Primitive | Size | Files |
|-----------|------|-------|




## Crypto Implementation Comparison

Comparing Keccak256 implementations:

| Implementation | Size | Type |
|----------------|------|------|
| Zig stdlib - WASM binary | 3.03 KB | keccak256.wasm |



## Recommendations

Based on bundle size analysis:

1. **Production:** Use ReleaseSmall WASM (286.00 KB)
   - Smallest bundle size
   - Good performance
   - Best for end users

2. **Benchmarking:** Use ReleaseFast WASM (2385.21 KB)
   - Maximum performance
   - Larger bundle size acceptable for testing
   - Use to compare against pure JS/TS

3. **Tree-Shaking:** Import individual primitives instead of full bundle
   - Most primitives are < 15 KB when tree-shaken
   - Allows gradual adoption

## Commands

```bash
# Build both WASM modes
bun run build:wasm

# Measure bundle sizes
bun run size

# Check size limits (CI)
bun run bench:size
```
