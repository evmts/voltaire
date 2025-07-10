# CLAUDE.md - AI Assistant Context

## Testing Philosophy

### No Abstractions in Tests
All tests in this codebase should be written with **zero abstractions or indirections**. This means:

1. **No test helper functions** - Copy and paste setup code directly in each test
2. **No shared test utilities** - Each test should be completely self-contained
3. **Explicit is better than DRY** - Readability and clarity over code reuse in tests

### Why This Approach?

- **Tests are documentation** - A developer should understand what's being tested without jumping between files
- **Tests should be obvious** - No mental overhead from abstractions
- **Copy-paste is encouraged** - Verbose, repetitive test code is acceptable and preferred
- **Each test tells a complete story** - From setup to assertion, everything is visible

### Example Pattern

Instead of:
```zig
// Bad - uses abstractions
var test_vm = try helpers.TestVm.init(allocator);
_ = try helpers.executeOpcode(0x01, test_vm.vm, test_frame.frame);
try helpers.expectStackValue(test_frame.frame, 0, 15);
```

Write:
```zig
// Good - everything inline
var memory_db = MemoryDatabase.init(allocator);
defer memory_db.deinit();

const db_interface = memory_db.to_database_interface();
var vm = try Vm.init(allocator, db_interface, null, null);
defer vm.deinit();

// ... complete setup ...

// Execute opcode directly through jump table
const interpreter_ptr: *Operation.Interpreter = @ptrCast(&vm);
const state_ptr: *Operation.State = @ptrCast(&frame);
_ = try vm.table.execute(0, interpreter_ptr, state_ptr, 0x01);

// Direct assertion
const result = try frame.stack.pop();
try testing.expectEqual(@as(u256, 15), result);
```

## Test Structure

### Colocated Tests
- Tests live in the same file as the implementation
- Add tests at the bottom of each source file
- No separate test directories for unit tests

### Integration Tests
- Integration tests that span multiple modules can live in `test/` directory
- Even integration tests should follow the "no abstractions" rule

## EVM-Specific Testing Notes

### Opcode Testing
When testing opcodes:
1. Create full VM and Frame setup inline
2. Use the jump table to execute opcodes (like real execution)
3. Make assertions directly on stack/memory/storage state
4. Each test should set up its own contract, gas, etc.

### State Testing
- Always create fresh state for each test
- Don't share database instances between tests
- Explicitly set up all required state

## Build and Test Commands

**IMPORTANT**: Always use `zig build test`, never use `zig test` directly.

```bash
zig build test                              # Run all tests (correct way)
zig build test --help                       # See test options
```

Do NOT use:
```bash
zig test src/file.zig                       # Wrong - will fail with import errors
```

The build system is configured to link all tests through `src/root.zig` and `src/evm/root.zig`.

## Import Rules

### Module Import Restrictions
1. **No relative imports with `../`** - You cannot import from parent directories
2. **Same folder imports** - Can import files in the same directory directly
3. **Subfolder imports** - Can import from subdirectories
4. **Cross-module imports** - Must use the module system defined in `build.zig`

### Examples
```zig
// Good - importing from module system
const Evm = @import("evm");
const Address = @import("Address");

// Good - same directory
const ExecutionError = @import("execution_error.zig");

// Good - subdirectory
const arithmetic = @import("execution/arithmetic.zig");

// Bad - parent directory (will fail)
const Contract = @import("../frame/contract.zig");

// Bad - using relative paths
const Memory = @import("../../memory/memory.zig");
```

### Available Modules
The following modules are configured in `build.zig`:
- `evm` - EVM implementation (src/evm/root.zig)
- `Address` - Ethereum address utilities
- `Rlp` - RLP encoding/decoding
- Other modules as defined in build.zig

## Memory Management and Allocation Awareness

### CRITICAL: Always Think About Memory Ownership

When working with Zig code, **ALWAYS** be conscious of memory allocations:

1. **Every allocation needs a corresponding deallocation**
   - If you see `allocator.create()` or `allocator.alloc()`, immediately think: "Where is this freed?"
   - If you see `init()` that takes an allocator, check if there's a corresponding `deinit()`

2. **Ownership patterns to watch for**:
   - **errdefer** - Use when allocation might fail before ownership transfer
   - **defer** - Use when you own the memory for the entire function scope
   - **Ownership transfer** - Document when passing allocated memory to caller

3. **Common patterns**:
   ```zig
   // Pattern 1: Function owns memory
   const thing = try allocator.create(Thing);
   defer allocator.destroy(thing);
   
   // Pattern 2: Error handling
   const thing = try allocator.create(Thing);
   errdefer allocator.destroy(thing);
   thing.* = try Thing.init(allocator);
   
   // Pattern 3: Ownership transfer to caller
   pub fn createThing(allocator: Allocator) !*Thing {
       const thing = try allocator.create(Thing);
       // Caller is responsible for calling destroy
       return thing;
   }
   ```

4. **Contract pattern in EVM code**:
   - `Contract.init()` requires `contract.deinit(allocator, null)`
   - `Frame.init()` requires `frame.deinit()`
   - Always use defer immediately after initialization

5. **Test-specific rules**:
   - Every `init` in a test MUST have a corresponding `defer deinit`
   - Use `defer` immediately after the initialization line
   - This prevents memory leaks in tests

## Commenting Guidelines

### Comments Should Be Minimal and Purposeful
- **Only add useful and necessary comments** - avoid overcommenting
- **Do not add comments for obvious operations** - code should be self-explanatory
- **Avoid explaining what the code does** - explain why when needed
- **No redundant comments** - if removing code, don't add comments about what was removed

## Notes for AI Assistants

When writing tests for this codebase:
1. **Never suggest test helpers or abstractions**
2. **Copy full setup code into each test**
3. **Make tests verbose and explicit**
4. **Prioritize readability over DRY principles**
5. **Each test should be understandable in isolation**
6. **ALWAYS add defer statements for cleanup after allocations**
7. **Follow minimal commenting guidelines** - add comments only when necessary

### Important: When Things Don't Go As Planned

**If the plan outlined by the user isn't working:**
1. **STOP immediately** - Don't try to continue or find workarounds
2. **Explain clearly** what is happening and why it's not working
3. **Wait for instructions** - Let the user provide guidance on how to proceed
4. **Don't assume** - Ask for clarification rather than guessing the next step

This ensures we stay aligned with the project's intentions and don't create unintended complexity.