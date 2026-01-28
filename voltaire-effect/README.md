# voltaire-effect

Effect-TS integration for the [Voltaire](https://github.com/evmts/voltaire) Ethereum primitives library. Type-safe contract interactions with composable, error-handled operations.

## Quick Start

```typescript
import { Effect } from 'effect'
import {
  ContractRegistryService,
  makeContractRegistry,
  HttpProvider
} from 'voltaire-effect'

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
  Effect.retry({ times: 3 }),
  Effect.timeout('10 seconds'),
  Effect.provide(Contracts),
  Effect.provide(HttpProvider('https://eth.llamarpc.com'))
)
```

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
