# Fix Missing Bytes Module Exports

<issue>
<metadata>
  <priority>P2</priority>
  <category>api-completeness</category>
  <complexity>low</complexity>
  <estimated_effort>30 minutes</estimated_effort>
  <files>
    - src/primitives/Bytes/index.ts
    - src/primitives/Bytes/equals.ts
    - src/primitives/Bytes/concat.ts
    - src/primitives/Bytes/size.ts
    - src/primitives/Bytes/toString.ts
  </files>
  <related_reviews>
    - 105-exports-structure-review.md
    - 095-api-consistency-review.md
  </related_reviews>
</metadata>

<context>
## Namespace Import Pattern
Voltaire uses a namespace import pattern where users import entire modules:
```typescript
import * as Bytes from "voltaire-effect/primitives/Bytes";
Bytes.concat([a, b]);  // Use via namespace
```

This pattern enables:
- Tree-shaking for unused functions
- Discoverability via autocomplete
- Consistent API across all primitive modules (Address, Hex, Hash, etc.)

## Viem API Surface
Viem provides a comprehensive Bytes utility module with functions like:
- `concat` - Join multiple byte arrays
- `isBytes` - Type guard
- `slice` - Extract portion
- `pad` - Pad to length
- `size` - Get byte length

Voltaire should match this API surface for parity.
</context>

<problem>
Bytes module has utility functions implemented but not exported from the index, making them inaccessible via namespace imports.

```typescript
// Files exist but may not be exported from index.ts:
// src/primitives/Bytes/equals.ts   - compare byte arrays
// src/primitives/Bytes/concat.ts   - join byte arrays
// src/primitives/Bytes/size.ts     - get length
// src/primitives/Bytes/toString.ts - convert to string

// User expects:
import * as Bytes from "voltaire-effect/primitives/Bytes";
Bytes.equals(a, b);   // ❌ Possibly undefined
Bytes.concat([a, b]); // ❌ Possibly undefined
```

**Impact:**
- Breaks namespace import pattern used throughout voltaire-effect
- Forces users to import from deep paths
- Incomplete API surface compared to viem
- Confuses users who see files exist but can't access functions
</problem>

<solution>
Ensure all utility functions are exported from index.ts with complete API surface:

```typescript
// src/primitives/Bytes/index.ts

// Type exports
export type { BytesType } from "./BytesType.js";
export { BytesSchema } from "./BytesSchema.js";

// Construction
export { from } from "./from.js";
export { random } from "./random.js";
export { fromHex } from "./fromHex.js";

// Conversion
export { toHex } from "./toHex.js";
export { toString } from "./toString.js";

// Operations
export { equals } from "./equals.js";
export { concat } from "./concat.js";
export { slice } from "./slice.js";
export { padLeft, padRight } from "./pad.js";

// Inspection
export { size } from "./size.js";
export { isBytes } from "./isBytes.js";
```

Verify complete API surface:
```typescript
import * as Bytes from "voltaire-effect/primitives/Bytes";

// Construction
Bytes.from(data);          // from various inputs
Bytes.random(32);          // cryptographic random
Bytes.fromHex("0x...");    // from hex string

// Operations
Bytes.equals(a, b);        // constant-time compare
Bytes.concat([a, b, c]);   // join arrays
Bytes.slice(data, 0, 10);  // extract portion
Bytes.padLeft(data, 32);   // left pad to length
Bytes.padRight(data, 32);  // right pad to length

// Conversion
Bytes.toHex(data);         // to hex string
Bytes.toString(data);      // to utf-8 string

// Inspection
Bytes.size(data);          // get byte length
Bytes.isBytes(value);      // type guard
```
</solution>

<implementation>
<steps>
1. Audit `src/primitives/Bytes/` directory for all implemented functions
2. List all `.ts` and `.js` files that export public functions
3. Cross-reference with index.ts exports
4. Add missing exports to index.ts
5. Run `pnpm build` to verify no circular dependencies
6. Run tests to ensure all exports work correctly
</steps>

<patterns>
- **Namespace export pattern**: `export * as Bytes from "./Bytes/index.js"`
- **One function per file**: Each utility in its own file with index aggregation
- **Consistent API surface**: All primitive modules should have similar patterns
- **Internal vs public**: Prefix internal helpers with `_` if needed
</patterns>

