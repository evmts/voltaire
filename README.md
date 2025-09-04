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

**An ultrafast EVM for all languages**

---

## 🧭 Overview

The fun, ultrafast and configurable way to run the EVM. Guillotine features

* ⚡ **Extreme speed** - Zig-based Guillotine with all optimizations benchmarks as the fastest EVM implementation ever
* 🌐 **Universal** - Use guillotine on many languages and many platforms including Python, TypeScript, and even in the browser.
* 📦 **Minimal bundle size** - Size optimized configurations of Guillotine reache sizes under 110kb
* 💄 **Elegance and modularity** -  Guillotine offers 0-cost abstractions for configuring the EVM at comptime
* 🎨 **Fun** - Guillotine is a fun way to dive into zig and fun/easy to contribute to. It has extensive documentation for humans and LLMs

---

## 🚧 Development Status

**Current Status**: DO NOT USE IN PRODUCTION

Guillotine is not suitable for production use at this time. Any use of guillotine should be considered purely experimental.

---

## 📊 Benchmarks & Bundle Size

Currently benchmarks are showing Guillotine to be a hair faster than revm on most benchmarks which is extremely promising given most of our optimizations are currently disabled as we productionize the code.  See [bench/official/results.md](./bench/official/results.md) for latest.

---

## 🔁 Relationship to Tevm

Once stable, **Guillotine’s WASM build** will replace the current JavaScript EVM in [Tevm](https://node.tevm.sh).
Upgrades include:

* 🚀 **Up to 1000x performance boost**
* 📉 **300KB (75%) bundle size reduction**
* 🔧 **Foundry-compatible compiler support**
* 🧱 **Fast Ethereum library** An ultrafast utility and client library wrapping the guillotine primitives package

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

## 🙏 Dependencies & Acknowledgments

Guillotine stands on the shoulders of giants. We're grateful to:

### Runtime Dependencies
- **[c-kzg-4844](https://github.com/ethereum/c-kzg-4844)** – C KZG commitment library for EIP-4844
- **[arkworks](https://github.com/arkworks-rs)** – Rust lib for elliptic curve operations 
- **[keccak-asm](https://crates.io/crates/keccak-asm)** – Assembly-optimized Keccak-256 

### Tooling dependencies

- **[Zig](https://ziglang.org)** – The best tool for the job for building a highly customizable ultrafast EVM
- **[revm](https://github.com/bluealloy/revm)** – Rust EVM implementation used for differential testing
- **[hyperfine](https://github.com/sharkdp/hyperfine)** – Benchmarking framework for performance testing
- **[zbench](https://github.com/hendriknielaender/zBench)** – Zig specific Benchmarking framework for performance testing
- **[zig-clap](https://github.com/Hejsil/zig-clap)** – Command line argument parsing
- **[webui](https://github.com/webui-dev/webui)** – For future devtool UI

---

## 📜 License

MIT License. Free for all use. 🌍

---

## 🙏 Additional Acknowledgments

* 🏛️ **Ethereum Foundation** — for funding support
* 💬 [Tevm Telegram](https://t.me/+ANThR9bHDLAwMjUx) — for community feedback and direction and helping brainstorm the name
* 🧠 [@SamBacha](https://github.com/sambacha) — Winner of the brainstorm who came up with the name **Guillotine**
