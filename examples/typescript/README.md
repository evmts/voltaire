# TypeScript Examples

This directory contains comprehensive examples demonstrating the usage of @tevm/voltaire TypeScript API.

## Running Examples

### With Bun

```bash
bun run examples/typescript/01-hex-and-hashing.ts
bun run examples/typescript/02-rlp-encoding.ts
# etc.
```

### With Node.js

```bash
# First, ensure you have TypeScript and ts-node installed
npm install -g tsx

tsx examples/typescript/01-hex-and-hashing.ts
tsx examples/typescript/02-rlp-encoding.ts
# etc.
```

### With Deno

```bash
deno run --allow-read examples/typescript/01-hex-and-hashing.ts
deno run --allow-read examples/typescript/02-rlp-encoding.ts
# etc.
```

## Examples

### 01-hex-and-hashing.ts

Basic hex utilities and Keccak-256 hashing:
- Converting between hex strings and byte arrays
- Computing Keccak-256 hashes
- Function selectors
- Event signatures

**Topics**: hex, bytes, keccak256, function selectors, event signatures

### 02-rlp-encoding.ts

RLP (Recursive Length Prefix) encoding and decoding:
- Encoding numbers, strings, and hex values
- Encoding lists and nested structures
- Decoding RLP data
- Round-trip encoding/decoding
- Transaction-like structures

**Topics**: RLP, encoding, decoding, serialization

### 03-transactions.ts

Transaction types and encoding:
- Legacy transactions (Type 0)
- EIP-1559 transactions (Type 2)
- EIP-7702 transactions (Type 4)
- Transaction encoding for signing
- Transaction hashing
- Transaction validation
- Type detection
- Access lists
- Authorization lists
- Contract creation

**Topics**: transactions, EIP-155, EIP-1559, EIP-7702, signing

### 04-gas-calculations.ts

EIP-1559 fee market and gas calculations:
- Base fee adjustments
- Priority fee (miner tip) calculations
- Effective gas price
- Intrinsic gas costs
- Memory expansion costs
- Transaction cost breakdown

**Topics**: gas, EIP-1559, base fee, priority fee, gas costs

### 05-bytecode-analysis.ts

EVM bytecode analysis:
- Jump destination analysis
- Bytecode validation
- Opcode boundaries
- PUSH instruction handling
- Bytecode disassembly
- Finding constants in bytecode

**Topics**: bytecode, opcodes, JUMPDEST, PUSH, disassembly

### 06-siwe-and-logs.ts

SIWE messages and event logs:
- Creating SIWE messages
- Parsing SIWE messages
- Validating SIWE messages
- Checking expiration
- Parsing event logs
- Filtering logs by topics
- Event signature hashing

**Topics**: SIWE, EIP-4361, event logs, ERC20 events, filtering

## Example Structure

Each example follows this structure:

1. **Header comment** - Describes what the example demonstrates
2. **Imports** - Relevant imports from @tevm/voltaire
3. **Numbered sections** - Each major concept is in its own section
4. **Console output** - Clear, formatted output showing results
5. **Comments** - Explanations of important concepts

## Common Patterns

### Working with Hex

```typescript
import { hexToBytes, bytesToHex } from '@tevm/voltaire';

// Hex to bytes
const bytes = hexToBytes('0x1234');

// Bytes to hex
const hex = bytesToHex(bytes);
```

### Hashing Data

```typescript
import { keccak256, keccak256Hex } from '@tevm/voltaire';

// Bytes input/output
const hash = keccak256(bytes);

// Hex input/output
const hashHex = keccak256Hex('0x1234');
```

### Encoding Transactions

```typescript
import {
  encodeLegacyForSigning,
  encodeEip1559ForSigning,
  hashTransaction,
} from '@tevm/voltaire';

// Legacy transaction
const encoded = encodeLegacyForSigning(tx, chainId);

// EIP-1559 transaction
const encoded = encodeEip1559ForSigning(tx);

// Transaction hash
const hash = hashTransaction(tx);
```

### RLP Encoding

```typescript
import { encodeRlp, decodeRlp, toHex } from '@tevm/voltaire';

// Encode
const encoded = encodeRlp([1n, '0x1234', [5n, 6n]]);

// Decode
const decoded = decodeRlp(encoded);

// Convert to hex
const hex = toHex(encoded);
```

## Learning Path

Recommended order for learning:

1. **Start with basics**: 01-hex-and-hashing.ts
2. **Learn serialization**: 02-rlp-encoding.ts
3. **Understand transactions**: 03-transactions.ts
4. **Master gas calculations**: 04-gas-calculations.ts
5. **Analyze bytecode**: 05-bytecode-analysis.ts
6. **Work with events**: 06-siwe-and-logs.ts

## Additional Resources

- [TypeScript API Documentation](../../TYPESCRIPT_API.md)
- [Package README](../../PACKAGE_README.md)
- [CHANGELOG](../../CHANGELOG.md)
- [Main README](../../README.md)

## Contributing

Have an idea for a new example? Please contribute!

1. Create a new file following the naming pattern: `##-description.ts`
2. Follow the structure of existing examples
3. Include clear comments and console output
4. Update this README with your example
5. Submit a pull request

## Support

- [GitHub Issues](https://github.com/evmts/voltaire/issues)
- [Discord](https://discord.gg/tevm)
- [Documentation](https://github.com/evmts/voltaire)
