# ⚔️ Guillotine (Pre-Alpha)

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

**A very fast EVM written in Zig**

---

## 🧭 Overview

**Guillotine** is a new EVM implementation built in [Zig](https://ziglang.org) by [@FUCORY](https://x.com/FUCORY), the creator of [Tevm](https://tevm.sh). It’s designed for:

* 🕸️ **Browser-readiness**
* ⚡ **Extreme speed**
* 📦 **Minimal bundle size**
* 💄 **elegance and modularity**

Despite its early status, it's already very fast and vrey tiny.

---

## 🚧 Development Status

We’re wrapping up the **Alpha release**. We will be testing vs all ethereum hardforks and doing extensive benchmarking. Expect benchmarks and bundle size reports **within a week**. Stay tuned!

---

## 📊 Benchmarks & Bundle Size

💥 Official benchmarks and bundle size reports will be included with the **Alpha drop**.
You can expect:

* ⏱️ **Massive performance boosts**
* 🪶 **Significant bundle size reduction**

Compared to any other EVM implementation before

---

## 🧩 Subpackages

Guillotine is a modular Ethereum stack in Zig:

* [`primitives`](./src/primitives/) — Low-level Ethereum utilities (like Alloy or Ethers.js in Zig)
* [`compilers`](./src/compilers/) — Zig bindings for the Foundry compiler (Rust)
* [`crypto`](./src/crypto/) — 🧪 Zig-based crypto lib (unaudited)
* [`devtool (WIP)`](./src/devtool/) — Native app (Zig + Solid.js) — a future local-first Tenderly
* [`provider (WIP)`](./src/provider/) — HTTP-based Ethereum provider

---

## 🔁 Relationship to Tevm

Once stable, **Guillotine’s WASM build** will replace the current JavaScript EVM in [Tevm](https://node.tevm.sh).
Upgrades include:

* 🚀 **Up to 1000x performance boost**
* 📉 **300KB (75%) bundle size reduction**
* 🔧 **Foundry-compatible compiler support**
* 🧱 **Cross-language bindings** (primitives, compiler, provider)

It also unlocks **Solidity and Vyper** compatibility for the `tevm` compiler.

---

## ✨ Key Features

* 🏎️ **Fast & Small** — Zig = uncompromising performance and minimal footprint
* 🧩 **C FFI Compatible** — Use it from Python, Rust, Go, Swift, etc.
* 🖥️ **Multi-target builds** — Native + WASM (x86 / ARM)
* 🏗️ **Builder pattern** — Intuitive API for managing VM execution
* 🧪 **Reliable** — Unit, integration, fuzz, E2E, and benchmark test suite

---

## 📦 Installation

### 🔧 Zig Package Manager

```bash
zig fetch --save git+https://github.com/evmts/Guillotine#main
```

Add to `build.zig.zon`:

```zig
.dependencies = .{
    .guillotine = .{
        .url = "git+https://github.com/evmts/Guillotine#main",
        .hash = "<hash from zig fetch>",
    },
},
```

---

### ✅ Prerequisites

* 🛠️ **Zig v0.14.1 or later**
* 🦀 **Rust toolchain** — for BN254 native precompiles (will be replaced with Zig [#1](https://github.com/evmts/Guillotine/issues/1))

---

## ⚡ Quick Start

### Example: Basic EVM Execution

```zig
const std = @import("std");
const Evm = @import("guillotine").Evm;
const primitives = @import("guillotine").primitives;

pub fn main() !void {
    const allocator = std.heap.page_allocator;

    var memory_db = Evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var vm = try Evm.Evm.init(allocator, db_interface);
    defer vm.deinit();

    const bytecode = [_]u8{
        0x60, 0x2A, 0x60, 0x00, 0x52,
        0x60, 0x20, 0x60, 0x00, 0xF3,
    };

    const contract_address = primitives.Address.from_u256(0x1234);
    var contract = Evm.Contract.init_at_address(
        contract_address,
        contract_address,
        0,
        100_000,
        &bytecode,
        &[_]u8{},
        false,
    );
    defer contract.deinit(allocator, null);

    try vm.state.set_code(contract_address, &bytecode);

    const result = try vm.interpret(&contract, &[_]u8{});
    defer if (result.output) |output| allocator.free(output);

    std.debug.print("Execution status: {}\n", .{result.status});
    if (result.output) |output| {
        std.debug.print("Return value: {}\n", .{
            std.mem.readInt(u256, output[0..32], .big)
        });
    }
}
```

---

## 🧱 Design Principles

1. 🧼 **Zero Allocation Philosophy** – Allocates once, avoids reallocations
2. 🔍 **Explicit Error Handling** – All errors are typed and recoverable
3. 🧩 **Modular Boundaries** – Clear interfaces between components
4. 🧪 **Test Everything** – Coverage across all levels
5. 🛠️ **Optimized for Size & Speed** – `comptime` wherever it counts

---

## 🧬 Precompiled Contracts

| Address | Name                   | Native | WASM | Implementation        |
| ------: | ---------------------- | :----: | :--: | --------------------- |
|  `0x01` | ECRECOVER              |    ✅   |   ✅  | Pure Zig              |
|  `0x02` | SHA256                 |    ✅   |   ✅  | Pure Zig              |
|  `0x03` | RIPEMD160              |    ✅   |   ✅  | Pure Zig              |
|  `0x04` | IDENTITY               |    ✅   |   ✅  | Pure Zig              |
|  `0x05` | MODEXP                 |    ✅   |   ✅  | Pure Zig              |
|  `0x06` | ECADD (BN254)          |    ✅   |   ✅  | Pure Zig              |
|  `0x07` | ECMUL (BN254)          |    ✅   |  ⚠️  | Rust (to be replaced) |
|  `0x08` | ECPAIRING (BN254)      |    ✅   |  ⚠️  | Rust (partial)        |
|  `0x09` | BLAKE2F                |    ✅   |   ✅  | Pure Zig              |
|  `0x0a` | KZG\_POINT\_EVALUATION |    ✅   |   ✅  | C-KZG-4844            |

🧪 Crypto implementations live in [`src/crypto`](./src/crypto).
⚠️ Some are unaudited — **not production-ready**.

---

## 🤝 Contributing

We welcome contributions of all kinds!

See our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## 📜 License

MIT License. Free for all use. 🌍

---

## 🙏 Acknowledgments

* 🏛️ **Ethereum Foundation** — for R\&D support
* ⚙️ **Zig Community** — for an incredible systems programming language
* 🧠 [@SamBacha](https://github.com/sambacha) — for the name **Guillotine**
* 💬 [Tevm Telegram](https://t.me/+ANThR9bHDLAwMjUx) — for community feedback and direction
