# Zig 0.15.2 to 0.17.1 migration

Voltaire does not build on Zig 0.17.1 today; 3,077 of the failing source sites can be fixed now, on 0.15.2, with one script and 11 hand edits.

Zig 0.17 removed the `**` array-repeat operator, `@cImport`, the `Step.Compile` link helpers, and most of the blocking `std.fs` / `std.time` / `std.crypto.random` surface in favor of `std.Io`. Every finding below comes from running `zig 0.17.1 build test` against a copy of this tree on 2026-11-22 and reading the 0.17.1 `lib/std` source. CI and local development stay on 0.15.2 until the checklist at the end is complete.

## Status

| Area | Sites | State |
| --- | --- | --- |
| `build.zig` `Step.Compile` link helpers | 183 | Fixed in this change, builds on both |
| `CARGO_TARGET_DIR` ignored by `build.zig` | 3 | Fixed in this change, builds on both |
| `zig-pkg/` not ignored | 1 | Fixed in this change |
| `a ** n` array repeat | 2,832 sites, 221 files | Codemod ready, 0.15.2-compatible, not yet applied |
| `std.ArrayList(T){}` | 125 | Codemod ready, 0.15.2-compatible, not yet applied |
| `std.heap.GeneralPurposeAllocator` | 120 | Codemod ready, 0.15.2-compatible, not yet applied |
| `.field = .{}` on an `ArrayList` field | 4 found so far | Manual, 0.15.2-compatible (`.empty`) |
| `@cImport` | 4 | Manual, 0.15.2-compatible (`b.addTranslateC`) |
| `std.Io` API moves | about 110 | Needs 0.17, not dual-compatible |
| Configure-time filesystem and process calls in `build.zig` | 5 | Needs 0.17, not dual-compatible |
| Dependencies and the `libwally-core` submodule | 3 | Needs upstream changes |

The codemod is not applied here because it rewrites 294 files that other open maintenance branches also edit. Run it as its own commit once those branches land. It is idempotent, and new code that reintroduces `**` is caught by rerunning it.

## What changed in this commit

All of it compiles on 0.15.2. `zig build test` passes on 0.15.2 with these edits.

| File | Change |
| --- | --- |
| `build.zig`, `packages/voltaire-zig/lib/blst.zig`, `lib/c-kzg.zig` | `x.linkLibrary(l)`, `x.addIncludePath(p)`, `x.addObjectFile(p)`, `x.addCSourceFile(s)`, `x.addAssemblyFile(p)` now go through `x.root_module`. `x.linkLibC()` is `x.root_module.link_libc = true`. `x.linkSystemLibrary("gcc_s")` is `x.root_module.linkSystemLibrary("gcc_s", .{})`. 183 call sites. |
| `packages/voltaire-zig/lib/bn254.zig`, `lib/c_libs.zig` | New `cargoTargetDir(b)`. The Rust archive path and the WASM archive filter now follow `CARGO_TARGET_DIR`. Before, a build with `CARGO_TARGET_DIR` set failed with `libcrypto_wrappers.a file_hash FileNotFound`. Verified with `zig build test` on 0.15.2 with the variable set. The WASM archive-filter step configures (`zig build -l`) but was not executed for this change. |
| `.gitignore` | `zig-pkg/`. Zig 0.16 and later unpack dependencies into the project root. |
| `scripts/zig017-codemod.py` | The codemod described below. |

## Breaking changes found

### Language

| 0.15.2 | 0.17.1 | Sites | Works on 0.15.2 |
| --- | --- | --- | --- |
| `[_]u8{0} ** 32` | `@as([32]u8, @splat(0))` | 2,292 | Yes |
| `"=" ** 60` | `&@as([60]u8, @splat('='))` | 469 | Yes |
| `"ab" ** N` | `@as(*const [(N) * 2]u8, @ptrCast(&@as([N][2]u8, @splat("ab".*))))` | 71 | Yes |
| `@cImport({ @cInclude("x.h"); })` | `b.addTranslateC(.{ .root_source_file = ... })` in `build.zig`, imported as a module | 4 | Yes |
| `void{}` | `{}` | 2 (`crypto/modexp.zig:1003`, `:1014`) | Yes |

