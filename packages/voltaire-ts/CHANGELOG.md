# @tevm/voltaire

## 0.4.1

### Patch Changes

- [#396](https://github.com/evmts/voltaire/pull/396) [`3b6d41a`](https://github.com/evmts/voltaire/commit/3b6d41a9dc7e3a49207086007b93b13af91188fd) Thanks [@roninjin10](https://github.com/roninjin10)! - Expose native light-client primitives and an optional synchronous fork resolver for ZEVM embedding. Preserve the asynchronous request/continue interface for existing hosts and add a focused state-manager test target.

  Correct target-specific Rust archive selection for native cross builds and enable the C API targets used by Swift/native release jobs.

## 0.4.0

### Minor Changes

- [`20b3b59`](https://github.com/evmts/voltaire/commit/20b3b5954796d960ca61b9ea7b38e07987790fe3) Thanks [@roninjin10](https://github.com/roninjin10)! - Add Merkle Patricia Trie primitive with put, get, delete, prove, and verify operations

### Patch Changes

- [`20b3b59`](https://github.com/evmts/voltaire/commit/20b3b5954796d960ca61b9ea7b38e07987790fe3) Thanks [@roninjin10](https://github.com/roninjin10)! - Fix docs examples to use real mainnet values and public endpoints

- [`20b3b59`](https://github.com/evmts/voltaire/commit/20b3b5954796d960ca61b9ea7b38e07987790fe3) Thanks [@roninjin10](https://github.com/roninjin10)! - Fix all lint errors, TS2742 type annotation errors, and regenerate type definitions

- [`20b3b59`](https://github.com/evmts/voltaire/commit/20b3b5954796d960ca61b9ea7b38e07987790fe3) Thanks [@roninjin10](https://github.com/roninjin10)! - Fix type soundness bugs in public API: all toHex() returns HexType, brand symbol exported from main entrypoint, ABI bytes mapped to Uint8Array, dead bun:ffi NativeExports removed, Domain chainId unified on ChainIdType

## 0.2.29

### Patch Changes

- [`7217d2d`](https://github.com/evmts/voltaire/commit/7217d2d52772469a4d4261d88071d11560a3c45a) Thanks [@roninjin10](https://github.com/roninjin10)! - Fixing bad publish
