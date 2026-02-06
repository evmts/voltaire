🎯 MISSION: Complete Primitives Library (Crypto +
  Precompiles + Remaining Primitives)

  📊 Current State Assessment

  ✅ Core Infrastructure

  - Address primitive (reference implementation)
  - Uint primitive
  - Rlp encoding
  - Abi encoding
  - Transaction types
  - Access lists
  - Authorization (EIP-7702)
  - Bytecode
  - Opcode constants
  - Gas constants
  - Event logs
  - Blob (EIP-4844)
  - Fee market
  - Hardfork
  - State/Storage
  - Siwe
  - Binary tree
  - Bloom filter

  Crypto Module (src/crypto/)

  Ethereum cryptographic operations - likely needs:
  - keccak256: Hash function (Zig + WASM bindings)
  - secp256k1: ECDSA signatures (Zig + WASM + C bindings)
  - BLS12-381: BLS signatures (Zig + WASM + C/blst)
  - BN254: Pairing curves (Zig + WASM + Rust/arkworks)
  - KZG: EIP-4844 commitments (Zig + WASM + C/c-kzg)
  - SHA256: SHA-2 hash (Zig + WASM)
  - RIPEMD160: Legacy hash (Zig + WASM)
  - Blake2: Blake2b hash (Zig + WASM)

  Precompiles Module (src/precompiles/)

  EVM precompiled contracts (0x01-0x0a + EIP-2537/4844):
  - 0x01: ecRecover (secp256k1 recovery)
  - 0x02: SHA256
  - 0x03: RIPEMD160
  - 0x04: Identity (datacopy)
  - 0x05: ModExp (big integer modular exponentiation)
  - 0x06-0x09: BN254 operations (add, mul, pairing)
  - 0x0a: Blake2f
  - EIP-2537: BLS12-381 precompiles (0x0b-0x12)
  - EIP-4844: Point evaluation precompile (0x14)

  Integration Work

  - Main crypto/index.ts exports
  - Main precompiles/index.ts exports
  - Cross-module integration tests
  - WASM loader verification
  - Package.json exports for crypto/precompiles
  - Documentation verification

  ---
  🎓 Critical Patterns (Learned from Denomination
  Implementation)

  <tdd_cycle>
    <step_1_red>
      - Write test file FIRST (method.test.ts)
      - Run: bun run vitest path/to/test.ts --run
      - VERIFY IT FAILS (module not found or assertion
  fails)
      - If test passes without implementation = test is
  wrong
    </step_1_red>

    <step_2_green>
      - Write minimal implementation (method.ts or
  method.js)
      - Run same test command
      - VERIFY IT PASSES
      - If test still fails = fix implementation, not
  test
    </step_2_green>

    <step_3_refactor>
      - Clean up code (remove duplication, improve
  clarity)
      - Run test again to ensure still passes
      - Run `zig build test` to ensure no breakage
    </step_3_refactor>

    <step_4_verify>
      - Run full test suite: bun run vitest
  src/path/to/module --run
      - Ensure all tests still pass
      - Check zig build test passes
    </step_4_verify>
  </tdd_cycle>

  Pattern 2: File Structure (From Denomination)

  ModuleName/
  ├── BrandedModuleName/
  │   ├── BrandedModuleName.ts          # Type definition
   only
  │   ├── constants.ts + constants.test.ts
  │   ├── from.ts + from.test.ts        # Universal
  constructor
  │   ├── fromX.ts + fromX.test.ts      # Specific
  constructors
  │   ├── toX.ts + toX.test.ts          # Conversions
  │   ├── methodName.ts + methodName.test.ts  # Each
  method = 1 file
  │   └── index.ts                      # Namespace
  export
  ├── ModuleName.ts                     # Wrapper (if
  needed)
  ├── ModuleName.wasm.ts                # WASM bindings
  (if Zig exists)
  ├── modulename.zig                    # Zig
  implementation
  ├── ModuleName.test.ts                # Integration
  tests
  └── index.ts                          # Main exports

  Pattern 3: Import Patterns ⚠️ CRITICAL

  // ❌ WRONG - This doesn't work for namespaces
  import * as Wei from "../BrandedWei/index.js";
  const wei = Wei.from(123); // ERROR: Wei.from is not a
  function

  // ✅ CORRECT - Use namespace object
  import { BrandedWei } from "../BrandedWei/index.js";
  const wei = BrandedWei.from(123); // Works!

  // ✅ ALSO CORRECT - Direct import for internal use
  import { from } from "./from.js";
  const wei = from(123);

  Namespace Export Pattern:
  // index.ts
  import { from } from "./from.js";
  import { toHex } from "./toHex.js";

  // Export individually (tree-shakeable)
  export { from, toHex };

  // Export as namespace (convenience) ← Tests import
  THIS
  export const BrandedModuleName = {
    from,
    toHex,
  };

  Pattern 4: Arithmetic Operations

  // ❌ WRONG - Uint.div doesn't exist
  const result = Uint.div(a, b);

  // ✅ CORRECT - Use bigint operators directly
  const result = a / b;  // Division
  const result = a * b;  // Multiplication
  const result = a + b;  // Addition
  const result = a - b;  // Subtraction

  // Only use Uint.from() for construction
  const value = Uint.from(123);

  Pattern 5: Test Count Expectations

  Different primitives have different test counts:
  - Symmetric conversions (Wei, Gwei): 45 tests (to/from
  both directions)
  - Base unit (Ether): 40 tests (only converts TO others,
   not from itself)
  - Simple primitives (constants): 5 tests
  - Universal constructors: 10 tests (bigint, number,
  string, hex, zero, large, edge cases)
  - Specific conversions: 6 tests (typical, zero,
  multiple, edge, large, precision)
  - Integration: 20-30 tests (round-trips, cross-module,
  precision, large values, zero)

  Pattern 6: Zig Integration

  // primitives/modulename.zig
  const std = @import("std");

  pub const ModuleName = @This();

  // Fields (if stateful)
  bytes: [SIZE]u8,

  // Constants
  pub const SIZE = 32;

  // Methods
  pub fn fromHex(hex: []const u8) !ModuleName {
      // Validation
      if (hex.len < 2 or hex[0] != '0' or hex[1] != 'x')
  {
          return error.InvalidHexFormat;
      }

      // Parse
      var result: ModuleName = undefined;
      _ = std.fmt.hexToBytes(&result.bytes, hex[2..])
  catch
          return error.InvalidHexString;

      return result;
  }

  // Tests (inline)
  test "fromHex valid" {
      const result = try fromHex("0xabcd...");
      try std.testing.expectEqual(@as(u8, 0xab),
  result.bytes[0]);
  }

  ---
  📋 Implementation Strategy

  Expected Output:
  ## Discovery Results
  - Total tests: X passing, Y failing
  - Crypto module status: [list each crypto primitive
  with test count]
  - Precompiles status: [list each precompile with test
  count]
  - Zig test status: [passing/failing breakdown]
  - Priority order: [numbered list of what to implement
  first]

  Phase 2: Crypto Primitives (Likely 4-8 hours per
  primitive)

  For each crypto primitive (keccak256, secp256k1, etc):

  For TypeScript methods:
  1. Write test (method.test.ts)
  2. Verify RED (test fails)
  3. Implement (method.ts or method.js)
  4. Verify GREEN (test passes)
  5. Refactor if needed

  For Zig methods:
  1. Write inline test in .zig file
  2. Run `zig build test -Dtest-filter=methodname`
  3. Verify RED
  4. Implement in .zig
  5. Verify GREEN
  6. Create WASM bindings in .wasm.ts
  7. Test WASM bindings with TypeScript tests
  Crypto Priority Order (by dependency):
  1. keccak256 - Used by almost everything (Address,
  Hash, etc)
  2. secp256k1 - Needed for signatures, ecRecover
  precompile
  3. SHA256 - Standalone, needed for 0x02 precompile
  4. RIPEMD160 - Standalone, needed for 0x03 precompile
  5. Blake2 - Standalone, needed for 0x0a precompile
  6. BLS12-381 - Complex, needed for BLS precompiles
  7. BN254 - Complex, needed for 0x06-0x09 precompiles
  8. KZG - Very complex, depends on BLS12-381

  Phase 3: Precompiles (2-4 hours per precompile)

  For each precompile:


  <precompile address="0x01" name="ecRecover">
    <dependencies>
      - Requires: secp256k1 crypto implementation
      - Requires: keccak256 crypto implementation
    </dependencies>

    <step_1 duration="15min">
      Read EIP specification:
      - Understand exact input format (32-byte hash, v,
  r, s)
      - Understand output format (20-byte address or
  empty)
      - Understand gas cost
      - Check Yellow Paper reference
    </step_1>

    <step_2 duration="30min">
      Read existing code:
      - src/precompiles/ecrecover.zig (if exists)
      - src/precompiles/ecRecover.ts (if exists)
      - Identify test coverage gaps
    </step_2>

    <step_3 duration="2-3hours">
      Implement with TDD:

      Test vectors from Ethereum test suite:
      - Valid recovery (multiple test cases)
      - Invalid v value (should fail gracefully)
      - Invalid signature (should return empty)
      - Edge cases (all zeros, max values)

      For each test vector:
      1. Write test with known input/output
      2. Verify RED
      3. Implement precompile
      4. Verify GREEN
    </step_3>

    <step_4 duration="30min">
      Gas cost verification:
      - Implement gas calculation
      - Test gas cost matches EIP spec
      - Test out-of-gas handling
    </step_4>

    <step_5 duration="15min">
      Integration:
      - Add to precompiles/index.ts
      - Test call via EVM simulation (if available)
      - Verify exports work
    </step_5>
  </precompile>


  Precompile Priority Order:
  1. 0x01 ecRecover - Most commonly used
  2. 0x02 SHA256 - Simple, good warmup
  3. 0x03 RIPEMD160 - Simple
  4. 0x04 Identity - Trivial (just datacopy)
  5. 0x05 ModExp - Complex but isolated
  6. 0x0a Blake2f - Moderate complexity
  7. 0x06-0x09 BN254 - Complex, do together
  8. 0x0b-0x12 BLS12-381 - Very complex
  9. 0x14 Point evaluation - KZG, most complex

  ---
  🔧 Detailed Task Breakdowns

  ## [Module Name] Implementation

  **Status**: 🔴 Not Started / 🟡 In Progress / 🟢
  Complete
  **Priority**: High / Medium / Low
  **Dependencies**: [List other modules needed first]
  **Estimated Time**: X hours

  ### Pre-Implementation Checklist
  - [ ] Read all relevant documentation
  - [ ] Study existing code (TS + Zig)
  - [ ] Identify all methods needing implementation
  - [ ] Count expected test cases (based on method types)
  - [ ] Check for C/Rust library dependencies

  ### Implementation Steps
  1. **TypeScript Implementation** (X methods)
     - [ ] Method 1: [name] - TDD cycle (RED→GREEN)
     - [ ] Method 2: [name] - TDD cycle (RED→GREEN)
     - [ ] ...

  2. **Zig Implementation** (Y methods)
     - [ ] Method 1: [name] - TDD cycle (RED→GREEN)
     - [ ] Method 2: [name] - TDD cycle (RED→GREEN)
     - [ ] ...

  3. **WASM Bindings** (if Zig exists)
     - [ ] Create .wasm.ts file
     - [ ] Bind each Zig method
     - [ ] Test WASM performance vs native

  4. **Integration**
     - [ ] Create/verify index.ts
     - [ ] Add to parent module index
     - [ ] Write integration tests (X tests minimum)
     - [ ] Update package.json exports

  ### Verification Checklist
  - [ ] All TypeScript tests pass: `bun run vitest
  src/path --run`
  - [ ] All Zig tests pass: `zig build test`
  - [ ] Integration tests pass
  - [ ] No regressions in other modules
  - [ ] Documentation matches implementation
  - [ ] Progress updated in tdddocs.md

  ### Metrics
  - Files created: X
  - Tests written: Y
  - Test pass rate: Z%
  - Time taken: W hours
  - Issues encountered: [list]

  Specific Module Tasks

  // WASM bindings
  export function keccak256Wasm(data: Uint8Array):
  Uint8Array;

  **Expected Tests (minimum 15):**
  - Valid hash of empty bytes
  - Valid hash of known test vectors (5+)
  - Hash of various lengths
  - Hash consistency (same input = same output)
  - Integration with Address
  - Integration with Hash primitive
  - WASM vs native comparison
  - Performance benchmarks
  </module>

  <module name="crypto/secp256k1">
  **Expected API:**
  ```typescript
  // src/crypto/secp256k1.ts
  export function sign(hash: Uint8Array, privateKey:
  Uint8Array): Signature;
  export function verify(hash: Uint8Array, signature:
  Signature, publicKey: Uint8Array): boolean;
  export function recover(hash: Uint8Array, signature:
  Signature): Uint8Array;
  export function generateKeyPair(): { privateKey:
  Uint8Array; publicKey: Uint8Array };

  Expected Tests (minimum 30):
  - Sign with known private key
  - Verify valid signature
  - Verify invalid signature
  - Recover public key from signature
  - Generate random keypair
  - Edge cases (zero, max values)
  - Known test vectors from Ethereum
  - Integration with Transaction signing
  - WASM bindings tests

  Expected Tests (minimum 20):
  - Valid recovery (multiple test vectors)
  - Invalid v value (27/28 only valid)
  - Invalid signature
  - All zeros input
  - Malformed input (wrong length)
  - Gas cost verification
  - Integration with secp256k1
  - Ethereum test suite vectors

  ---
  ⚠️ Common Pitfalls & Solutions

  Solution:
  import { BrandedFoo } from "./BrandedFoo/index.js";
  BrandedFoo.from(123); // ✅ Works

  Pitfall 2: Uint Wrapper Methods

  Problem:
  const result = Uint.div(a, b); // ERROR: Uint.div
  doesn't exist

  Solution:
  const result = a / b; // ✅ Use bigint operators
  directly

  Pitfall 3: Skipping RED Phase

  Problem:
  - Writing implementation before seeing test fail
  - Can't verify test actually works

  Solution:
  1. Write test FIRST
  2. Run test - MUST see it FAIL
  3. Only then write implementation

  Pitfall 4: File Extensions

  Problem:
  import { foo } from "./foo.ts"; // Wrong!
  import { foo } from "./foo";    // Wrong!

  Solution:
  import { foo } from "./foo.js";  // ✅ Always .js even
  for .ts files

  Pitfall 5: Zig ArrayList Syntax (0.15.1)

  Problem:
  var list = std.ArrayList(T).init(allocator); // Old
  syntax
  list.deinit();                                // Wrong!
  list.append(item);                            // Wrong!

  Solution:
  var list = std.ArrayList(T){};  // ✅ 0.15.1 syntax
  defer list.deinit(allocator);   // ✅ Pass allocator
  try list.append(allocator, item); // ✅ Pass allocator

  Pitfall 6: Test File Naming

  Problem:
  method.spec.ts  // Wrong
  method.tests.ts // Wrong
  methodTest.ts   // Wrong

  Solution:
  method.test.ts  // ✅ Correct pattern

  Pitfall 7: Zig Test Output

  Problem:
  - No output when running zig build test
  - Unclear if tests passed or were skipped

  Solution:
  - No output = tests PASSED ✅
  - If tests fail, you'll see detailed error messages
  - Use std.debug.print if you need visibility during
  development
  - Set std.testing.log_level = .debug; for verbose
  output

  Pitfall 8: WASM Memory Management

  Problem:
  // Memory allocated in WASM not freed
  const result = wasmFunction(data);
  // Memory leak!

  Solution:
  // Check .wasm.ts files for proper cleanup patterns
  // Some WASM functions return memory that must be freed
  const result = wasmFunction(data);
  // Use result...
  if (needsCleanup) {
    wasmFree(result); // If function allocates
  }

  ---
  ✅ Success Criteria

  Overall Success

  - All crypto primitives: 100% test coverage
  - All precompiles: 100% test coverage
  - bun run vitest --run shows all tests passing
  - zig build test shows all tests passing
  - zig build ci passes completely
  - No regressions in previously passing tests
  - Documentation matches implementation
  - Cross-module integration tests pass
  - Performance benchmarks run (optional but nice)

  Final Deliverables

  1. Test Report
  ## Implementation Complete

  **Crypto Module:**
  - keccak256: X tests passing ✅
  - secp256k1: Y tests passing ✅
  - [... all others ...]
  - Total: N tests passing

  **Precompiles Module:**
  - 0x01 ecRecover: X tests passing ✅
  - [... all others ...]
  - Total: M tests passing

  **Integration:**
  - Crypto integration: X tests passing ✅
  - Precompiles integration: Y tests passing ✅

  **Grand Total: (N + M + X + Y) tests passing**
  2. Updated .claude/commands/tdddocs.md with:
    - Completion status for each module
    - Metrics (files, tests, time)
    - Lessons learned
    - Any issues encountered
  3. Verification Evidence
    - Screenshot or copy of bun run vitest --run final
  output
    - Screenshot or copy of zig build test final output
    - Confirmation that zig build ci passes

  ---
  📚 Reference Resources

  Code Reference Patterns

  - Address: src/primitives/Address/ - Perfect reference
  implementation
  - Denomination: src/primitives/Denomination/ - Recent
  complete implementation
  - Hash: src/primitives/Hash/ - Another good example

  Zig Resources

  - Documentation:
  https://ziglang.org/documentation/0.15.1/
  - Existing Zig: Look at src/primitives/*/\*.zig files
  for patterns
  - Root modules: src/primitives/root.zig,
  src/crypto/root.zig

  Ethereum Specs

  - Yellow Paper: Precompile gas costs
  - EIPs: Each precompile has an EIP (or in Yellow Paper
  for originals)
  - Test Vectors: Look for Ethereum test suite vectors in
   docs

  Testing Commands

  # TypeScript tests
  bun run vitest --run                           # All
  tests
  bun run vitest src/crypto --run                # Crypto
   only
  bun run vitest src/precompiles --run           #
  Precompiles only
  bun run vitest path/to/file.test.ts --run     # Single
  file
  bun run vitest --watch                         # Watch
  mode

  # Zig tests
  zig build test                                 # All
  Zig tests
  zig build test -Dtest-filter=keccak256        # Filter
  by name
  zig build -Dtest-filter=pattern                #
  Pattern match

  # Full CI
  zig build ci                                   #
  Complete pipeline

  # Benchmarks
  bun run bench                                  # All
  benchmarks
  zig build bench                                # Zig
  benchmarks
  ---
  🚀 Getting Started (First 30 Minutes)

  Check Zig status

  zig build test > /tmp/zig_status.txt 2>&1
  echo $? # 0 = success

  List crypto files

  ls -la src/crypto/

  List precompile files

  ls -la src/precompiles/

  Check for 0% coverage modules

  echo "Modules to investigate:"
  find src/crypto -name ".test.ts" -o -name ".test.js"
  find src/precompiles -name ".test.ts" -o -name
  ".test.js"

  ### Step 2: Create Task List (10 min)
  Based on assessment, create prioritized task list:

  ```markdown
  ## Task Priority List

  ### High Priority (Dependencies / 0% coverage)
  1. [ ] crypto/keccak256 - Used everywhere, must do
  first
  2. [ ] crypto/secp256k1 - Needed for signatures
  3. [ ] ...

  ### Medium Priority (Independent modules)
  1. [ ] crypto/sha256
  2. [ ] crypto/ripemd160
  3. [ ] ...

  ### Low Priority (Complex / Depends on others)
  1. [ ] crypto/bls12-381
  2. [ ] crypto/bn254
  3. [ ] crypto/kzg

  Step 3: Start First Module (10 min)

  # Example: Starting keccak256
  cd /Users/williamcory/primitives

  # Read existing code
  cat src/crypto/keccak256.ts
  cat src/crypto/keccak256.zig

  # Check current test status
  bun run vitest src/crypto/keccak256 --run

  # Read any docs
  ls src/content/docs/crypto/keccak256/

  Step 4: First TDD Cycle

  Pick the simplest method and do complete
  RED→GREEN→REFACTOR cycle:

  1. Write test
  2. See RED
  3. Implement
  4. See GREEN
  5. Document in tdddocs.md

  This establishes the rhythm for the rest of the work.


  ---
  💡 Pro Tips

  ---
  📞 When You're Done

  # Crypto & Precompiles Implementation - COMPLETE

  ## Executive Summary
  - **Total Time**: X hours
  - **Modules Completed**: Y
  - **Tests Written**: Z
  - **Test Pass Rate**: 100% ✅

  ## Crypto Module
  | Primitive | Files | Tests | Status |
  |-----------|-------|-------|--------|
  | keccak256 | 15 | 45 | ✅ |
  | secp256k1 | 20 | 67 | ✅ |
  | ... | ... | ... | ... |
  | **Total** | **X** | **Y** | **✅** |

  ## Precompiles Module
  | Precompile | Address | Tests | Status |
  |------------|---------|-------|--------|
  | ecRecover | 0x01 | 25 | ✅ |
  | SHA256 | 0x02 | 15 | ✅ |
  | ... | ... | ... | ... |
  | **Total** | **-** | **Y** | **✅** |

  ## Integration Tests
  - Crypto cross-module: X tests ✅
  - Precompiles cross-module: Y tests ✅
  - Crypto → Precompiles: Z tests ✅

  ## Verification
  ```bash
  $ bun run vitest --run
  Test Files: N passed (N)
  Tests: M passed (M)

  $ zig build test
  # Exit code: 0 ✅

  $ zig build ci
  # All stages passed ✅

  Issues Encountered

  1. [Issue description] - [Solution]
  2. ...

  Lessons Learned

  1. [Key insight]
  2. ...

  Next Steps (If Any)

  - Performance optimization
  - Additional test vectors
  - Documentation updates
  - Benchmarking improvements

  ### Update Progress File
  Add final section to `.claude/commands/tdddocs.md`:

  ```markdown
  ### ✅ CRYPTO & PRECOMPILES COMPLETE! (Date)

  **Status**: Library 100% complete

  **Final Test Count**: XXXX tests passing
  - Primitives: XXX tests
  - Crypto: XXX tests
  - Precompiles: XXX tests
  - Integration: XXX tests

  **Session Metrics**:
  - Time: X hours
  - Modules completed: Y
  - Lines of code: ZZZZ
  - No regressions: ✅

  **All phases complete:**
  - Phase 1: Core primitives ✅
  - Phase 2: Extended primitives ✅
  - Phase 3: Crypto ✅
  - Phase 4: Precompiles ✅
  - Phase 5: Integration ✅

  ---
  🎯 Mission Restatement

  You are implementing crypto primitives and EVM
  precompiles for a production Ethereum library. Every
  line must be correct. No stubs, no TODOs, no shortcuts.
   Follow TDD strictly (RED→GREEN→REFACTOR). Use patterns
   from Denomination implementation. Test coverage must
  be 100%. All tests must pass. Zig build must succeed.
  Integration tests required.

  Start with discovery, prioritize by dependencies,
  implement one module fully before moving to next,
  verify continuously, document progress.

  Good luck! 🚀
