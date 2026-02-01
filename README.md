<div align="center">
  <h1>
    Ethereum primitives and cryptography
    <br/>
    <br/>
  </h1>
    <a href="https://voltaire.tevm.sh">
      <img width="512" height="512" alt="voltaire-logo" src="https://github.com/user-attachments/assets/409b49cb-113b-4b76-989d-762f6294e26a" />
    </a>
  <sup>
    <a href="https://www.npmjs.com/package/@tevm/voltaire">
       <img src="https://img.shields.io/npm/v/@tevm/voltaire.svg" alt="npm version" />
    </a>
    <a href="https://github.com/evmts/voltaire">
       <img src="https://img.shields.io/badge/zig-0.15.1+-orange.svg" alt="zig version" />
    </a>
    <a href="https://github.com/evmts/voltaire/actions/workflows/ci.yml">
      <img src="https://github.com/evmts/voltaire/actions/workflows/ci.yml/badge.svg" alt="CI status" />
    </a>
    <a href="https://github.com/evmts/voltaire/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
    </a>
    <a href="https://github.com/evmts/voltaire/releases">
      <img src="https://img.shields.io/badge/status-beta-orange.svg" alt="Status: Beta" />
    </a>
  </sup>
  <br/>
  <a href="https://playground.tevm.sh"><strong>Try it now in live playground →</strong></a>
  <strong>For application development, we recommend <a href="https://voltaire-effect.tevm.sh">voltaire-effect</a> — Effect.ts integration with typed errors, services, and composable operations.</strong>
</div>

## Introduction

Voltaire is an high performance robust Ethereum toolchain primarily built in Zig, but extended to support many other platforms including:

- Zig (Production ready)
- TypeScript (Production ready)
  - TS/Wasm
  - Native-Bun
  - Effect.ts
- Python (Beta)
- Rust (Beta)
- Golang (Beta)
- Swift (Beta)
- Kotlin (Planned)

## Featured API: voltaire-effect

Voltaire Effect is the most robust typesafe way to build production grade ethereum applications and where we recomend most devs build their apps with.

```typescript
import { Effect } from "effect";
import {
  ContractRegistryService,
  makeContractRegistry,
  Provider,
  HttpTransport,
} from "voltaire-effect";

const Contracts = makeContractRegistry({
  USDC: {
    abi: erc20Abi,
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  WETH: {
    abi: erc20Abi,
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
});

const program = Effect.gen(function* () {
  const { USDC, WETH } = yield* ContractRegistryService;
  const usdcBalance = yield* USDC.read.balanceOf(userAddress);
  const wethBalance = yield* WETH.read.balanceOf(userAddress);
  return { usdcBalance, wethBalance };
}).pipe(
  Effect.retry({ times: 3 }),
  Effect.timeout("10 seconds"),
  Effect.provide(Contracts),
  Effect.provide(Provider),
  Effect.provide(HttpTransport("https://eth.llamarpc.com")),
);
```

**Features:** Typed errors, dependency injection, composable operations, tree-shakeable.

[Get started with voltaire-effect →](./packages/voltaire-effect)

## Dependencies

**TypeScript:** [@noble/curves](https://github.com/paulmillr/noble-curves), [@noble/hashes](https://github.com/paulmillr/noble-hashes), [@scure/bip32](https://github.com/paulmillr/scure-bip32), [@scure/bip39](https://github.com/paulmillr/scure-bip39), [abitype](https://github.com/wevm/abitype), [ox](https://github.com/wevm/ox), [whatsabi](https://github.com/shazow/whatsabi)

**Native:** [blst](https://github.com/supranational/blst), [c-kzg-4844](https://github.com/ethereum/c-kzg-4844), [arkworks](https://github.com/arkworks-rs)

---

## Links

- [Documentation](https://voltaire.tevm.sh/)
- [GitHub](https://github.com/evmts/voltaire)
- [NPM](https://www.npmjs.com/package/@tevm/voltaire)
- [Telegram](https://t.me/+ANThR9bHDLAwMjUx)
- [Twitter](https://twitter.com/tevmtools)

**Related projects:**

- [evmts/guillotine](https://github.com/evmts/guillotine) - EVM execution
- [evmts/compiler](https://github.com/evmts/compiler) - Solidity compilation

---

MIT License - see [LICENSE](./LICENSE)