The 0.17.1 compiler reports `**` as `binary operator '*' has whitespace on one side, but not the other`. The tokenizer no longer has the token.

`@cImport` sites: `src/crypto/bn254_arkworks.zig:6`, `src/crypto/keccak_asm.zig:23`, and two in the vendored `lib/c-kzg-4844/bindings/zig/root.zig`. The vendored file is the root of the `c_kzg` module in `build.zig`. Replace that module root with a file we own and leave the vendored tree untouched.

### Build system

Zig 0.17 runs `build.zig` in a separate configure process. `LazyPath.getPath` is gone, and `Build` no longer exposes `build_root`.

| 0.15.2 | 0.17.1 | Where |
| --- | --- | --- |
| `compile.linkLibrary(l)` and the other helpers | `compile.root_module.linkLibrary(l)` | Fixed |
| `b.graph.env_map` | `b.graph.environ_map` | `lib/bn254.zig` selects with `@hasField` |
| `std.fs.cwd().openDir(path, .{ .iterate = true })`, `walker.next()` | `std.Io.Dir.cwd().openDir(b.graph.io, path, ...)`, `walker.next(b.graph.io)` | `build.zig:854`, `build.zig:928` |
| `std.fs.cwd().access(lazy.getPath(b), .{})` | `std.Io.Dir.cwd().access(b.graph.io, sub_path, .{})` | `lib/c_libs.zig:96` |
| `std.process.Child.run(.{ .allocator, .argv })` | `b.findProgram(.{ .names = &.{"cargo"} })`, or `std.process.run(gpa, io, .{...})` | `lib/c_libs.zig:14` |
| `b.findProgram(names, paths)` | `b.findProgram(.{ .names = ... })` | Not used yet |

After those five edits plus the dependency patches below, `zig 0.17.1 build test` configures and reaches source compilation.

`build.zig.zon` parses on 0.17.1 unchanged. Raise `minimum_zig_version` to `0.17.1` in the upgrade commit.

### Dependencies

| Dependency | Problem on 0.17.1 | Action |
| --- | --- | --- |
| `z_ens_normalize` (`evmts/z-ens-normalize@9fb3ed8`) | `build.zig:145` `c_lib.linkLibC()`, `build.zig:248` `std.fs.cwd()` | Fix upstream in our repository, tag, update the hash |
| `packages/voltaire-zig/lib/libwally-core` (submodule) | `build.zig:18` `libwally.addCSourceFile(...)` and the other `Step.Compile` helpers | Fix in the submodule's repository, then move the pointer. Do not edit the submodule in place |
| `zbench` `0.11.2` (`3268a23`) | Not compiled by `zig build test`. UNVERIFIED on 0.17.1 | Bump to a 0.17 release, run `zig build bench -Dwith-benches=true` |
| `clap` `0.11.0` (`3ae9222`) | The pinned commit already declares `minimum_zig_version = "0.16.0-dev.1484"`. Not compiled by `zig build test`. UNVERIFIED on 0.17.1 | Bump to a 0.17 release |

### Standard library

Counts are occurrences in `packages/voltaire-zig/src` plus `examples` and `tools`. Each row was checked against the 0.17.1 `lib/std` source.

