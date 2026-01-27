# voltaire-effect

Build Ethereum applications with typed errors, composable workflows, and testable code using Effect.ts.

## Capabilities

- **Schema Validation**: Parse and validate Ethereum data (addresses, transactions, blocks) with typed errors
- **Provider Operations**: Read blockchain state (blocks, balances, logs, transactions)
- **Transaction Signing**: Sign and send transactions with local or browser wallets
- **Contract Interaction**: Type-safe smart contract reads, writes, and event queries
- **Cryptography**: Keccak256, secp256k1, BLS12-381, HD wallets, BIP-39 mnemonics
- **Multicall**: Batch multiple RPC calls into a single request
- **Block/Event Streaming**: Real-time blockchain data with reorg detection

## Installation

```bash
pnpm add voltaire-effect @tevm/voltaire effect
```

## Usage Patterns

### Read Blockchain Data
```typescript
import { Effect } from 'effect'
import { ProviderService, Provider, HttpTransport } from 'voltaire-effect'

const program = Effect.gen(function* () {
  const provider = yield* ProviderService
  const block = yield* provider.getBlockNumber()
  const balance = yield* provider.getBalance('0x...', 'latest')
  return { block, balance }
}).pipe(
  Effect.provide(Provider),
  Effect.provide(HttpTransport('https://eth.llamarpc.com'))
)
```

### Validate Address
```typescript
import * as Address from 'voltaire-effect/primitives/Address'
import * as S from 'effect/Schema'

const addr = S.decodeSync(Address.Hex)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
```

### Send Transaction
```typescript
import { SignerService, Signer, LocalAccount, Provider, HttpTransport } from 'voltaire-effect'

const program = Effect.gen(function* () {
  const signer = yield* SignerService
  return yield* signer.sendTransaction({ to: '0x...', value: 1000000000000000000n })
}).pipe(
  Effect.provide(Signer.Live),
  Effect.provide(LocalAccount(privateKey)),
  Effect.provide(Provider),
  Effect.provide(HttpTransport('https://eth.llamarpc.com'))
)
```

### Read Contract
```typescript
import { Contract, Provider, HttpTransport } from 'voltaire-effect'

const program = Effect.gen(function* () {
  const token = yield* Contract(tokenAddress, erc20Abi)
  return yield* token.read.balanceOf(userAddress)
}).pipe(
  Effect.provide(Provider),
  Effect.provide(HttpTransport('https://eth.llamarpc.com'))
)
```

## When to Use

- Building dApps that need typed error handling
- Ethereum applications requiring testable service dependencies
- Complex workflows with retry, timeout, and fallback logic
- Projects already using Effect.ts
- When you need composable, functional Ethereum operations

## Related

- [Voltaire Core](https://voltaire.tevm.sh) - Base primitives and crypto
- [Effect.ts](https://effect.website) - Typed errors and services
- [Full Documentation](/) - Complete API reference
