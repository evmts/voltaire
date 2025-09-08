# Guillotine Bun SDK

High-performance EVM implementation for Bun using FFI bindings to the Guillotine Zig EVM.

## Installation

```bash
bun add @guillotine/bun
```

## Building from Source

First, build the shared library:

```bash
cd ../..
zig build shared -Doptimize=ReleaseFast
```

Then build the TypeScript bindings:

```bash
bun build src/index.ts --outdir dist --target bun
```

## Usage

```typescript
import { createEVM, CallType, hexToBytes, bytesToHex } from "@guillotine/bun";

// Create EVM instance
const evm = createEVM({
  number: 1n,
  timestamp: BigInt(Date.now()),
  gasLimit: 30_000_000n,
  coinbase: "0x0000000000000000000000000000000000000000",
  baseFee: 1_000_000_000n,
  chainId: 1n,
});

// Set up accounts
evm.setBalance("0x1234567890123456789012345678901234567890", 10n ** 18n);

// Deploy contract
const deployResult = evm.call({
  caller: "0x1234567890123456789012345678901234567890",
  to: "0x0000000000000000000000000000000000000000",
  value: 0n,
  input: contractBytecode,
  gas: 1_000_000n,
  callType: CallType.CREATE,
});

// Execute contract call
const result = evm.call({
  caller: "0x1234567890123456789012345678901234567890",
  to: contractAddress,
  value: 0n,
  input: calldata,
  gas: 100_000n,
  callType: CallType.CALL,
});

// Clean up
evm.destroy();
```

## API Reference

### `createEVM(blockInfo: BlockInfo): GuillotineEVM`

Creates a new EVM instance with the specified block configuration.

### `GuillotineEVM`

#### Methods

- `setBalance(address: string, balance: bigint): void` - Set account balance
- `setCode(address: string, code: Uint8Array): void` - Set contract code
- `call(params: CallParams): EvmResult` - Execute an EVM call
- `simulate(params: CallParams): EvmResult` - Simulate a call without committing state
- `destroy(): void` - Clean up the EVM instance

### Types

#### `BlockInfo`
```typescript
interface BlockInfo {
  number: bigint;
  timestamp: bigint;
  gasLimit: bigint;
  coinbase: string;
  baseFee: bigint;
  chainId: bigint;
  difficulty?: bigint;
  prevRandao?: Uint8Array;
}
```

#### `CallParams`
```typescript
interface CallParams {
  caller: string;
  to: string;
  value: bigint;
  input: Uint8Array;
  gas: bigint;
  callType: CallType;
  salt?: bigint; // For CREATE2
}
```

#### `CallType`
```typescript
enum CallType {
  CALL = 0,
  DELEGATECALL = 1,
  STATICCALL = 2,
  CREATE = 3,
  CREATE2 = 4,
}
```

#### `EvmResult`
```typescript
interface EvmResult {
  success: boolean;
  gasLeft: bigint;
  output: Uint8Array;
  error?: string;
}
```

## Testing

Run the test suite:

```bash
bun test
```

## Example

See `example.ts` for a complete example of deploying and interacting with a smart contract.

```bash
bun run example.ts
```

## Performance

The Guillotine EVM is optimized for performance:
- Zero-copy FFI calls where possible
- Efficient memory management
- Native Zig performance for EVM execution
- Minimal JavaScript overhead

## License

MIT