| 0.15.2 | 0.17.1 | Sites | Works on 0.15.2 |
| --- | --- | --- | --- |
| `std.ArrayList(T){}` | `std.ArrayList(T).empty` | 125 | Yes |
| `.list_field = .{}` | `.list_field = .empty` | 4 found (`state-manager/ForkBackend.zig:149`, `:220`, `StateCache.zig:88`, `blockchain/ForkBlockCache.zig:80`) | Yes |
| `std.heap.GeneralPurposeAllocator` | `std.heap.DebugAllocator` | 120 | Yes |
| `std.AutoArrayHashMap` | `std.array_hash_map.Auto` (unmanaged) | 9 | No |
| `std.crypto.random.bytes(buf)` | `io.random(buf)`, or `io.randomSecure(buf)` for keys | 14 | No |
| `std.time.nanoTimestamp()`, `milliTimestamp()`, `timestamp()` | `std.Io.Clock.now(clock, io)` | 26 | No |
| `std.time.Timer` | `std.Io.Timestamp.now(io, clock)` and a difference | 4 | No |
| `std.fs.cwd()` | `std.Io.Dir.cwd()`, every call takes `io` | 17 | No |
| `std.fs.File.stdout()`, `std.io.getStdOut()` | `std.Io.File.stdout()`, `file.writer(io, &buf)` | 50 | No |
| `std.io.fixedBufferStream(buf)` | `std.Io.Writer.fixed(buf)`, `std.Io.Reader.fixed(buf)` | 2 | Yes (0.15 has both) |
| `std.Thread.Mutex` | `std.Io.Mutex`, `lock(io)` and `unlock(io)` | 2 | No |
| `std.posix.exit`, `fork`, `waitpid`, `getrandom` | `std.process.exit`, `std.process.spawn(io, ...)`, `io.randomSecure` | 7 | No |
| `std.process.argsAlloc` | `init.minimal.args` from `pub fn main(init: std.process.Init)` | 2 | No |
| `std.process.Child.init` | `std.process.spawn(io, .{...})` | 1 | No |
| `std.ascii.indexOfIgnoreCase` | `std.ascii.findIgnoreCase` | 4 | No |
| `std.meta.Int`, `std.meta.fields` | `@Int`, `@typeInfo(T).@"struct".fields` | 7 | `@typeInfo` yes |
| `std.fmt.format`, `std.fmt.FormatOptions` | `writer.print`, `std.fmt.Options` | 7 | No |
| `std.rand` | `std.Random` | 1 | Yes |
| `pub fn main() !void` | `pub fn main(init: std.process.Init) !void` when the program needs `io`, args, or an allocator | 158 | No |

`std.mem.indexOf` and `std.mem.indexOfScalar` (172 sites) still compile on 0.17.1. They are deprecated in favor of `std.mem.find` and `std.mem.findScalar`.

### Code that is already broken on 0.15.2

These names do not exist in 0.15.2 either. The files that use them are not reachable from `zig build test`, so nothing reports them.

| Name | Sites | Files |
| --- | --- | --- |
| `std.testing.fuzzInput` | 406 | 20 of the 28 `*.fuzz.zig` files |
| `std.fmt.fmtSliceHexLower` | 189 | 4 in `src`, the rest in `examples` |
| `std.io.getStdOut` | 33 | `examples`, `*.bench.zig` |
| `std.fmt.formatIntBuf` | 20 | `examples` |
| `std.crypto.utils.secureZero` | 2 | `src` |

On 0.17.1 a fuzz test is `std.testing.fuzz(context, testOne, .{})` with `testOne: fn (ctx, smith: *std.testing.Smith) anyerror!void`. Port or delete the 28 fuzz files; do not carry them across as they are.

## The codemod

```bash
scripts/zig017-codemod.py --check build.zig packages/voltaire-zig   # report only
scripts/zig017-codemod.py build.zig packages/voltaire-zig           # rewrite
```

It skips `libwally-core`, `c-kzg-4844`, `docs`, and build output directories. It masks comments and string literals before matching and rewrites nested repeats innermost first. On this tree it rewrites 3,066 sites in 294 files and prints 11 `MANUAL` lines, then exits 1.

The 11 manual sites have no element type for the script to copy. Rewrite them by hand:

| Site | Rewrite |
| --- | --- |
| `crypto/modexp.zig:506` `const expected: [17]u8 = .{0} ** 17;` | `= @splat(0);` |
| `crypto/signers.zig:625` `const zero_key = PrivateKey{0} ** 32;` | `const zero_key: PrivateKey = @splat(0);` |
| `primitives/Address/address.zig:712`, `:713` `.{ ... } ++ .{0} ** 28` | `.{ ... } ++ @as([28]u8, @splat(0))` (29 on line 713) |
| `primitives/Uint/Uint.zig:74` `Self.from_limbs(.{0} ** limbs)` | `Self.from_limbs(@splat(0))` |
| `primitives/Uint/Uint.zig:75` `.{1} ++ .{0} ** (limbs - 1)` | `[_]u64{1} ++ @as([limbs - 1]u64, @splat(0))` |
| `primitives/Uint/Uint.zig:78` `var max_limbs = .{std.math.maxInt(u64)} ** limbs;` | `var max_limbs: [limbs]u64 = @splat(std.math.maxInt(u64));` |
| `primitives/Uint/Uint.zig:99`, `:116`, `examples/hashing/event-topics.zig:22`, `:23` `= .{0} ** n;` | `= @splat(0);` |

