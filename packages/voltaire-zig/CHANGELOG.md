# @tevm/zig

## 0.3.0

### Minor Changes

- [#396](https://github.com/evmts/voltaire/pull/396) [`3b6d41a`](https://github.com/evmts/voltaire/commit/3b6d41a9dc7e3a49207086007b93b13af91188fd) Thanks [@roninjin10](https://github.com/roninjin10)! - Expose native light-client primitives and an optional synchronous fork resolver for ZEVM embedding. Preserve the asynchronous request/continue interface for existing hosts and add a focused state-manager test target.

  Correct target-specific Rust archive selection for native cross builds and enable the C API targets used by Swift/native release jobs.

### Patch Changes

- [`8b51368`](https://github.com/evmts/voltaire/commit/8b5136835ce40c887ad579ec07137c82199a7eeb) Thanks [@roninjin10](https://github.com/roninjin10)! - Make exported modules build their Rust crypto archive before linking in downstream projects, including Guillotine Mini WASM. Run WASM archive filtering from Voltaire's root and include its script in the Zig package so dependency builds work from other working directories.
