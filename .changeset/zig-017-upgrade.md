---
"@tevm/zig": minor
---

Upgrade Zig toolchain from 0.15.2 to 0.17.1 and update Zig dependencies (`z_ens_normalize`, `zbench` 0.14.1, `clap` 0.12.0).

### Breaking API Changes (`std.Io`)

Functions that read the system clock, draw randomness, or read files now accept an explicit `io: std.Io` parameter following Zig 0.17's `std.Io` model:

- `crypto.bls12_381.SecretKey.generate(io: std.Io)` (uses `io.randomSecure`, adds `Error.EntropyUnavailable`)
- `crypto.bip39.generateMnemonic(io: std.Io, entropy_bits: u16, out_indices: []u11)` (uses `io.randomSecure`, adds `Bip39Error.EntropyUnavailable`)
- `crypto.Crypto.unaudited_randomPrivateKey(io: std.Io)` (uses `io.randomSecure`)
- `crypto.signers.LocalSigner.random(io: std.Io)`, `createRandomSigner(io: std.Io)`, and `createSigner(.{ .random = true, .io = io })`
- `crypto.keystore.encrypt(allocator, io: std.Io, private_key, password, options)` (uses `io.randomSecure` for salt/IV, adds `KeystoreError.EntropyUnavailable`)
- `crypto.c_kzg.loadTrustedSetupFile(io: std.Io, trusted_setup_path: []const u8, precompute: u64)`
- `crypto.keccak_asm.benchmark_comparison(io: std.Io, data: []const u8, iterations: u32)`
- `primitives.consensus.expectedCurrentSlot(io: std.Io, genesis_time: u64)`
- `primitives.BundleHash.random(io: std.Io)`
- `primitives.BeaconBlockRoot.random(io: std.Io)`
- `primitives.Bytes.random(allocator, io: std.Io, len: usize)`
- `primitives.Hash.random(io: std.Io)`
- `primitives.TransactionHash.random(io: std.Io)`
- `primitives.BlockHash.random(io: std.Io)`
- `primitives.StorageValue.random(io: std.Io)`
- `primitives.Hex.random(allocator, io: std.Io, size_bytes: usize)`
- `primitives.Address.format` updated to the Zig 0.17 `*std.Io.Writer` formatter signature

### Other Changes

- Replaced `@cImport` sites (`bn254_arkworks.zig`, `keccak_asm.zig`, and a standalone `lib/c_kzg_root.zig` wrapper) with `b.addTranslateC` build modules without mutating vendored `c-kzg-4844`.
- Raised `.minimum_zig_version` in `build.zig.zon` to `"0.17.1"`.
- Ported `build.zig`, `lib/c_libs.zig`, benchmarks, scripts, and `HDWallet/hdwallet.fuzz.zig` to Zig 0.17.1 APIs and removed unreachable broken `*.fuzz.zig` files.
