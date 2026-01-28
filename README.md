<div align="center">
  <h1>
    Ethereum primitives and cryptography
    <br/>
    <br/>
    <a href="https://voltaire.tevm.sh">
      <img width="512" height="512" alt="voltaire-logo" src="https://github.com/user-attachments/assets/409b49cb-113b-4b76-989d-762f6294e26a" />
    </a>
  </h1>
  <strong>For application development, we recommend <a href="./voltaire-effect">voltaire-effect</a> — Effect.ts integration with typed errors, services, and composable operations.</strong>
</div>

## voltaire-effect: Production-Ready Contract Interactions

```typescript
import { Effect } from 'effect'
import {
  ContractRegistryService,
  makeContractRegistry,
  Provider,
  HttpTransport
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
  Effect.provide(Provider),
  Effect.provide(HttpTransport('https://eth.llamarpc.com'))
)
```

**Features:** Typed errors, dependency injection, composable operations, tree-shakeable.

[Get started with voltaire-effect →](./voltaire-effect)

---

<div align="center">
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
</div>

## Why Voltaire?

**Modern Ethereum library built for TypeScript, Zig, Swift, and AI-assisted development.**

```typescript
import { Address, Wei, Gwei, Ether, Rlp, Abi, Keccak256, Hex } from '@tevm/voltaire'

// Type-safe addresses - casing bugs eliminated
const addr = Address('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e')
Address.toChecksummed(addr) // "0x742d35Cc..."

// Denomination safety - can't accidentally mix Wei and Ether
const value = Wei(1000000000000000000n)
Wei.toEther(value)  // 1n
Wei.toGwei(value)   // 1000000000n

// Keccak256 hashing
const selector = Keccak256.selector('transfer(address,uint256)')
// Uint8Array(4) [0xa9, 0x05, 0x9c, 0xbb]

// RLP encoding
const encoded = Rlp.encode([addr, Hex.fromNumber(42n)])

// ABI encoding
const calldata = Abi.Function.encodeParams(transferAbi, [recipient, amount])
```

### Branded Types = Type Safety

TypeScript's structural typing lets you pass a `Hash` where an `Address` is expected - both are just `0x${string}`. **Voltaire prevents this entire class of bugs:**

```typescript
// Traditional libraries - compiles fine, breaks at runtime
simulateTransfer(bytecode, address); // Wrong order - TypeScript can't catch it!

// Voltaire - compile-time error
simulateTransfer(bytecode, address);
// Error: Type 'Bytecode' is not assignable to parameter of type 'Address'
```

**Zero runtime overhead.** Brands exist only in TypeScript's type checker.

### LLM-Optimized

APIs mirror Ethereum specifications. LLMs can leverage training data from official docs instead of learning library-specific abstractions.

- **MCP Server** - `claude mcp add --transport http voltaire https://voltaire.tevm.sh/mcp`
- **Smart detection** - Docs return markdown for AI, HTML for humans
- **Eval-tested** - Comprehensive test suite validates AI can 1-shot implementations

### Multiplatform

Same API across TypeScript, Zig, and C-FFI. Works in Node.js, Bun, browsers, and any language with FFI support.

```zig
const Address = @import("primitives").Address;

pub fn main() !void {
    const address = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
    _ = address.toChecksummed();
}
```

### Tree-Shakeable

Data-first design. Import only what you need:

```typescript
// Import specific functions - excludes unused code from bundle
import { fromHex, toChecksummed } from '@tevm/voltaire/Address'
```

---

## Get Started

```bash
npm install @tevm/voltaire
```

### Three Entrypoints

Voltaire provides three entrypoints with **identical APIs**:

```typescript
import { Address, Keccak256 } from '@tevm/voltaire'        // JS (default)
import { Address, Keccak256 } from '@tevm/voltaire/wasm'   // WASM
import { Address, Keccak256 } from '@tevm/voltaire/native' // Native FFI (Bun)
```

| Entrypoint | Use Case |
|------------|----------|
| `@tevm/voltaire` | Universal compatibility - works everywhere |
| `@tevm/voltaire/wasm` | Browser/edge crypto performance |
| `@tevm/voltaire/native` | Maximum performance (Bun only) |

All entrypoints implement the same `VoltaireAPI` interface - switch by changing the import path.