Verified on 2026-11-22: a copy of this tree with the codemod applied and those 11 rewrites made passes `zig fmt --check` and `zig build test` on 0.15.2. That run covered 3,062 of the 3,066 sites; the other 4 are in `packages/voltaire-zig/scripts/generate_c_header.zig`, which only `zig build generate-header` compiles. On 0.17.1 the same copy has no `**` or `ArrayList(T){}` errors left.

`packages/voltaire-zig/docs` and `packages/voltaire-ts/docs` contain Zig samples and mirrored `.zig` files that use `**`. The codemod skips `docs` directories. Update them in the upgrade commit.

## Checklist

Steps 1 to 4 keep 0.15.2 green. Step 5 onward requires 0.17.1.

- [ ] 1. After the open maintenance branches land, run the codemod, make the 11 manual rewrites, run `zig build format`, and confirm `zig build test` and `zig build generate-header` pass on 0.15.2. Commit alone.
- [ ] 2. Change the four `.field = .{}` list initializers to `.empty` and the two `void{}` to `{}`. `zig build test` on 0.15.2.
- [ ] 3. Replace the four `@cImport` sites with `b.addTranslateC` modules. `zig build test`, `zig build build-ts-wasm`, and `zig build build-ts-native -Dwith-c-api=true` on 0.15.2.
- [ ] 4. Delete or port the 28 `*.fuzz.zig` files and the examples that call `fmtSliceHexLower`, `getStdOut`, or `formatIntBuf`. Add `zig build` steps that compile every example so dead code cannot return.
- [ ] 5. Release `z-ens-normalize` and `libwally-core` with 0.17 build scripts. Bump `zbench` and `clap`. Update `build.zig.zon` hashes with `zig fetch --save`.
- [ ] 6. Switch to 0.17.1. Apply the five configure-time edits in the build system table. Confirm `zig build --help` lists every step.
- [ ] 7. Thread `std.Io` through the library. Decide the public API first: functions that read the clock, read randomness, or touch files take an `io: std.Io` parameter. This changes exported signatures, so record it as a breaking change for `@tevm/zig`.
- [ ] 8. Fix the remaining rows of the standard library table. Zig reports errors lazily, so repeat `zig build test` until it is clean, then build every other step: `build-ts-wasm`, `build-ts-wasm-fast`, `crypto-wasm`, `build-ts-native`, `bench -Dwith-benches=true`, and each `example-*`.
- [ ] 9. Set `minimum_zig_version = "0.17.1"`. Change `version: 0.15.2` in `.github/workflows/ci.yml` (three jobs), `build-native.yml`, and `claude-code-auto-fix.yml`. Update `CLAUDE.md`, `CONTRIBUTING.md`, and the `std.ArrayList(T){}` guidance in both.
- [ ] 10. Regenerate `src/primitives.h` with `zig build generate-header` and rebuild the WASM artifacts. Run `pnpm test:run` against the new binaries.

## Reproduce the findings

```bash
# Zig 0.17.1 errors, isolated from the 0.15.2 caches
cp -R . /tmp/voltaire-017 && cd /tmp/voltaire-017
ZIG_LOCAL_CACHE_DIR=/tmp/z17-local ZIG_GLOBAL_CACHE_DIR=/tmp/z17-global \
  ~/.zvm/0.17.1/zig build test 2>&1 | grep 'error:' | sed -E 's/^[^:]+:[0-9]+:[0-9]+: //' | sort | uniq -c | sort -rn

# Every std path the tree names
grep -rhoE '\bstd(\.[A-Za-z_][A-Za-z0-9_]*)+' --include='*.zig' build.zig packages/voltaire-zig | sort | uniq -c | sort -rn
```

Run 0.17.1 only in a copy. In the repository it writes `zig-pkg/` and a second `.zig-cache` layout.
