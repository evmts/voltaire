# Guillotine Bun SDK

> Experimental/PoC: This SDK is a vibecoded proof-of-concept. APIs are unstable and may change. We're looking for early users to try it and tell us what APIs you want — please open an issue or ping us on Telegram.

📚 **[View Full Documentation](https://guillotine.dev/sdks/bun)**

## Status

- Maturity: Experimental proof‑of‑concept
- API stability: Unstable; breaking changes expected
- Feedback: https://github.com/evmts/Guillotine/issues or Telegram https://t.me/+ANThR9bHDLAwMjUx

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

## Benchmarks

Bun SDK timings on local machine using official fixtures:

- erc20-mint: 0.60 ms (gasUsed: 65,703, outputLen: 2,317)
- ten-thousand-hashes: 0.23 ms (gasUsed: 21,058, outputLen: 151)
- snailtracer: 0.80 ms (gasUsed: 24,928, outputLen: 17,608)

Notes:
- Bytecode and calldata are loaded from `src/_test_utils/fixtures/<case>/{bytecode,calldata}.txt`.
- Gas limits used: erc20-mint: `5_000_000`, ten-thousand-hashes: `10_000_000`, snailtracer: `10_000_000`.
- Each case executes once; results are indicative and will vary by hardware and OS.

Reproduce locally:

1) Build the shared library

```bash
zig build shared -Doptimize=ReleaseFast
```

2) Save this as `sdks/bun/bench.ts` (adjust repo path if needed), then run it:

```ts
import { createEVM, CallType, hexToBytes } from "./src/index";
import { readFileSync } from "fs";
import { join } from "path";

function loadHexFile(p: string) {
  return hexToBytes(readFileSync(p, "utf8").trim().replace(/^0x/, ""));
}

function bench(name: string, bc: string, cd: string, gas: bigint) {
  const evm = createEVM({
    number: 1n,
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
    gasLimit: 30_000_000n,
    coinbase: "0x0000000000000000000000000000000000000000",
    baseFee: 1_000_000_000n,
    chainId: 1n,
    difficulty: 0n,
  });
  try {
    const caller = "0x1234567890123456789012345678901234567890";
    const to = "0x2222222222222222222222222222222222222222";
    evm.setBalance(caller, 10n ** 18n);
    evm.setCode(to, loadHexFile(bc));
    const calldata = loadHexFile(cd);
    const t0 = performance.now();
    const r = evm.call({ caller, to, value: 0n, input: calldata, gas, callType: CallType.CALL });
    const t1 = performance.now();
    console.log(`[${name}]`, `${(t1 - t0).toFixed(2)} ms`, `success=${r.success}`, `gasUsed=${Number(gas - r.gasLeft)}`);
  } finally { evm.destroy(); }
}

const root = process.cwd();
bench("erc20-mint", join(root, "src/_test_utils/fixtures/erc20-mint/bytecode.txt"), join(root, "src/_test_utils/fixtures/erc20-mint/calldata.txt"), 5_000_000n);
bench("ten-thousand-hashes", join(root, "src/_test_utils/fixtures/ten-thousand-hashes/bytecode.txt"), join(root, "src/_test_utils/fixtures/ten-thousand-hashes/calldata.txt"), 10_000_000n);
bench("snailtracer", join(root, "src/_test_utils/fixtures/snailtracer/bytecode.txt"), join(root, "src/_test_utils/fixtures/snailtracer/calldata.txt"), 10_000_000n);
```

Then run:

```bash
bun run sdks/bun/bench.ts
```

## License

MIT