**[Documentation](https://voltaire.tevm.sh/)** | **[Playground](https://voltaire.tevm.sh/playground)** | **[API Reference](https://voltaire.tevm.sh/getting-started)** | **[TypeDoc API](https://voltaire.tevm.sh/generated-api)**

---

## What's Included

### Primitives

| Primitive | Description | Key Features |
| --------- | ----------- | ------------ |
| **[Address](https://voltaire.tevm.sh/primitives/address/)** | 20-byte Ethereum address | EIP-55 checksums, CREATE/CREATE2 calculation |
| **[Transaction](https://voltaire.tevm.sh/primitives/transaction/)** | All transaction types | Legacy, EIP-1559, EIP-4844, EIP-7702 |
| **[ABI](https://voltaire.tevm.sh/primitives/abi/)** | Contract interface encoding | Functions, events, errors, constructors |
| **[RLP](https://voltaire.tevm.sh/primitives/rlp/)** | Recursive Length Prefix | Encoding/decoding for Ethereum data structures |
| **[Hex](https://voltaire.tevm.sh/primitives/hex/)** | Hexadecimal encoding | Sized types, manipulation, conversion |
| **[Uint](https://voltaire.tevm.sh/primitives/uint/)** | 256-bit unsigned integer | Wrapping arithmetic, bitwise operations |
| **[Hash](https://voltaire.tevm.sh/primitives/hash/)** | 32-byte hash type | Constant-time operations |
| **[Signature](https://voltaire.tevm.sh/primitives/signature/)** | ECDSA signatures | Secp256k1, P-256, Ed25519 |
| **[Blob](https://voltaire.tevm.sh/primitives/blob/)** | EIP-4844 blob data | 128KB blobs for rollups |
| **[Denomination](https://voltaire.tevm.sh/primitives/denomination/)** | Ether denominations | Wei, gwei, ether conversions |
| **[Ens](https://voltaire.tevm.sh/primitives/ens/)** | ENS name normalization | ENSIP-15 normalization |
| **[SIWE](https://voltaire.tevm.sh/primitives/siwe/)** | Sign-In with Ethereum | EIP-4361 authentication |

[View all 23 primitives →](https://voltaire.tevm.sh/getting-started#primitives)

### Cryptography

| Algorithm | Purpose | Key Operations |
| --------- | ------- | -------------- |
| **[Keccak256](https://voltaire.tevm.sh/crypto/keccak256/)** | Primary Ethereum hash | Address derivation, selectors, topics |
| **[Secp256k1](https://voltaire.tevm.sh/crypto/secp256k1/)** | ECDSA signing | Sign, verify, recover public key |
| **[EIP-712](https://voltaire.tevm.sh/crypto/eip712/)** | Typed data signing | Domain separation, type hashing |
| **[BN254](https://voltaire.tevm.sh/crypto/bn254/)** | zkSNARK verification | G1/G2 operations, pairing checks |
| **[KZG](https://voltaire.tevm.sh/crypto/kzg/)** | EIP-4844 blob commitments | Polynomial commitments, proofs |
| **[BIP-39](https://voltaire.tevm.sh/crypto/bip39/)** | Mnemonic phrases | 12/24-word mnemonics, seed derivation |
| **[HDWallet](https://voltaire.tevm.sh/crypto/hdwallet/)** | HD wallets | BIP-32/44 key derivation |

**Hash functions:** [SHA256](https://voltaire.tevm.sh/crypto/sha256/), [RIPEMD160](https://voltaire.tevm.sh/crypto/ripemd160/), [Blake2](https://voltaire.tevm.sh/crypto/blake2/)

**Elliptic curves:** [Ed25519](https://voltaire.tevm.sh/crypto/ed25519/), [X25519](https://voltaire.tevm.sh/crypto/x25519/), [P256](https://voltaire.tevm.sh/crypto/p256/)

**Encryption:** [AES-GCM](https://voltaire.tevm.sh/crypto/aesgcm/)

[View all 17 crypto modules →](https://voltaire.tevm.sh/getting-started#cryptography)

### EVM & Precompiles

Low-level tree-shakable EVM utilities and all 19 precompiled contracts (0x01-0x13).

- **[ecrecover](https://voltaire.tevm.sh/evm/precompiles/ecrecover/)** (0x01) - ECDSA recovery
- **[sha256](https://voltaire.tevm.sh/evm/precompiles/sha256/)** / **[ripemd160](https://voltaire.tevm.sh/evm/precompiles/ripemd160/)** (0x02-0x03) - Hash functions
- **[modexp](https://voltaire.tevm.sh/evm/precompiles/modexp/)** (0x05) - Modular exponentiation
- **[BN254](https://voltaire.tevm.sh/evm/precompiles/bn254-add/)** (0x06-0x08) - zkSNARK verification
- **[blake2f](https://voltaire.tevm.sh/evm/precompiles/blake2f/)** (0x09) - Blake2 compression
- **[KZG](https://voltaire.tevm.sh/evm/precompiles/point-evaluation/)** (0x0A) - EIP-4844 verification
- **[BLS12-381](https://voltaire.tevm.sh/evm/precompiles/bls12-381/)** (0x0B-0x13) - BLS signatures

[Precompiles Guide →](https://voltaire.tevm.sh/evm/precompiles/)

---

## Development

- Install: `pnpm install`
- Build: `pnpm build` (Zig + JS bundles + types)
- Lint: `pnpm lint:check` (no warnings) and `pnpm format`
- Test: `pnpm test:run` (single pass) or `pnpm test:coverage`
- Package checks: `pnpm lint:package`

### Documentation

- Docs content lives in `docs/` (Mintlify). Docs code samples are validated by tests in `docs/**/*.test.ts`.
- API reference is generated from JSDoc/TypeScript via `pnpm docs:api` and written to `docs/generated-api/`.
- [TypeDoc Generated API Reference](https://voltaire.tevm.sh/generated-api) - auto-generated from source.

---

## Security

> **Cryptography Implementation Status**
>
> - **Audited (Default)**: [@noble/curves](https://github.com/paulmillr/noble-curves), [@noble/hashes](https://github.com/paulmillr/noble-hashes), [arkworks](https://github.com/arkworks-rs), [blst](https://github.com/supranational/blst), [c-kzg](https://github.com/ethereum/c-kzg-4844)
> - **Unaudited**: Zig-native implementations available via build flags. Not recommended for production.

---

## Language Support

| Language | Status | Installation |
| -------- | ------ | ------------ |
| TypeScript/JavaScript | Full support | `npm install @tevm/voltaire` |
| Zig | Full support | [Build from source](https://voltaire.tevm.sh/getting-started/multiplatform#installation-by-language) |
| Swift | C-FFI bindings | See `swift/` directory |
| Go, Python, Rust, Kotlin | Planned | [Contribute →](https://github.com/evmts/voltaire/issues) |

All languages can use Voltaire via the C-FFI interface (`src/c_api.zig`).

---

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
