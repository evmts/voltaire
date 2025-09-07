# ⚔️ Guillotine (Alpha)

<p align="center">
  <a href="https://github.com/evmts/Guillotine/actions/workflows/ci.yml">
    <img src="https://github.com/evmts/Guillotine/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  </a>
  <a href="https://t.me/+ANThR9bHDLAwMjUx">
    <img alt="Telegram" src="https://img.shields.io/badge/chat-telegram-blue.svg">
  </a>
  <a href="https://deepwiki.com/evmts/Guillotine">
    <img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki">
  </a>
</p>

<img width="833" height="444" alt="Guillotine Logo" src="https://github.com/user-attachments/assets/1effa677-d931-4453-8e98-2a70372efd91" />

**The ultrafast EVM for every language and platform**

---

## 🧭 Overview

The robust, ultrafast and configurable way to run the EVM. Guillotine features

- ⚡ **Extreme speed** - Zig-based Guillotine with all optimizations benchmarks as the fastest EVM implementation ever
- 🌐 **Universal** - 🚧 Coming soon 🚧 Guillotine is built from ground up to support many languages and many platforms including Python, TypeScript, Golang, Rust, and even in the browser!
- 📦 **Minimal bundle size** - Early benchmarks on size-optimized configurations of Guillotine reach sizes under 110kb
- 💄 **Elegance and modularity** - Guillotine offers 0-cost abstractions for configuring the EVM at comptime
- 🎨 **Fun** - Guillotine is a fun way to dive into zig and fun/easy to contribute to. It has extensive documentation for humans and LLMs
- 🧪 **Robust** - Guillotine takes testing and architecture very seriously with full unit tests for all files, a robust e2e test suite, fuzz testing, differential testing vs revm, and benchmark testing
- ✨ **Useful** - 🚧 Coming soon 🚧 Guillotine is building a powerful CLI and native app that you can think of as a local-first tenderly

---

## Full Client

Guillotine is a VM implementation (like revm) not a full node (like reth).
However, Tevm (the team behind Guillotine) plans on breaking ground on a highly-performant zig-based full client soon. This client will leverage some of guillotine's architecture to execute transactions in parallel and architect around I/O bottlenecks.

## 🚧 Development Status

**Current Status**: DO NOT USE IN PRODUCTION

Guillotine is not suitable for production use at this time. Any use of guillotine should be considered purely experimental. There are known bugs and TODOs. Follow issue tab which contains all features we want for Beta.

---

## 📊 Benchmarks & Bundle Size

### Overall Performance Summary (Per Run)

| Test Case               | Zig-Call2 | REVM     | EthereumJS | Geth     | evmone    |
| ----------------------- | --------- | -------- | ---------- | -------- | --------- |
| erc20-approval-transfer | 54.98 μs  | 4.93 ms  | 390.74 ms  | 9.04 ms  | 3.48 ms   |
| erc20-mint              | 43.90 μs  | 3.64 ms  | 411.68 ms  | 7.68 ms  | 2.17 ms   |
| erc20-transfer          | 44.83 μs  | 6.10 ms  | 508.56 ms  | 17.10 ms | 4.41 ms   |
| ten-thousand-hashes     | 69.05 μs  | 1.49 ms  | 297.77 ms  | 4.53 ms  | 952.88 μs |
| snailtracer             | 517.47 μs | 31.32 ms | 2.86 s     | 98.09 ms | 23.58 ms  |

---

## 🔁 Relationship to Tevm

Once stable, **Guillotine’s WASM build** will replace the current JavaScript EVM in [Tevm](https://node.tevm.sh).
Upgrades include:

- 🚀 **Up to 1000x performance boost**
- 📉 **300KB (75%) bundle size reduction**
- 🧱 **Fast Ethereum library** An ultrafast utility and client library wrapping the guillotine primitives package

## Using Guillotine in other languages

Unlike other EVM libraries guillotine is built to be accessible on all platforms. Whether you are using writing golang on the server, JavaScript in the browser, swift for the iphone, or python for a desktop app, guillotine ships first class sdks to use with every major platform and language.

Each language has sensible defaults for that language. For example, TypeScript defaults to optimizing for a small binary size and uses the wasm build while zig and rust optimized for maximum native performance.

COMING SOON

- Kotlin
- Golang
- Python
- TypeScript
- Rust
- Swift

## 🤝 Contributing

We welcome contributions of all kinds!

See our [Contributing Guide](CONTRIBUTING.md) to get started.

## Contributors

- [Will Cory (fucory)](https://github.com/roninjin10) - Project Lead, CEO of Tevm
- [polarzero](https://github.com/0xpolarzero) - Core Developer, CLI/App Lead
- [Vlad](https://github.com/vladfdp) - Core Developer, Cryptography Lead

## 🙏 Dependencies & Acknowledgments

Guillotine stands on the shoulders of giants. We're grateful to:

### Runtime Dependencies

- **[c-kzg-4844](https://github.com/ethereum/c-kzg-4844)** – C KZG commitment library for EIP-4844
- **[arkworks](https://github.com/arkworks-rs)** – Rust lib for elliptic curve operations
- **[keccak-asm](https://crates.io/crates/keccak-asm)** – Assembly-optimized Keccak-256

### Tooling dependencies

- **[Zig](https://ziglang.org)** – The best tool for the job for building a highly customizable ultrafast EVM
- **[zbench](https://github.com/hendriknielaender/zBench)** – Zig specific Benchmarking framework for performance regression testing
- **[foundry-compilers](https://github.com/foundry-rs/compilers)** – Rust solc wrapper wrapped in zig and used internally as a zig library for building contracts.

---

## 📜 License

MIT License. Free for all use. 🌍

---

## 🙏 Additional Acknowledgments

- 🏛️ **Ethereum Foundation** — for funding support
- 💬 [Tevm Telegram](https://t.me/+ANThR9bHDLAwMjUx) — for community feedback and direction and helping brainstorm the name
- 🧠 [@SamBacha](https://github.com/sambacha) — Winner of the brainstorm who came up with the name **Guillotine**
