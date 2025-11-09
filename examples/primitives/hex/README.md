# Hex Primitive Examples

Comprehensive examples demonstrating the Hex primitive from `@tevm/voltaire`.

## Examples

### 1. Basic Usage (`basic-usage.ts` / `basic-usage.zig`)

Fundamental hex operations:
- Creating hex from various input types (string, bytes, number, bigint, boolean)
- Validation and type checking with `isHex`
- Converting between hex and other formats
- Size checking with `size`, `isSized`, and `assertSize`

**Run:**
```bash
# TypeScript
bun examples/primitives/hex/basic-usage.ts

# Zig
zig build run-example -- primitives/hex/basic-usage.zig
```

### 2. Hex Manipulation (`hex-manipulation.ts` / `hex-manipulation.zig`)

Advanced hex manipulation:
- Concatenating multiple hex strings
- Slicing hex data by byte indices
- Padding (left and right) for fixed-size values
- Trimming leading zeros
- XOR operations for masking and encryption
- Real-world: Building ERC20 transfer calldata

**Run:**
```bash
# TypeScript
bun examples/primitives/hex/hex-manipulation.ts

# Zig
zig build run-example -- primitives/hex/hex-manipulation.zig
```

### 3. Random and Utilities (`random-and-utilities.ts` / `random-and-utilities.zig`)

Utility functions and random generation:
- Cryptographically secure random hex generation
- Creating zero-filled hex values
- Equality checking (case-insensitive)
- Size utilities and validation
- Common Ethereum constants (zero address, empty hash)
- Array operations (filtering, sorting, uniqueness)

**Run:**
```bash
# TypeScript
bun examples/primitives/hex/random-and-utilities.ts

# Zig
zig build run-example -- primitives/hex/random-and-utilities.zig
```

### 4. Ethereum Use Cases (`ethereum-use-cases.ts` / `ethereum-use-cases.zig`)

Real-world Ethereum development patterns:
- Address handling and validation
- Function selectors and calldata encoding
- Multi-argument function calls (ERC20 approve)
- Event topics for indexed parameters
- Storage slot calculation patterns
- Transaction data manipulation
- Signature handling (ECDSA r, s, v)
- CREATE2 address calculation

**Run:**
```bash
# TypeScript
bun examples/primitives/hex/ethereum-use-cases.ts

# Zig
zig build run-example -- primitives/hex/ethereum-use-cases.zig
```

### 5. String Encoding (`string-encoding.ts` / `string-encoding.zig`)

UTF-8 string encoding and decoding:
- Basic string to hex encoding
- Multi-word strings and phrases
- Emoji and special characters (UTF-8)
- Different languages (Japanese, Russian, Arabic, Chinese)
- Smart contract strings (token name, symbol, URI)
- Error messages and revert reasons
- Function and event signatures
- ABI string encoding with padding
- Round-trip conversion verification

**Run:**
```bash
# TypeScript
bun examples/primitives/hex/string-encoding.ts

# Zig
zig build run-example -- primitives/hex/string-encoding.zig
```

### 6. Type Safety (`type-safety.ts` / `type-safety.zig`)

Compile-time type safety with `Sized<N>`:
- Type aliases for common sizes (`Hash`, `Address`, `Selector`)
- Type-safe function parameters
- Type guards with `isSized`
- Size assertions with `assertSize`
- Generic size functions
- Discriminated unions with sized types
- Arrays of typed values
- Safe conversions with null returns
- Zero values with types

**Run:**
```bash
# TypeScript
bun examples/primitives/hex/type-safety.ts

# Zig
zig build run-example -- primitives/hex/type-safety.zig
```

## Key Concepts

### Hex String Format
- Always prefixed with `0x`
- Two hex characters per byte (e.g., `0x1234` = 2 bytes)
- Case-insensitive (`0xFF` === `0xff`)
- Empty hex: `0x` (zero bytes)

### Common Ethereum Sizes
- **Hash**: 32 bytes (`Sized<32>`)
- **Address**: 20 bytes (`Sized<20>`)
- **Function Selector**: 4 bytes (`Sized<4>`)
- **U256**: 32 bytes (`Sized<32>`)
- **Signature**: 65 bytes (`Sized<65>`) - r(32) + s(32) + v(1)

### Type Safety
TypeScript examples use branded types and `Sized<N>` for compile-time safety:
```typescript
type Hash = Sized<32>
type Address = Sized<20>

const hash: Hash = Hex.assertSize(Hex.random(32), 32)
const addr: Address = Hex.assertSize(Hex('0x742d...'), 20)
```

### Tree-Shakeable API
All functions available as tree-shakeable imports:
```typescript
import { from, toBytes, concat } from '@tevm/voltaire/BrandedHex'
```

## Documentation

Full documentation available at:
- [Hex Overview](/primitives/hex)
- [Constructors](/primitives/hex/constructors)
- [Conversions](/primitives/hex/conversions)
- [Validation](/primitives/hex/validation)
- [Manipulation](/primitives/hex/manipulation)
- [Utilities](/primitives/hex/utilities)
- [Sizing](/primitives/hex/sizing)
- [BrandedHex API](/primitives/hex/branded-hex)

## Related Examples

- **Address**: Working with Ethereum addresses
- **Hash**: 32-byte hash values
- **Uint**: Unsigned integer primitives
- **Transaction**: Transaction encoding and decoding
