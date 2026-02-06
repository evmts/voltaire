# libwally-core Build Fix Task

## Problem
The libwally-core submodule at `lib/libwally-core` has a Zig build script (`build.zig`) that was written for Zig 0.14.x but the project uses Zig 0.15.1. The build fails with:

```
error: no field or member function named 'linkLibC' in 'Build.Module'
    mod.linkLibC();
    ~~~^~~~~~~~~
```

## Context
- **Location**: `lib/libwally-core/`
- **Current Zig version**: 0.15.1
- **Submodule source**: https://github.com/evmts/libwally-core
- **Required output**: `lib/libwally-core/zig-out/lib/libwallycore.a`

## Breaking Changes in Zig 0.15
Between Zig 0.14 and 0.15, the build system changed:
- `Module.linkLibC()` removed - now use `Compile.linkLibC()` on the actual compile step
- Build API changes around how modules and compilation artifacts relate

## Task
Update `lib/libwally-core/build.zig` to be compatible with Zig 0.15.1 while maintaining the same build output.

## Steps
1. Read `lib/libwally-core/build.zig` to understand current structure
2. Search Zig 0.15.1 documentation or examples for proper build patterns:
   - How to link libc in 0.15.1
   - How to build static libraries (.a files)
   - Module vs Compile step patterns
3. Update the build.zig file with 0.15.1-compatible API calls
4. Test with `cd lib/libwally-core && zig build`
5. Verify output exists at `lib/libwally-core/zig-out/lib/libwallycore.a`
6. Test full project build with `zig build` from repo root

## References
- Zig 0.15.1 docs: https://ziglang.org/documentation/0.15.1/
- The project's main `build.zig` may have examples of correct 0.15.1 patterns
- Other C libraries in the project (blst, c-kzg-4844) are building successfully

## Success Criteria
- `cd lib/libwally-core && zig build` completes without errors
- Static library exists at `lib/libwally-core/zig-out/lib/libwallycore.a`
- Full `zig build` from repo root completes (may have other unrelated errors, but not libwally-related)

## Notes
- This is a submodule, so changes may need to be committed separately or documented for upstream
- The library is used by the main primitives_c build target
- Do NOT modify the main project build.zig unless absolutely necessary
