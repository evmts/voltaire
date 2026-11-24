# voltaire-effect

Effect 4 integration for the [Voltaire](https://github.com/evmts/voltaire) Ethereum primitives and cryptography library — written in [VibeLang](https://vibelang.sh) and compiled to standard ESM JavaScript + TypeScript declarations.

## What's New in v2

- **Built for Effect 4.1.1 & VibeLang**: Idiomatic `service`, `error`, `data`, `match`, `provide`, `try.all`, `try.any`, and `effect function*` stream producers — compiled cleanly to `.js` + `.d.ts` so both VibeLang and plain Effect 4 TypeScript consumers work seamlessly.
- **Zero hidden throws (`EK0403`) & pure platform boundaries (`EK4402`)**: Every throwing `@tevm/voltaire` call is bridged into typed errors (`InvalidAddressError`, `AbiEncodeError`, `ContractRevertError`, etc.), and all timers/randomness/clocks run through Effect `Clock` and `Random` for 100% deterministic `TestClock` tests.
- **One-line Providers & Effect 4 `Context.Reference` config**: Replace Effect 3 multi-layer ceremony and `FiberRef`s with `HttpProvider(url)` + `RpcTimeout` / `RpcRetry` / `RpcTracing` / `RpcHooks`.
- **Effect 4 `RequestResolver` batching**: `BatchTransport` collapses concurrent RPC calls into JSON-RPC 2.0 batches with deduplication, delay windows, optional LRU caching, and OpenTelemetry spans.
- **Automatic ABI revert decoding**: `Contract` and `multicall` automatically decode `Error(string)`, `Panic(uint256)` (with Solidity panic descriptions), and ABI custom errors into `ContractRevertError`.
- **Concurrent transaction preparation & atomic nonces**: `Signer.prepareTransaction` fetches nonce, chain ID, gas estimate, and EIP-1559/blob fees in parallel (`try.all`), backed by a per-address `Semaphore(1)` `NonceManager` to prevent concurrent nonce collisions.
- **Reorg-aware streams**: `watchBlocks` (parentHash verification + `Reorg` events), `backfillLogs` (adaptive chunk-size halving on RPC range limits), and `watchTransactionStatus` (`Pending` → `Included` → `Confirmed` / `Reorged`).
- **Zero skipped tests**: Full `@effect/vitest` coverage across primitives, crypto, transports, providers, chains (including Hoodi), Multicall3, ENS, signers, contracts, standards, and streams.

## Quick Start

### VibeLang

```vibe
import { Contract, ERC20_ABI, HttpProvider, makeContractRegistry } from "voltaire-effect"

const Contracts = makeContractRegistry({
  USDC: { abi: ERC20_ABI, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  ERC20: { abi: ERC20_ABI }
})

export effect function main(user: `0x${string}`) {
  provide HttpProvider("https://eth.llamarpc.com"), Contracts.layer {
    const { USDC, ERC20 } = try Contracts.Service
    const weth = try ERC20.at("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
    const [usdcBalance, wethBalance] = try.all [
      USDC.read.balanceOf(user),
      weth.read.balanceOf(user)
    ]
    return { usdcBalance, wethBalance }
  }
}
```

### Effect 4 TypeScript

```ts
import { Effect } from "effect"
import { Contract, ERC20_ABI, HttpProvider, getBlockNumber } from "voltaire-effect"

const program = Effect.gen(function* () {
  const blockNumber = yield* getBlockNumber()
  const usdc = yield* Contract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", ERC20_ABI)
  const balance = yield* usdc.read.balanceOf("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
  return { blockNumber, balance }
}).pipe(Effect.provide(HttpProvider("https://eth.llamarpc.com")))

const result = await Effect.runPromise(program)
```

## Subpath Exports

- `voltaire-effect` — Top-level ergonomic exports for everyday workflows
- `voltaire-effect/errors` — Tagged errors & `RevertReason` / `TransportFailureReason` data unions
- `voltaire-effect/primitives` — Effect 4 Schemas & constructors (`Address`, `Hex`, `Hash`, `Uint`, `Unit`, `Signature`, `Abi`, `Transaction`, `Siwe`)
- `voltaire-effect/crypto` — `CryptoLive` & individual crypto services (`Keccak`, `Secp256k1`, `Sha256`, `Blake2`, `Ripemd160`, `Hmac`, `P256`, `Ed25519`, `AesGcm`, `Eip712`, `Bip39`, `HdWallet`, `Signing` / ERC-6492)
- `voltaire-effect/transport` — `Transport`, `HttpTransport`, `HttpTransportFetch`, `BatchTransport`, `FallbackTransport`, `RateLimitedTransport`, `CustomTransport`, `TestTransport`, `Context.Reference` config overrides
- `voltaire-effect/provider` — Schema-decoded JSON-RPC actions, `HttpProvider`, `FallbackProvider`, `TestProvider`, `Chain` configs (`mainnet`, `sepolia`, `hoodi`, `optimism`, `arbitrum`, `base`, `polygon`), Multicall3 (`multicall`, `aggregate3`, `MULTICALL3_ADDRESS`), `Ens`
- `voltaire-effect/signer` — `Account` (`LocalAccount`, `MnemonicAccount`, `JsonRpcAccount`), `NonceManager`, `Signer` (`SignerFromPrivateKey`, `SignerFromMnemonic`, EIP-7702)
- `voltaire-effect/contract` — Type-safe `Contract` factory & `makeContractRegistry`
- `voltaire-effect/standards` — `ERC20_ABI`, `ERC721_ABI`, `ERC1155_ABI`, `ERC165_ABI`, `INTERFACE_IDS` & helpers (`erc20BalanceOf`, `erc20Transfer`, `erc721OwnerOf`, `supportsInterface`)
- `voltaire-effect/streams` — `watchBlocks`, `backfillLogs`, `watchLogs`, `watchTransactionStatus`
- `voltaire-effect/services` — Unified services & layers barrel

## Scripts

Run from `packages/voltaire-effect` (or use `pnpm --filter voltaire-effect <script>` from the repository root):

```sh
pnpm run typecheck   # vibelang --noEmit
pnpm run build       # vibelang -p tsconfig.build.json (emits dist/*.js + dist/*.d.ts)
pnpm run test:run    # vitest run
```

## License

MIT
