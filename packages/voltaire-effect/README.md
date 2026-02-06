# voltaire-effect

Effect-TS integration for the [Voltaire](https://github.com/evmts/voltaire) Ethereum primitives library. Type-safe contract interactions with composable, error-handled operations.

## Quick Start

**viem** - implicit 3 retries hidden in transport config:
```typescript
import { createPublicClient, http } from 'viem'

const client = createPublicClient({
  transport: http('https://eth.llamarpc.com', { retryCount: 3 }) // hidden default
})

const balance = await client.readContract({
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [userAddress]
})
```

**voltaire-effect** - explicit control over retry, timeout, and composition:
```typescript
import { Effect } from 'effect'
import { ContractRegistryService, makeContractRegistry, HttpProvider } from 'voltaire-effect'

const Contracts = makeContractRegistry({
  USDC: { abi: erc20Abi, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  WETH: { abi: erc20Abi, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
})

const program = Effect.gen(function* () {
  const { USDC, WETH } = yield* ContractRegistryService
  const usdcBalance = yield* USDC.read.balanceOf(userAddress)
  const wethBalance = yield* WETH.read.balanceOf(userAddress)
  return { usdcBalance, wethBalance }
}).pipe(
  Effect.retry({ times: 3 }),           // explicit retry policy
  Effect.timeout('10 seconds'),         // explicit timeout
  Effect.provide(Contracts),
  Effect.provide(HttpProvider('https://eth.llamarpc.com'))
)

const { usdcBalance, wethBalance } = await Effect.runPromise(program)
```

**viem** - Address and Bytecode are both `0x${string}`, easily confused:
```typescript
import { type Address, type Hex } from 'viem'

const address: Address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const bytecode: Hex = '0x608060405234801561001057600080fd5b50'

// TypeScript allows this - runtime bug waiting to happen
await client.readContract({
  address: bytecode,  // oops, passed bytecode as address - compiles fine!
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [address]
})
```

**voltaire-effect** - branded types prevent mixing:
```typescript
import * as Address from '@tevm/voltaire/Address'
import * as Bytecode from '@tevm/voltaire/Bytecode'

const address = Address.from('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const bytecode = Bytecode.from('0x608060405234801561001057600080fd5b50')

await client.readContract({
  address: bytecode,  // Type error: Bytecode is not assignable to Address
  ...
})
```

### Performance: encodeFunctionData

Both encode the same calldata, but Voltaire's WASM-optimized keccak256 (used for function selectors) is ~9x faster:

**viem**:
```typescript
import { encodeFunctionData } from 'viem'

const calldata = encodeFunctionData({
  abi: erc20Abi,
  functionName: 'transfer',
  args: [recipient, amount]
})
// Throws on error - must wrap in try/catch
```

**voltaire**:
```typescript
import * as Abi from '@tevm/voltaire/Abi'

const calldata = Abi.encodeFunction(erc20Abi, 'transfer', [recipient, amount])
```

**voltaire-effect** (typed errors):
```typescript
import { Effect } from 'effect'
import { encodeFunctionData } from 'voltaire-effect/primitives/Abi'

const calldata = await Effect.runPromise(
  encodeFunctionData(erc20Abi, 'transfer', [recipient, amount])
)
// Effect<Hex, AbiItemNotFoundError | AbiEncodingError>
```

| Operation | viem | voltaire | Speedup |
|-----------|------|----------|---------|
| keccak256 (32B) | 3.22 µs | 349 ns | **9.2x** |
| keccak256 (256B) | 6.23 µs | 571 ns | **10.9x** |
| keccak256 (1KB) | 24.4 µs | 1.87 µs | **13x** |

*Benchmarks on Apple M3 Max, bun 1.3.4. Voltaire uses WASM-compiled Zig keccak256.*

## Installation

```bash
npm install voltaire-effect effect @tevm/voltaire
```

## Features

- **Contract Registry**: Define contracts once, use everywhere with full type safety
- **Typed Errors**: All operations return `Effect<A, E, R>` with precise error types
- **Composable**: Chain operations using Effect's powerful combinators
- **Services**: Dependency injection for Provider, Signer, and contracts
- **Zero Runtime Overhead**: Effect's tree-shaking keeps bundles small

## Contract Patterns

### Pre-configured Contracts (Addressed Mode)

When you provide an address, you get a fully instantiated `ContractInstance`:

```typescript
const Contracts = makeContractRegistry({
  USDC: { abi: erc20Abi, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }
})

const program = Effect.gen(function* () {
  const { USDC } = yield* ContractRegistryService
  const balance = yield* USDC.read.balanceOf(account)
  const txHash = yield* USDC.write.transfer(recipient, amount)
})
```

### Factory Pattern (No Address)

When you omit the address, you get a `ContractFactory` with an `.at()` method:

```typescript
const Contracts = makeContractRegistry({
  ERC20: { abi: erc20Abi }  // No address
})

const program = Effect.gen(function* () {
  const { ERC20 } = yield* ContractRegistryService
  const token = yield* ERC20.at(userProvidedAddress)
  const balance = yield* token.read.balanceOf(account)
})
```

### Mixed Mode

Combine both patterns:

```typescript
const Contracts = makeContractRegistry({
  // Known addresses
  USDC: { abi: erc20Abi, address: USDC_ADDRESS },
  WETH: { abi: wethAbi, address: WETH_ADDRESS },
  // Generic factories
  ERC20: { abi: erc20Abi },
  ERC721: { abi: erc721Abi }
})
```

## Single Contract Usage

For one-off contracts, use `Contract()` directly:

```typescript
import { Contract, HttpProvider } from 'voltaire-effect'

const program = Effect.gen(function* () {
  const token = yield* Contract(tokenAddress, erc20Abi)
  const balance = yield* token.read.balanceOf(userAddress)
  return balance
}).pipe(
  Effect.provide(HttpProvider('https://eth.llamarpc.com'))
)
```

## Subpath Exports

- `voltaire-effect` - Main entry (services, contracts, provider)
- `voltaire-effect/primitives` - Address, Hex, Bytes32, etc.
- `voltaire-effect/crypto` - Keccak, secp256k1, etc.

## Documentation

- [Contract Registry Service](./docs/services/contract-registry.mdx)
- [Contract Factory](./docs/services/contract.mdx)
- [Provider Service](./docs/services/provider.mdx)
- [Signer Service](./docs/services/signer.mdx)

## License

MIT
