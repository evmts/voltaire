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

Guillotine is a VM implementation (like [revm](https://github.com/bluealloy/revm)) not a full node (like [reth](https://github.com/paradigmxyz/reth)).
However, [Tevm](https://github.com/evmts/tevm-monorepo) (the team behind Guillotine) plans on breaking ground on a highly-performant zig-based full client soon. This client will leverage some of guillotine's architecture to execute transactions in parallel and architect around I/O bottlenecks.

## 🚧 Development Status

**Current Status**: DO NOT USE IN PRODUCTION

Guillotine is not suitable for production use at this time. Any use of guillotine should be considered purely experimental. There are known bugs and TODOs. Follow [issue tab](https://github.com/evmts/Guillotine/issues) which contains all features we want for Beta.

---

## 📊 Benchmarks & Bundle Size

Guillotine is fast.

Benchmarks so far are looking very promising with Guillotine showing measurable performance gains over [Revm](https://github.com/bluealloy/revm) and performance on par with [Evmone](https://github.com/ethereum/evmone). Based on past benchmarks for optimizations currently not included, we expect these benchmarks to continue to improve.

## Why is guillotine fast

Guillotine was built using [data-oriented design](https://www.youtube.com/watch?v=rX0ItVEVjHc) with an emphasis on minimizing branch-prediction misses in the CPU. We studied every EVM implementation as well as [Wasm](https://webassembly.org/), [Lua](https://www.lua.org/), and [Python](https://www.python.org/) interpreter implementations for the state of the art. Optimizations include from most impactful to least impactful:

- An extremely optimized StackFrame and opcode dispatch datastructure
- [Indirect threading via tailcall recursion](https://news.ycombinator.com/item?id=43317592) (for excellent CPU branch prediction)
- Highly microoptimized opcode instruction handlers
- Highly microoptimized evm stack implementation
- Opcode fusions turning common opcode patterns into a single dispatch
- Batching calculation of static gas costs and stack analysis

There are many more optimizations that have not been implemented yet. The biggest of which will be translating our stack-based EVM into a register based EVM, a common technique used by [Wasm](https://webassembly.org/) and [Python](https://www.python.org/) interpreters that can get up to 30% performance increases.

### Overall Performance Summary (Per Run)

| Test Case               | Zig-Call2 | REVM     | Geth     | evmone   |
| ----------------------- | --------- | -------- | -------- | -------- |
| erc20-approval-transfer | 1.59 ms   | 1.67 ms  | 3.65 ms  | 1.56 ms  |
| erc20-mint              | 4.28 ms   | 5.76 ms  | 12.84 ms | 4.26 ms  |
| erc20-transfer          | 6.65 ms   | 8.30 ms  | 17.50 ms | 6.01 ms  |
| ten-thousand-hashes     | 2.46 ms   | 3.31 ms  | 9.36 ms  | 2.90 ms  |
| snailtracer             | 26.41 ms  | 39.01 ms | 86.02 ms | 27.15 ms |

---

### Customizablility

Guillotine follows in the footsteps of [Revm](https://github.com/bluealloy/revm) providing an even more highly customizable EVM SDK implementation.

**With Guillotine you can easily create your own EVM implementation!**

Utilizing [Zig](https://ziglang.org/) comptime, the Guillotine customizations are much simpler abstractions than the [revm](https://github.com/bluealloy/revm) abstractions. No need to learn complex generics or configuring feature flags.

Available customizations include

- Powerful EVM configuration options all with defaults
- This config object can even configure the default Word size from u256 to larger or smaller uint values
- Datatypes are dynamically lowered based on configuration such as max code size to maximize performance by using only the smallest datatype necessary for types like bytecode PC
- Powerful comptime checks make sure your configuration is valid
- Configure any hardfork or EIP
- Add or override any new opcodes or precompiles to the EVM
- A powerful but simple Tracer interface for introspecting the EVM

All customizations are offered as 0 cost compiletime abstractions using the powerful but simple [Zig](https://ziglang.org/) comptime so customizatiosn never sacrifice runtime performance and your bundle size will only include the features you choose to use.

For most users who don't need customizations we offer default options for all hardforks.

## Using Guillotine in other languages

Unlike other EVM libraries guillotine is built to be accessible on all platforms. Whether you are using writing golang on the server, JavaScript in the browser, swift for the iphone, or python for a desktop app, guillotine ships first class sdks to use with every major platform and language.

Each language has sensible defaults for that language. For example, TypeScript defaults to optimizing for a small binary size and uses the wasm build while Zig and Rust optimized for maximum native performance.

COMING SOON

- Kotlin
- Golang
- Python
- TypeScript
- Rust
- Swift

## 🔁 Relationship to Tevm

Once stable, **Guillotine’s WASM build** will replace the current JavaScript EVM in [Tevm](https://node.tevm.sh).
Upgrades include:

- 🚀 **Up to 1000x performance boost**
- 📉 **300KB (75%) bundle size reduction**
- 🧱 **Fast Ethereum library** An ultrafast utility and client library wrapping the guillotine primitives package

## 🤝 Contributing

We welcome contributions of all kinds, including AI-assisted contributions (with proper disclosure)!

See our [Contributing Guide](./CONTRIBUTING.md) to get started.

## Contributors

- [Will Cory (fucory)](https://github.com/roninjin10) - Project Lead, CEO of [Tevm](https://github.com/evmts/tevm-monorepo)
- [polarzero](https://github.com/0xpolarzero) - Core Developer, CLI/App Lead
- [Vlad](https://github.com/vladfdp) - Core Developer, Cryptography Lead

## 🙏 Dependencies & Acknowledgments

Guillotine stands on the shoulders of giants. We're grateful to:

### Reference Implementations

We deeply appreciate the excellent EVM implementations that served as references and inspiration:

- **[Revm](https://github.com/bluealloy/revm)** – Rust EVM implementation that pioneered many optimizations and customization patterns
- **[Evmone](https://github.com/ethereum/evmone)** – C++ EVM implementation known for its exceptional performance
- **[Geth](https://github.com/ethereum/go-ethereum)** – The canonical Go Ethereum client and EVM implementation
- **[EthereumJS](https://github.com/ethereumjs/ethereumjs-monorepo)** – JavaScript/TypeScript EVM implementation providing valuable insights

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
