# @tevm/primitives

> Ethereum primitives and cryptography for TypeScript and Zig

Comprehensive TypeScript implementations of Ethereum primitives with optional high-performance Zig native bindings. Zero native dependencies required for TypeScript implementations.

## Features

- **Pure TypeScript** - All primitives work in any JavaScript environment
- **Type-safe** - Full TypeScript support with comprehensive type definitions
- **Zero dependencies** (except @noble/hashes for Keccak-256)
- **Battle-tested** - Validated against Ethereum test vectors
- **Modern** - Supports latest EIPs including EIP-1559, EIP-4844, EIP-7702

## Installation

```bash
npm install @tevm/primitives
```

Or with Bun:
```bash
bun add @tevm/primitives
```

## Quick Start

```typescript
import {
  keccak256Hex,
  hexToBytes,
  bytesToHex,
  encodeRlp,
  encodeLegacyForSigning,
  calculateNextBaseFee,
  Hardfork,
  isAtLeast,
} from '@tevm/primitives';

// Keccak-256 hashing
const hash = keccak256Hex('0x1234');

// Hex utilities
const bytes = hexToBytes('0xabcd');
const hex = bytesToHex(bytes);

// RLP encoding
const encoded = encodeRlp([1n, '0x1234', bytes]);

// Transaction encoding
const tx = {
  nonce: 0n,
  gasPrice: 20000000000n,
  gasLimit: 21000n,
  to: '0x...',
  value: 1000000000000000n,
  data: '0x',
  v: 37n,
  r: '0x...',
  s: '0x...',
};
const signableData = encodeLegacyForSigning(tx, 1n);

// EIP-1559 gas calculations
const nextBaseFee = calculateNextBaseFee(
  1000000000n,  // parent base fee
  15000000n,    // parent gas used
  30000000n     // parent gas limit
);

// Hardfork comparisons
if (isAtLeast(Hardfork.CANCUN, Hardfork.LONDON)) {
  console.log('Cancun includes London features');
}
```

## What's Included

### Primitives

#### Hex Utilities
- `hexToBytes` - Convert hex string to bytes
- `bytesToHex` - Convert bytes to hex string

#### Hashing
- `keccak256` - Keccak-256 hashing (via @noble/hashes)
- `keccak256Hex` - Keccak-256 with hex input/output

#### RLP Encoding
- `encodeRlp` - Encode values to RLP format
- `decodeRlp` - Decode RLP data
- Supports strings, numbers, bigints, bytes, and nested arrays

#### Transactions
- **Legacy** (Type 0) - With EIP-155 replay protection
- **EIP-1559** (Type 2) - Fee market transactions
- **EIP-7702** (Type 4) - Authorization lists
- Transaction encoding for signing
- Transaction hashing
- Transaction validation
- Type detection and parsing

#### Bytecode Analysis
- Jump destination analysis
- Bytecode validation
- Opcode boundary checking
- PUSH data tracking

#### Opcodes
- Complete EVM opcode enumeration
- All opcodes from STOP to latest additions

#### Gas Calculations
- EIP-1559 base fee calculations
- Effective gas price computation
- Intrinsic gas costs
- Memory expansion costs
- Gas constants

#### Hardforks
- Complete hardfork enumeration
- Version comparisons
- Chronological ordering
- String parsing

#### Event Logs
- Event log parsing
- Topic filtering
- Event signature hashing
- Indexed parameter encoding

#### SIWE (EIP-4361)
- Sign-In with Ethereum message parsing
- Message formatting
- Validation
- Expiration checking

#### Precompiles
- Precompile address enumeration
- Hardfork availability checking
- Gas cost calculation (execution stubs only)

## Documentation

- [Complete API Documentation](./TYPESCRIPT_API.md)
- [CHANGELOG](./CHANGELOG.md)
- [Examples](./examples/)

## Examples

### Working with Transactions

```typescript
import {
  encodeEip1559ForSigning,
  hashTransaction,
  validateTransaction,
  type Eip1559Transaction,
} from '@tevm/primitives';

const tx: Eip1559Transaction = {
  type: "eip1559",
  chainId: 1n,
  nonce: 42n,
  maxPriorityFeePerGas: 2000000000n,
  maxFeePerGas: 100000000000n,
  gasLimit: 21000n,
  to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  value: 1000000000000000000n,
  data: '0x',
  accessList: [],
  v: 1n,
  r: '0x...',
  s: '0x...',
};

// Validate structure
if (validateTransaction(tx)) {
  // Encode for signing
  const encoded = encodeEip1559ForSigning(tx);

  // Compute hash
  const hash = hashTransaction(tx);
  console.log('Transaction hash:', hash);
}
```

### Analyzing Bytecode

```typescript
import {
  analyzeJumpDestinations,
  validateBytecode,
  isValidJumpDest,
} from '@tevm/primitives';

const bytecode = '0x608060405234801561001057600080fd5b50...';

// Validate bytecode
if (validateBytecode(bytecode)) {
  // Find all JUMPDEST positions
  const jumps = analyzeJumpDestinations(bytecode);
  console.log('Valid jump destinations:', jumps);

  // Check specific position
  const isValid = isValidJumpDest(hexToBytes(bytecode), 100);
  console.log('Position 100 is valid JUMPDEST:', isValid);
}
```

