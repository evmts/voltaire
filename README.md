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

**Current Status**: The EVM implementation has been completely redesigned with a new architecture focused on performance and modularity. Key features include:
- ✅ Configurable frame-based execution
- ✅ Optimized bytecode planning with opcode fusion
- ✅ High-performance pointer-based stack
- ✅ Pluggable database interface
- ✅ Comprehensive tracing support
- 🚧 Advanced planner strategies (in progress)

We're actively testing against all Ethereum hardforks and conducting extensive benchmarking.

---

## 📊 Benchmarks & Bundle Size

💥 Official benchmarks and bundle size reports will be included with the **Alpha drop**.
You can expect:

* ⏱️ **Best in class Performance**
* 🪶 **Significant bundle size reduction**

Compared to other EVM implementations

---

## 🧩 Subpackages

Guillotine is a modular Ethereum stack in Zig:

* [`evm`](./src/evm/) — High-performance EVM implementation with pluggable components
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

* 🏎️ **Fast & Small** — Cache-conscious design with pointer-based stack and optimized instruction dispatch
* 🧩 **C FFI Compatible** — Use it from Python, Rust, Go, Swift, etc.
* 🖥️ **Multi-target builds** — Native + WASM (x86 / ARM) with platform-specific optimizations
* 🔌 **Pluggable Architecture** — Configurable components: database, tracer, planner strategies
* 🧪 **Reliable** — Unit, integration, fuzz, E2E, and benchmark test suite
* 🔍 **Advanced Bytecode Optimization** — Opcode fusion, constant inlining, and jump validation

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
    var vm = try Evm.Evm.init(allocator, db_interface, null, null);
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

## 📚 Library Integration

For external projects that want to integrate Guillotine as a library dependency.

> **⚠️ Note**: The requirements below are temporary and will be removed in upcoming releases as we migrate to pure Zig implementations.

### Required Dependencies (Temporary)

#### BN254 Rust Wrapper
Guillotine currently uses a Rust-based BN254 elliptic curve implementation for production-grade scalar multiplication and pairing operations:

- **Location**: `src/bn254_wrapper/`
- **Dependencies**: arkworks ecosystem (ark-bn254, ark-ec, ark-ff, ark-serialize)
- **Build**: Static library built from Rust using cargo
- **Status**: Will be replaced with pure Zig implementation

#### c-kzg-4844
KZG commitment library for EIP-4844 blob transactions:

- **Dependency**: ethereum/c-kzg-4844
- **Purpose**: KZG point evaluation precompile (0x0a)
- **Status**: May be replaced with pure Zig implementation

#### System Libraries (Temporary)

**Linux**:
```
dl, pthread, m, rt
```

**macOS**:
```
Security framework, CoreFoundation framework
```

> These system library requirements will be eliminated when Rust dependencies are removed.

### Example build.zig Integration

```zig
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // Add Guillotine as dependency
    const guillotine = b.dependency("guillotine", .{
        .target = target,
        .optimize = optimize,
    });

    // Get Guillotine modules
    const evm_mod = guillotine.module("evm");
    const primitives_mod = guillotine.module("primitives");
    
    // Your executable
    const exe = b.addExecutable(.{
        .name = "your-app",
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });
    
    // Link Guillotine modules
    exe.root_module.addImport("evm", evm_mod);
    exe.root_module.addImport("primitives", primitives_mod);
    
    // Link required libraries (automatically handled by Guillotine modules)
    // The bn254_wrapper and c-kzg-4844 libraries are linked automatically
    // when you import the evm module
    
    b.installArtifact(exe);
}
```

### build.zig.zon Configuration

```zig
.{
    .name = "your-project",
    .version = "0.1.0",
    .dependencies = .{
        .guillotine = .{
            .url = "https://github.com/evmts/Guillotine/archive/<commit-hash>.tar.gz",
            .hash = "<hash>",
        },
    },
    .paths = .{""},
}
```

### Minimal Module Usage

For projects that only need specific Guillotine functionality:

```zig
// Use only primitives (Address, Hex, RLP, etc.)
const primitives = b.dependency("guillotine", .{}).module("primitives");
exe.root_module.addImport("primitives", primitives);

// Use only EVM execution (includes all dependencies)
const evm = b.dependency("guillotine", .{}).module("evm");
exe.root_module.addImport("evm", evm);
```

### Integration Notes

1. **Automatic Linking**: When you import the `evm` module, all required libraries (BN254 wrapper, c-kzg-4844, system libraries) are automatically linked.

2. **Cross-Platform**: The build system automatically detects the target platform and links appropriate system libraries (Security/CoreFoundation on macOS, dl/pthread/m/rt on Linux).

3. **WASM Compatibility**: For WASM targets, BN254 operations use placeholder implementations. Full zkSNARK support requires host environment integration.

4. **Memory Management**: All Guillotine operations require an allocator. Use `std.testing.allocator` for tests or your application's allocator for production.

5. **Future Simplification**: Integration will become much simpler once pure Zig implementations replace the current Rust dependencies, eliminating the need for Rust toolchain and system library requirements.

### Troubleshooting

- **Signal 4 (Illegal Instruction)**: Ensure all system libraries are properly linked. This typically occurs when BN254 operations fail due to missing dependencies. *Note: This issue will be resolved when pure Zig implementations are complete.*
- **Build Failures**: Verify Zig version compatibility (0.14.1+ required) and ensure Rust toolchain is available for BN254 wrapper compilation. *Note: Rust toolchain requirement will be removed in future releases.*
- **Import Errors**: Use the module system rather than direct file imports. Import `evm` and `primitives` modules as shown above.

---

## 📜 License

MIT License. Free for all use. 🌍

---

## 🙏 Acknowledgments

* 🏛️ **Ethereum Foundation and OP RPGF** — for funding support
* ⚙️ **Zig Community** — for an incredible systems programming language
* 🧠 [@SamBacha](https://github.com/sambacha) — for the name **Guillotine**
* 💬 [Tevm Telegram](https://t.me/+ANThR9bHDLAwMjUx) — for community feedback and direction
