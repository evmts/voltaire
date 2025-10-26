# Wei To Gwei - Library Comparison

A detailed comparison of how each library handles the `weiToGwei` operation in the Numeric Operations category.

## Quick Reference Table

| Library | Implementation |
|---------|----------------|
| **Guil Native** | High-performance native implementation with type safety |
| **Guil WASM** | Portable WASM implementation with type safety |
| **Ethers** | Traditional JavaScript implementation |
| **Viem** | Modern, tree-shakeable implementation |

## Implementation Details

### Guil Native

Guil's native implementation leverages Zig's FFI for maximum performance through the `ReleaseFast` optimization mode.

**Key Features:**
- ✅ Maximum performance with native FFI
- ✅ Branded types for compile-time safety
- ✅ Runtime validation
- ✅ Zero-copy operations where possible
- ✅ Memory-safe Zig implementation

**Performance Profile:**
- Optimized with `ReleaseFast` mode
- Direct native bindings
- Minimal JavaScript overhead

### Guil WASM

Guil's WASM implementation provides portable performance optimized for bundle size.

**Key Features:**
- ✅ Portable across all JavaScript environments
- ✅ Branded types for compile-time safety
- ✅ Runtime validation
- ✅ Smaller bundle size with `ReleaseSmall` optimization
- ✅ Memory-safe Zig implementation

**Performance Profile:**
- Optimized with `ReleaseSmall` mode
- Portable WASM bindings
- Balance between size and speed

### Ethers

Ethers provides a battle-tested, mature implementation.

**Key Features:**
- ✅ Mature, battle-tested library
- ✅ Broad ecosystem compatibility
- ⚠️ Manual validation often required
- ⚠️ No branded types (generic strings/numbers)
- ⚠️ Runtime errors for invalid inputs

**Performance Profile:**
- Pure JavaScript implementation
- Well-optimized for common cases
- Larger bundle size

### Viem

Viem provides a modern, fast implementation with tree-shaking support.

**Key Features:**
- ✅ Modern TypeScript implementation
- ✅ Excellent tree-shaking support
- ✅ Fast performance
- ⚠️ Generic types (no specific branded types)
- ⚠️ Manual validation often required

**Performance Profile:**
- Highly optimized JavaScript
- Small bundle size (tree-shakeable)
- Fast execution

## Type Safety Comparison

### Guil (Native & WASM)

Both Guil implementations use **branded types** to provide compile-time type safety:

```typescript
// Branded types prevent mixing incompatible values
type Address = string & { readonly __brand: 'Address' };
type Hash32 = string & { readonly __brand: 'Hash32' };

// ✅ Compile-time error prevents bugs
function processAddress(addr: Address) { ... }
const hash: Hash32 = Hash32("0x...");
processAddress(hash); // TypeScript Error: Hash32 is not assignable to Address
```

**Benefits:**
- Catches type confusion at compile time
- Self-documenting code
- Better IDE support and autocomplete
- Prevents invalid operations

### Ethers

Uses generic JavaScript types:

```typescript
// Generic types - no compile-time safety
function processAddress(addr: string) { ... }
const hash = "0x..."; // Just a string
processAddress(hash); // No error - runtime risk
```

**Drawbacks:**
- No compile-time type safety
- Easy to mix incompatible values
- Requires runtime validation everywhere

### Viem

Uses generic TypeScript types:

```typescript
import { type Hex, type Address } from 'viem';

// Type aliases - limited safety
function processAddress(addr: Address) { ... }
const hash: Hex = "0x..."; // Hex is just a string alias
processAddress(hash); // TypeScript may not catch this
```

**Drawbacks:**
- Type aliases don't provide true type safety
- Can still mix incompatible values
- Requires runtime validation

## Performance Considerations

### Speed Ranking (Typical)

1. **Guil Native** - Fastest (native FFI, ReleaseFast optimization)
2. **Viem** - Fast (optimized JavaScript)
3. **Guil WASM** - Good (WASM with ReleaseSmall optimization)
4. **Ethers** - Good (mature, optimized JavaScript)

### Bundle Size Ranking

1. **Viem** - Smallest (tree-shakeable)
2. **Guil WASM** - Small (ReleaseSmall optimization)
3. **Guil Native** - Medium (native bindings)
4. **Ethers** - Larger (comprehensive library)

### Memory Safety

1. **Guil Native & WASM** - Memory-safe Zig implementation
2. **Viem** - Modern JavaScript (GC managed)
3. **Ethers** - Traditional JavaScript (GC managed)

## Best Practices

### Guil Best Practices

```typescript
// ✅ Use branded types consistently
import { Wei To Gwei } from '@tevm/primitives';

// ✅ Let the library handle validation
const result = Wei To Gwei(input);

// ✅ Type system prevents errors
function process(value: BrandedType) {
  // Guaranteed to be valid
}
```

### Ethers Best Practices

```typescript
// ⚠️ Always validate inputs
import { isValid, process } from 'ethers';

if (!isValid(input)) {
  throw new Error('Invalid input');
}
const result = process(input);
```

### Viem Best Practices

```typescript
// ⚠️ Validate when needed
import { isValid, process } from 'viem';

// Validate at boundaries
if (!isValid(input)) {
  throw new Error('Invalid input');
}
const result = process(input);
```

## When to Choose Each Library

### Choose Guil Native If:
- ✅ Maximum performance is critical
- ✅ You want compile-time type safety
- ✅ You need memory-safe cryptographic operations
- ✅ You can use native Node.js addons
- ✅ You value correctness over compatibility

### Choose Guil WASM If:
- ✅ You need portable performance
- ✅ You want compile-time type safety
- ✅ You need to run in browsers or edge environments
- ✅ You want smaller bundle sizes than native
- ✅ You value correctness and portability

### Choose Ethers If:
- ✅ You need maximum ecosystem compatibility
- ✅ You're working with existing Ethers-based code
- ✅ You need mature, battle-tested implementations
- ⚠️ You're okay with manual validation
- ⚠️ Runtime type safety is acceptable

### Choose Viem If:
- ✅ You need modern TypeScript features
- ✅ Bundle size is critical
- ✅ You want excellent tree-shaking
- ✅ You need fast JavaScript performance
- ⚠️ You're okay with generic types
- ⚠️ Runtime validation is acceptable

## Conclusion

**For new projects prioritizing correctness and type safety:** Choose Guil (Native for maximum performance, WASM for portability). The branded types provide significant safety benefits with minimal performance cost.

**For existing projects or maximum compatibility:** Stick with Ethers for its mature ecosystem and broad compatibility.

**For modern projects prioritizing bundle size:** Choose Viem for its excellent tree-shaking and performance, but be prepared to add validation where needed.

**Key Insight:** Guil's branded types catch entire classes of bugs at compile time that other libraries only catch at runtime (if validation is remembered). This makes Guil particularly valuable for mission-critical applications where correctness is paramount.