### Parsing Event Logs

```typescript
import {
  parseEventLog,
  filterLogsByTopics,
  type EventLog,
  type EventSignature,
} from '@tevm/primitives';

const logs: EventLog[] = [
  {
    address: '0x...',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000...', // from
      '0x000000000000000000000000...', // to
    ],
    data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000', // value
  },
];

const transferSignature: EventSignature = {
  name: 'Transfer',
  inputs: [
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'value', type: 'uint256', indexed: false },
  ],
};

// Parse log
const decoded = parseEventLog(logs[0], transferSignature);
console.log('Event:', decoded.eventName);
console.log('From:', decoded.args.from);
console.log('To:', decoded.args.to);

// Filter logs by topics
const filtered = filterLogsByTopics(logs, [
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  null, // any from address
  '0x...', // specific to address
]);
```

### SIWE (Sign-In with Ethereum)

```typescript
import {
  parseMessage,
  formatMessage,
  validateMessage,
  isExpired,
  type SiweMessage,
} from '@tevm/primitives';

const message = `example.com wants you to sign in with your Ethereum account:
0x1234567890123456789012345678901234567890

I accept the Terms of Service

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: abcd1234
Issued At: 2024-01-01T00:00:00.000Z`;

// Parse message
const parsed = parseMessage(message);

// Validate
if (validateMessage(parsed)) {
  // Check expiration
  if (!isExpired(parsed)) {
    // Re-format for signing
    const formatted = formatMessage(parsed);
    console.log('Valid SIWE message:', formatted);
  }
}
```

## Performance

TypeScript implementations prioritize correctness and compatibility. Performance characteristics:

- **Keccak-256**: ~2-5 MB/s (via @noble/hashes)
- **RLP**: ~10-50 MB/s (depending on data structure)
- **Hex conversions**: ~50-100 MB/s
- **Transaction encoding**: ~1-5k tx/s

For high-performance applications, consider:
- Native Zig implementations (10-100x faster)
- Native bindings via Bun FFI
- WASM builds for near-native performance in browsers

## Browser Support

Works in all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires BigInt support (all modern browsers).

## Node.js Support

- Node.js 18+ (LTS)
- Works with CommonJS and ESM

## Alternative Runtimes

- **Bun**: Full support, including FFI for native bindings
- **Deno**: Full support via npm imports

## TypeScript Support

Full TypeScript support with:
- Complete type definitions
- Generic types for flexible APIs
- Branded types for type safety
- Export maps for subpath imports

```typescript
import type {
  Transaction,
  LegacyTransaction,
  Eip1559Transaction,
  Eip7702Transaction,
  EventLog,
  SiweMessage,
  Opcode,
  Hardfork,
  PrecompileAddress,
} from '@tevm/primitives';
```

## Package Exports

```json
{
  "exports": {
    ".": {
      "types": "./types/index.d.ts",
      "import": "./dist/index.js",
      "default": "./wasm/index.js"
    },
    "./native": {
      "types": "./types/native.d.ts",
      "import": "./dist/native.js",
      "default": "./native/index.js"
    }
  }
}
```

- Main export: Pure TypeScript implementations
- `/native` export: Native Zig bindings (Bun only, optional)

## Comparison with Other Libraries

### vs ethers.js

- **Smaller**: No wallet/provider code, just primitives
- **Faster**: Optimized implementations
- **Modern**: Latest EIPs (4844, 7702)
- **Type-safe**: Better TypeScript support

### vs viem

- **Complementary**: Can be used together
- **Lower-level**: Focus on primitives, not RPC
- **Portable**: Works everywhere, not just Node/Bun

### vs ethereum-cryptography

- **Broader**: Includes transactions, RLP, ABI, etc.
- **Native option**: Zig implementations available
- **TypeScript**: Not just crypto, full primitives

## Roadmap

- [ ] ABI encoding/decoding (full implementation)
- [ ] Complete transaction parsing for all types
- [ ] Native FFI bindings for Bun
- [ ] WASM builds for browser performance
- [ ] Additional hash algorithms
- [ ] secp256k1 signatures
- [ ] EIP-712 typed data signing

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Security

This is early-stage software. While we use audited dependencies where possible (@noble/hashes), the TypeScript implementations are not audited. Use with caution in production.

### Audited Components
- @noble/hashes - widely used cryptographic library

### Not Audited
- TypeScript implementations (RLP, transactions, ABI, etc.)
- Zig implementations

Report security issues to: security@tevm.sh

## License

MIT License - see [LICENSE](./LICENSE) for details

## Related Projects

- [Guillotine](https://github.com/evmts/guillotine) - EVM execution engine using these primitives
- [Tevm](https://github.com/evmts/tevm-monorepo) - TypeScript EVM tools

## Credits

Built with:
- [@noble/hashes](https://github.com/paulmillr/noble-hashes) by Paul Miller
- [Zig](https://ziglang.org) by Andrew Kelley and contributors
- Ethereum specifications and test vectors

## Support

- [GitHub Issues](https://github.com/evmts/primitives/issues)
- [Discord](https://discord.gg/tevm)
- [Twitter](https://twitter.com/tevm_sh)

---

Made with ❤️ by the Tevm team