<viem_reference>
Viem Bytes utilities:
- [src/utils/data/concat.ts](https://github.com/wevm/viem/blob/main/src/utils/data/concat.ts)
- [src/utils/data/isBytes.ts](https://github.com/wevm/viem/blob/main/src/utils/data/isBytes.ts)
- [src/utils/data/pad.ts](https://github.com/wevm/viem/blob/main/src/utils/data/pad.ts)
- [src/utils/data/slice.ts](https://github.com/wevm/viem/blob/main/src/utils/data/slice.ts)
- [src/utils/data/size.ts](https://github.com/wevm/viem/blob/main/src/utils/data/size.ts)
</viem_reference>

<voltaire_reference>
- [src/primitives/Bytes/](file:///Users/williamcory/voltaire/src/primitives/Bytes/) - Core implementations
- [src/primitives/Address/index.ts](file:///Users/williamcory/voltaire/src/primitives/Address/index.ts) - Reference for complete exports
- [src/primitives/Hex/index.ts](file:///Users/williamcory/voltaire/src/primitives/Hex/index.ts) - Reference for complete exports
</voltaire_reference>
</implementation>

<tests>
```typescript
// src/primitives/Bytes/exports.test.ts
import { describe, it, expect } from "vitest";
import * as Bytes from "./index.js";

describe("Bytes module exports", () => {
  describe("construction functions", () => {
    it("exports from", () => {
      expect(typeof Bytes.from).toBe("function");
    });

    it("exports random", () => {
      expect(typeof Bytes.random).toBe("function");
      const rand = Bytes.random(32);
      expect(rand).toBeInstanceOf(Uint8Array);
      expect(rand.length).toBe(32);
    });

    it("exports fromHex", () => {
      expect(typeof Bytes.fromHex).toBe("function");
    });
  });

  describe("operation functions", () => {
    it("exports equals", () => {
      expect(typeof Bytes.equals).toBe("function");
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3]);
      const c = new Uint8Array([1, 2, 4]);
      expect(Bytes.equals(a, b)).toBe(true);
      expect(Bytes.equals(a, c)).toBe(false);
    });

    it("exports concat", () => {
      expect(typeof Bytes.concat).toBe("function");
      const result = Bytes.concat([
        new Uint8Array([1, 2]),
        new Uint8Array([3, 4]),
      ]);
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4]));
    });

    it("exports slice", () => {
      expect(typeof Bytes.slice).toBe("function");
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      expect(Bytes.slice(data, 1, 4)).toEqual(new Uint8Array([2, 3, 4]));
    });

    it("exports padLeft", () => {
      expect(typeof Bytes.padLeft).toBe("function");
      const data = new Uint8Array([1, 2]);
      const padded = Bytes.padLeft(data, 4);
      expect(padded).toEqual(new Uint8Array([0, 0, 1, 2]));
    });

    it("exports padRight", () => {
      expect(typeof Bytes.padRight).toBe("function");
      const data = new Uint8Array([1, 2]);
      const padded = Bytes.padRight(data, 4);
      expect(padded).toEqual(new Uint8Array([1, 2, 0, 0]));
    });
  });

  describe("conversion functions", () => {
    it("exports toHex", () => {
      expect(typeof Bytes.toHex).toBe("function");
      const hex = Bytes.toHex(new Uint8Array([0xab, 0xcd]));
      expect(hex).toBe("0xabcd");
    });

    it("exports toString", () => {
      expect(typeof Bytes.toString).toBe("function");
    });
  });

  describe("inspection functions", () => {
    it("exports size", () => {
      expect(typeof Bytes.size).toBe("function");
      expect(Bytes.size(new Uint8Array(10))).toBe(10);
    });

    it("exports isBytes", () => {
      expect(typeof Bytes.isBytes).toBe("function");
      expect(Bytes.isBytes(new Uint8Array(5))).toBe(true);
      expect(Bytes.isBytes("not bytes")).toBe(false);
      expect(Bytes.isBytes([1, 2, 3])).toBe(false);
    });
  });

  describe("complete API surface", () => {
    it("exports all expected utilities via namespace", () => {
      const expected = [
        // Construction
        "from", "random", "fromHex",
        // Operations
        "equals", "concat", "slice", "padLeft", "padRight",
        // Conversion
        "toHex", "toString",
        // Inspection
        "size", "isBytes",
      ];
      
      for (const name of expected) {
        expect(name in Bytes, `Missing export: ${name}`).toBe(true);
      }
    });
  });
});

describe("Bytes.equals", () => {
  it("handles empty arrays", () => {
    expect(Bytes.equals(new Uint8Array(0), new Uint8Array(0))).toBe(true);
  });

  it("handles different lengths", () => {
    expect(Bytes.equals(new Uint8Array(3), new Uint8Array(4))).toBe(false);
  });

  it("is constant-time for same-length arrays", () => {
    const a = new Uint8Array(1000).fill(0);
    const b = new Uint8Array(1000).fill(0);
    b[999] = 1; // Different only at end
    
    const c = new Uint8Array(1000).fill(0);
    c[0] = 1; // Different at start
    
    // Should take same time regardless of where difference is
    expect(Bytes.equals(a, b)).toBe(false);
    expect(Bytes.equals(a, c)).toBe(false);
  });
});

describe("Bytes.concat", () => {
  it("handles empty input array", () => {
    expect(Bytes.concat([])).toEqual(new Uint8Array(0));
  });

  it("handles single array", () => {
    const single = new Uint8Array([1, 2, 3]);
    expect(Bytes.concat([single])).toEqual(single);
  });

  it("handles many arrays", () => {
    const arrays = Array.from({ length: 100 }, (_, i) => new Uint8Array([i]));
    const result = Bytes.concat(arrays);
    expect(result.length).toBe(100);
  });
});
```
</tests>

<docs>
```typescript
/**
 * @module Bytes
 * @description Byte array utilities for Ethereum primitives.
 * 
 * Provides construction, manipulation, and conversion utilities for
 * working with byte arrays (Uint8Array) in Ethereum contexts.
 * 
 * ## Construction
 * - `from(data)` - Create from various input types
 * - `random(length)` - Generate cryptographically secure random bytes
 * - `fromHex(hex)` - Parse from hex string
 * 
 * ## Operations
 * - `equals(a, b)` - Constant-time comparison (security-safe)
 * - `concat([a, b, c])` - Concatenate multiple byte arrays
 * - `slice(data, start, end)` - Extract a portion
 * - `padLeft(data, length)` - Left-pad with zeros
 * - `padRight(data, length)` - Right-pad with zeros
 * 
 * ## Conversion
 * - `toHex(data)` - Convert to hex string with 0x prefix
 * - `toString(data)` - Convert to UTF-8 string
 * 
 * ## Inspection
 * - `size(data)` - Get byte length
 * - `isBytes(value)` - Type guard for Uint8Array
 * 
 * @example
 * ```typescript
 * import * as Bytes from 'voltaire-effect/primitives/Bytes'
 * 
 * // Create and manipulate
 * const data = Bytes.random(32)
 * const combined = Bytes.concat([prefix, data, suffix])
 * const first10 = Bytes.slice(combined, 0, 10)
 * 
 * // Compare safely (constant-time)
 * if (Bytes.equals(hash1, hash2)) {
 *   console.log('Hashes match')
 * }
 * 
 * // Inspect
 * console.log('Size:', Bytes.size(data))
 * console.log('Hex:', Bytes.toHex(data))
 * ```
 */
```
</docs>

<api>
<before>
```typescript
// Incomplete exports - some utilities missing
import * as Bytes from "voltaire-effect/primitives/Bytes";
Bytes.random(32);   // ✅ works
Bytes.equals(a, b); // ❌ may not exist
Bytes.concat([]);   // ❌ may not exist
Bytes.size(data);   // ❌ may not exist
```
</before>

<after>
```typescript
// Complete API surface matching viem
import * as Bytes from "voltaire-effect/primitives/Bytes";

// All utilities available
Bytes.from(data);           // ✅ flexible constructor
Bytes.random(32);           // ✅ secure random
Bytes.fromHex("0x...");     // ✅ from hex

Bytes.equals(a, b);         // ✅ constant-time compare
Bytes.concat([a, b]);       // ✅ join arrays
Bytes.slice(data, 0, 10);   // ✅ extract portion
Bytes.padLeft(data, 32);    // ✅ left pad
Bytes.padRight(data, 32);   // ✅ right pad

Bytes.toHex(data);          // ✅ to hex string
Bytes.toString(data);       // ✅ to utf-8

Bytes.size(data);           // ✅ byte length
Bytes.isBytes(value);       // ✅ type guard
```
</after>
</api>

<acceptance_criteria>
- [ ] Audit all files in src/primitives/Bytes/
- [ ] Add missing exports to index.ts
- [ ] Verify `from`, `random`, `fromHex` are exported
- [ ] Verify `equals`, `concat`, `slice`, `padLeft`, `padRight` are exported
- [ ] Verify `toHex`, `toString` are exported
- [ ] Verify `size`, `isBytes` are exported
- [ ] Run `pnpm build` - no circular dependency errors
- [ ] Run `pnpm test` - all tests pass
- [ ] Add exports.test.ts to verify complete API surface
</acceptance_criteria>

<references>
- [Review 105: Exports structure review](file:///Users/williamcory/voltaire/voltaire-effect/reviews/105-exports-structure-review.md)
- [Viem toBytes utilities](https://viem.sh/docs/utilities/toBytes)
- [Voltaire namespace pattern](file:///Users/williamcory/voltaire/src/primitives/Address/index.ts)
</references>
</issue>
