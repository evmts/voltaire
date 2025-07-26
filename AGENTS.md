# AGENTS.md - Coding Agent Guidelines

## Build/Test Commands
- **Build**: `zig build` (never `zig test` directly)
- **All tests**: `zig build test` 
- **Single test**: `zig build test-<name>` (e.g., `test-stack`, `test-memory`, `test-opcodes`)
- **Benchmarks**: `zig build bench`
- **Fuzz tests**: `zig build fuzz`
- **CRITICAL**: Run `zig build && zig build test` after EVERY code change

## Code Style
- **Naming**: camelCase for functions/variables (e.g., `parseData` not `parse_data`)
- **Variables**: Prefer single words (`n` over `number`, `i` over `index`)
- **Functions**: Single responsibility, avoid else statements
- **Memory**: Always use `defer` immediately after allocation
- **Tests**: Include in source files, zero abstractions, copy-paste setup code
- **Imports**: Direct imports without aliases (`address.Address` not `Address = address.Address`)

## Memory Management
- Every `allocator.create()` needs `defer allocator.destroy()`
- EVM patterns: `Contract.init()` → `defer contract.deinit(allocator, null)`
- Use `errdefer` when transferring ownership to caller

## Testing Philosophy
- **Zero abstractions** - no test helpers, each test self-contained
- **Test failures are regressions** - if tests fail after your changes, YOU broke it
- **No speculation** - add logging to debug, never guess root causes

## Error Handling
- Strong error types for each component
- Use error unions (`!void`, `!u256`)
- Return early on errors, avoid nested error handling