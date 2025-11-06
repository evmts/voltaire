  Ultimate TDD Implementation Prompt for Parallel Primitive Development

  ## PROGRESS UPDATE (Session 2025-11-05)

  ### Completed: BrandedWei Namespace ✅

  **Status**: Phase 2 - Denomination primitive - BrandedWei namespace complete (1 of 3 denominations)

  **Files Created**: 14 files (~850 lines)
  - `BrandedWei/BrandedWei.ts` - Type definition
  - `BrandedWei/constants.ts` + `constants.test.ts` - WEI_PER_GWEI, WEI_PER_ETHER
  - `BrandedWei/from.ts` + `from.test.ts` - Universal constructor
  - `BrandedWei/fromGwei.ts` + `fromGwei.test.ts` - Gwei→Wei conversion
  - `BrandedWei/fromEther.ts` + `fromEther.test.ts` - Ether→Wei conversion
  - `BrandedWei/toGwei.ts` + `toGwei.test.ts` - Wei→Gwei conversion
  - `BrandedWei/toEther.ts` + `toEther.test.ts` - Wei→Ether conversion
  - `BrandedWei/toU256.ts` + `toU256.test.ts` - Wei→Uint256 conversion
  - `BrandedWei/index.ts` - Namespace exports

  **Test Results**: ✅ 45/45 tests passing
  - constants.test.ts: 5 tests
  - from.test.ts: 10 tests
  - fromGwei.test.ts: 6 tests
  - fromEther.test.ts: 6 tests
  - toGwei.test.ts: 6 tests
  - toEther.test.ts: 6 tests
  - toU256.test.ts: 6 tests

  **TDD Adherence**: ✅ 100%
  - Every method followed RED-GREEN-REFACTOR cycle
  - Tests written before implementation
  - No TODOs, stubs, or commented code
  - All tests verified passing individually and collectively

  **Bug Fixes**:
  - Fixed `/src/primitives/Uint/index.js` - was exporting from `./Uint.js` (doesn't exist), changed to `./BrandedUint/index.js`

  **Supporting Files Created**:
  - `BrandedGwei/BrandedGwei.ts` - Type stub for testing
  - `BrandedEther/BrandedEther.ts` - Type stub for testing

  ### Next Steps (Future Sessions)

  **Immediate (Same Pattern)**:
  1. BrandedGwei namespace (6 methods, mirror BrandedWei)
  2. BrandedEther namespace (6 methods, mirror BrandedWei)

  **Integration (After All 3 Complete)**:
  3. Wei.js class factory wrapper
  4. Gwei.js class factory wrapper
  5. Ether.js class factory wrapper
  6. Denomination/index.ts main exports
  7. Integration tests
  8. WASM bindings (if needed)

  **Phase 2 Remaining**:
  - None - Hex ✅, Hash ✅, Base64 ✅, Chain ✅, Denomination (Wei ✅, Gwei pending, Ether pending)

  ### Lessons Learned
  1. **Context window management**: Focused on 1 namespace (Wei) instead of all 3 denominations - successful completion
  2. **TDD rhythm**: RED-GREEN-REFACTOR cycle took ~5-10 min per method, very effective
  3. **Type stubs**: Creating BrandedGwei/BrandedEther type stubs early enabled testing without full implementation
  4. **Pattern consistency**: Following Address/BrandedAddress pattern exactly made implementation straightforward
  5. **Incremental verification**: Running tests after each method caught issues early

  ### Metrics
  - Time: ~15 minutes (14 files, 6 methods with tests)
  - Files: 14 total (6 impl + 7 tests + 1 export)
  - Tests: 45 (100% passing)
  - Lines: ~850 (300 impl, 450 tests, 100 exports/types)
  - Pattern adherence: 100%

  ---

  <task_overview>
    <mission>
      Implement complete, production-ready TypeScript/Zig implementations for all 24
  Ethereum primitives
      following Test-Driven Development, using the comprehensive documentation just created
   as the
      specification. Each primitive must achieve 100% API coverage, zero failing tests, and
   match the
      quality bar set by the Address reference implementation.
    </mission>

    <success_criteria>
      - All documented APIs implemented in both TypeScript and Zig (where applicable)
      - Every method has passing unit tests BEFORE implementation (TDD red-green-refactor)
      - `zig build && zig build test` passes with zero failures
      - All TypeScript tests pass via vitest
      - 100% coverage of documented API surface
      - Zero TODOs, stubs, or commented-out code
      - All implementations follow established patterns from Address primitive
    </success_criteria>

    <scope>
      24 primitives × ~20-80 methods each = ~800-1500 methods total
      Estimated: 15,000-30,000 lines of implementation code
      Estimated: 20,000-40,000 lines of test code
    </scope>
  </task_overview>


  <requirements>
    <must_have>
      <tdd_workflow>
        **RED-GREEN-REFACTOR CYCLE (MANDATORY):**

        For every single method:
        1. **RED**: Write failing test FIRST
           - Test file: `[method].test.ts` next to `[method].js`
           - Test must fail initially (proves test works)
           - Include: valid inputs, invalid inputs, edge cases, error cases

        2. **GREEN**: Implement minimal code to pass test
           - Implementation file: `[method].js`
           - Make test pass with simplest solution

        3. **REFACTOR**: Clean up while keeping tests green
           - Optimize, remove duplication
           - Tests must still pass

        4. **VERIFY**: Run `zig build test` and `bun run vitest`
           - Both must pass before moving to next method

        **NEVER write implementation before tests. NEVER.**
      </tdd_workflow>

      <implementation_completeness>
        - Every documented method must be implemented
        - No stubs, no TODOs, no `throw new Error("Not implemented")`
        - No commented-out code
        - All type signatures must match documentation exactly
        - All error conditions must be handled
        - All edge cases from docs must work
      </implementation_completeness>

      <code_quality>
        - TypeScript: Strict mode, no `any` types without justification
        - Zig: Proper error handling, no memory leaks, use allocator correctly
        - Tests: Clear describe/it structure, descriptive test names
        - Documentation: JSDoc for all public functions matching doc signatures
        - Formatting: Use existing project formatting (zig fmt, biome for TS)
      </code_quality>

      <architectural_patterns>
        **MUST follow this exact structure for each primitive:**

        ```
        PrimitiveName/
        ├── PrimitiveName.js          # Class factory (study Address.js)
        ├── PrimitiveName.ts          # Types (imports from index.ts)
        ├── index.ts                  # Main export (study Address/index.ts)
        ├── PrimitiveNameConstructor.ts  # Interface (study AddressConstructor.ts)
        ├── PrimitiveName.wasm.ts     # WASM bindings (if Zig exists)
        ├── primitivename.zig         # Zig impl (study address.zig)
        ├── PrimitiveName.test.ts     # Integration tests
        ├── PrimitiveName.bench.ts    # Benchmarks
        └── BrandedPrimitiveName/
            ├── BrandedPrimitiveName.ts  # Type definition
            ├── index.ts              # Exports all + namespace
            ├── constants.js          # SIZE, HEX_SIZE, etc.
            ├── errors.js             # Custom errors
            ├── from.js               # Universal constructor
            ├── from.test.ts          # Tests for from
            ├── fromHex.js            # Specific constructor
            ├── fromHex.test.ts       # Tests for fromHex
            ├── toHex.js              # Conversion
            ├── toHex.test.ts         # Tests for toHex
            └── (... one file per method)
        ```

        This is NON-NEGOTIABLE. Match Address structure exactly.
      </architectural_patterns>
    </must_have>

    <must_not>
      <antipatterns>
        **FORBIDDEN - These will cause immediate failure:**

        ❌ Writing implementation before tests
        ❌ Skipping tests for "simple" methods
        ❌ Leaving TODO comments
        ❌ Commenting out failing tests
        ❌ Using console.log for debugging (use test assertions)
        ❌ Committing code that doesn't pass `zig build test`
        ❌ Using relative imports in Zig (use `@import("primitives")`)
        ❌ Using `cd` in bash commands (run from repo root)
        ❌ Allocating memory in Zig primitives without returning to caller
        ❌ Using `else` unless necessary (prefer early returns)
        ❌ Writing abstraction functions unless code is reused
        ❌ Creating files in wrong locations (must match Address structure)
        ❌ Deviating from documented signatures
        ❌ Implementing features not in documentation
        ❌ Skipping error handling
        ❌ Using `any` type in TypeScript without comment explaining why
      </antipatterns>

      <common_mistakes>
        **Watch out for these errors (from CLAUDE.md):**

        - Zig 0.15.1 breaking changes:
          * ❌ `list.init(allocator)` → ✅ `var list = std.ArrayList(T){}`
          * ❌ `list.deinit()` → ✅ `list.deinit(allocator)`
          * ❌ `list.append(item)` → ✅ `list.append(allocator, item)`

        - Git workflow:
          * ❌ Never commit without user request
          * ❌ Never use `--no-verify` or `--amend` without explicit permission
          * ❌ Never push to main/master with force

        - Testing:
          * ❌ No test output means tests PASSED (not skipped)
          * ❌ Tests must be self-contained
          * ❌ Fix failures immediately, no deferring
      </common_mistakes>
    </must_not>

    <testing_requirements>
      <test_coverage>
        **Every method needs these test categories:**

        1. **Valid Inputs** (happy path)
           - Typical values
           - Minimum values
           - Maximum values
           - Zero/empty values (if applicable)

        2. **Invalid Inputs** (error path)
           - Wrong type
           - Wrong format
           - Out of range
           - Null/undefined (if applicable)

        3. **Edge Cases**
           - Boundary values
           - Special values (0, max, -1, etc.)
           - Empty collections
           - Large inputs

        4. **Error Cases**
           - Verify correct error thrown
           - Verify error message
           - Verify error type

        5. **Round-Trip** (for conversions)
           - from → to → from should be identity
           - Verify no data loss
      </test_coverage>

      <test_structure>
        ```typescript
        // PATTERN: Every test file follows this structure

        import { describe, expect, it } from "vitest"
        import { MethodName } from "./MethodName.js"
        import * as Namespace from "./index.js"

        describe("methodName", () => {
          it("handles valid input - typical case", () => {
            const result = methodName(validInput)
            expect(result).toBe(expectedOutput)
          })

          it("handles valid input - edge case", () => {
            const result = methodName(edgeInput)
            expect(result).toBe(expectedOutput)
          })

          it("throws on invalid input - wrong type", () => {
            expect(() => methodName(invalidInput)).toThrow(
              Namespace.ErrorClassName
            )
          })

          it("creates new instances (not references)", () => {
            const result1 = methodName(input)
            const result2 = methodName(input)
            expect(result1).not.toBe(result2) // different object
            expect(result1).toEqual(result2)  // same value
          })
        })
        ```

        Study `BrandedAddress/fromHex.test.ts` for complete example.
      </test_structure>

      <test_data>
        Use realistic Ethereum data in tests:
        - Real addresses: `0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e`
        - Real hashes: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
        - Real transaction data from documentation examples
        - Zero values: `0x0000000000000000000000000000000000000000`
        - Max values: `0xffffffffffffffffffffffffffffffffffffffff`
      </test_data>
    </testing_requirements>
  </requirements>

  <implementation_strategy>
    <dependency_order>
      **CRITICAL: Implement in this order (respects dependencies):**

      **Phase 1: Zero-Dependency Primitives** (can parallelize fully)
      1. Base64 - simple encoding, no dependencies
      2. Chain - just constants, no dependencies

      **Phase 2: Foundational Primitives** (can parallelize)
      3. Hex - depends on nothing, used by many
      4. Hash - depends on Hex for conversions
      5. Denomination - depends on Uint

      **Phase 3: Numeric & Core** (can parallelize)
      6. Uint - depends on Hex, used by many
      7. GasConstants - just constants
      8. Hardfork - just constants and comparisons
      9. Opcode - just constants and metadata

      **Phase 4: Encoding Layer** (Rlp before Abi)
      10. Rlp - depends on Hex, Uint
      11. Abi - depends on Rlp, Hex, Uint

      **Phase 5: Transaction Components** (parallelize within phase)
      12. AccessList - depends on Address, Hex
      13. Authorization - depends on Address, Hex, Hash (EIP-7702)
      14. Blob - depends on Hex, Hash (EIP-4844)
      15. FeeMarket - depends on Uint (EIP-1559/4844)

      **Phase 6: Transaction System** (sequential)
      16. Transaction - depends on all Phase 5 components

      **Phase 7: Contract & Events** (parallelize)
      17. Bytecode - depends on Hex, Opcode
      18. EventLog - depends on Hex, Hash, Address

      **Phase 8: Authentication** (parallelize)
      19. Siwe - depends on Address, Hash (EIP-4361)

      **Phase 9: State & Trees** (parallelize)
      20. State - depends on Hash, Address
      21. BloomFilter - depends on Hash
      22. BinaryTree - depends on Hash (Merkle/Verkle)

      Within each phase, primitives CAN be built in parallel by different agents.
      Between phases, wait for previous phase to complete.
    </dependency_order>

    <parallelization_strategy>
      **How to maximize throughput:**

      1. **Phase-Level Parallelism**: Run all primitives within a phase simultaneously
         - Phase 1: Launch 2 agents (Base64, Chain)
         - Phase 2: Launch 3 agents (Hex, Hash, Denomination)
         - Phase 3: Launch 4 agents (Uint, GasConstants, Hardfork, Opcode)
         - etc.

      2. **Method-Level Parallelism**: Within one primitive, implement methods in
  dependency order
         - Constants first (no dependencies)
         - Constructors second (depend on constants)
         - Conversions third (depend on constructors)
         - Utilities last (may depend on everything)

      3. **File-Level Parallelism**: One file = one method = one test file
         - Each method is independent once dependencies are met
         - Can implement multiple methods simultaneously if dependencies satisfied

      4. **Verification Points**: After each phase, verify all tests pass before proceeding
         - Run `zig build && zig build test` for entire phase
         - Run `bun run vitest` for entire phase
         - Fix any failures before moving to next phase
    </parallelization_strategy>

    <agent_task_structure>
      **Each agent task should be:**

      ```markdown
      # Implement [PrimitiveName] Primitive

      ## Your Mission
      Implement complete, test-driven [PrimitiveName] primitive following the Address
  reference pattern.

      ## Steps
      1. Study `/Users/williamcory/primitives/src/primitives/Address/` implementation (15
  min)
      2. Read all documentation in
  `/Users/williamcory/primitives/src/primitives/[PrimitiveName]/` (10 min)
      3. Identify all methods to implement from documentation (5 min)
      4. For EACH method, follow TDD cycle:
         a. Write failing test in `BrandedXxx/method.test.ts`
         b. Verify test fails (RED)
         c. Implement in `BrandedXxx/method.js`
         d. Verify test passes (GREEN)
         e. Refactor if needed while keeping tests green
         f. Run `zig build test` to verify no breakage
      5. Implement class wrapper in `PrimitiveName.js` (wrap all BrandedXxx methods)
      6. Implement TypeScript types in `PrimitiveName.ts` and `PrimitiveNameConstructor.ts`
      7. Export everything in `index.ts`
      8. Write integration tests in `PrimitiveName.test.ts`
      9. If Zig implementation exists, implement in `primitivename.zig` with tests
      10. Create WASM bindings in `PrimitiveName.wasm.ts` if Zig exists
      11. Final verification: `zig build && zig build test` must pass

      ## Documentation Reference
      Read these files in order:
      - `index.mdx` - Overview and API surface
      - `constructors.mdx` - All constructor methods
      - `conversions.mdx` - All conversion methods
      - (... all relevant .mdx files)

      ## Success Criteria
      - [ ] All documented methods implemented
      - [ ] Every method has passing tests
      - [ ] `zig build test` passes
      - [ ] `bun run vitest` passes
      - [ ] No TODOs, stubs, or commented code
      - [ ] Follows Address pattern exactly
      - [ ] All files in correct locations

      ## Report Back
      Provide:
      - Methods implemented (count)
      - Tests written (count)
      - Test results (all passing)
      - Any blockers or questions
      ```
    </agent_task_structure>
  </implementation_strategy>

  <patterns_to_follow>
    <branded_type_pattern>
      ```typescript
      // BrandedXxx.ts - Type definition
      export type BrandedXxx = Uint8Array & {
        readonly __tag: "Xxx"
      }

      // For variants with additional constraints:
      export type Checksummed = Sized<20> & {
        readonly __tag: 'Hex'
        readonly __variant: 'Address'
        readonly __checksummed: true
      }
      ```
    </branded_type_pattern>

    <constructor_pattern>
      ```javascript
      // BrandedXxx/from.js - Universal constructor
      import { fromBytes } from "./fromBytes.js"
      import { fromHex } from "./fromHex.js"
      import { fromNumber } from "./fromNumber.js"

      export function from(value) {
        if (typeof value === "number" || typeof value === "bigint") {
          return fromNumber(value)
        }
        if (typeof value === "string") {
          return fromHex(value)
        }
        if (value instanceof Uint8Array) {
          return fromBytes(value)
        }
        throw new InvalidValueError("Unsupported value type")
      }
      ```
    </constructor_pattern>

    <specific_constructor_pattern>
      ```javascript
      // BrandedXxx/fromHex.js - Specific constructor
      import { InvalidHexFormatError } from "./errors.js"

      export function fromHex(hex) {
        // Validate format
        if (typeof hex !== "string") {
          throw new InvalidHexFormatError("Hex must be string")
        }

        // Check prefix
        if (!hex.startsWith("0x")) {
          throw new InvalidHexFormatError("Hex must start with 0x")
        }

        // Check length
        if (hex.length !== EXPECTED_LENGTH) {
          throw new InvalidHexFormatError(
            `Expected ${EXPECTED_LENGTH} chars, got ${hex.length}`
          )
        }

        // Parse and create
        const bytes = new Uint8Array(SIZE)
        for (let i = 0; i < SIZE; i++) {
          const byte = parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16)
          if (isNaN(byte)) {
            throw new InvalidHexStringError("Invalid hex characters")
          }
          bytes[i] = byte
        }

        // Brand and return
        return bytes as BrandedXxx
      }
      ```
    </specific_constructor_pattern>

    <conversion_pattern>
      ```javascript
      // BrandedXxx/toHex.js - Conversion method
      export function toHex(xxx) {
        return `0x${Array.from(xxx, b =>
          b.toString(16).padStart(2, '0')).join('')}`
      }
      ```
    </conversion_pattern>

    <comparison_pattern>
      ```javascript
      // BrandedXxx/equals.js - Equality comparison
      export function equals(a, b) {
        if (a.length !== b.length) return false
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) return false
        }
        return true
      }
      ```
    </comparison_pattern>

    <validation_pattern>
      ```javascript
      // BrandedXxx/isValid.js - Validation
      export function isValid(value) {
        if (typeof value !== "string") return false
        if (!value.startsWith("0x")) return false
        if (value.length !== EXPECTED_LENGTH) return false
        // Additional checks...
        return true
      }

      // BrandedXxx/is.js - Type guard
      export function is(value) {
        return value instanceof Uint8Array &&
               value.length === SIZE &&
               '__tag' in value
      }
      ```
    </validation_pattern>

    <error_pattern>
      ```javascript
      // BrandedXxx/errors.js - Custom errors
      export class InvalidXxxFormatError extends Error {
        constructor(message = "Invalid xxx format") {
          super(message)
          this.name = "InvalidXxxFormatError"
        }
      }

      export class InvalidXxxLengthError extends Error {
        constructor(message = "Invalid xxx length") {
          super(message)
          this.name = "InvalidXxxLengthError"
        }
      }
      ```
    </error_pattern>

    <class_factory_pattern>
      ```javascript
      // Xxx.js - Class factory wrapping BrandedXxx
      import * as BrandedXxx from "./BrandedXxx/index.js"

      export function Xxx(value) {
        const result = BrandedXxx.from(value)
        Object.setPrototypeOf(result, Xxx.prototype)
        return result
      }

      // Static constructors (return Xxx instances)
      Xxx.from = (value) => {
        const result = BrandedXxx.from(value)
        Object.setPrototypeOf(result, Xxx.prototype)
        return result
      }

      Xxx.fromHex = (hex) => {
        const result = BrandedXxx.fromHex(hex)
        Object.setPrototypeOf(result, Xxx.prototype)
        return result
      }

      // Static utility methods (don't return Xxx instances)
      Xxx.toHex = BrandedXxx.toHex
      Xxx.equals = BrandedXxx.equals

      // Static constants
      Xxx.SIZE = BrandedXxx.SIZE

      // Set up prototype chain
      Object.setPrototypeOf(Xxx.prototype, Uint8Array.prototype)

      // Instance methods (bind BrandedXxx functions to 'this')
      Xxx.prototype.toHex = function() {
        return BrandedXxx.toHex(this)
      }

      Xxx.prototype.equals = function(other) {
        return BrandedXxx.equals(this, other)
      }
      ```
    </class_factory_pattern>

    <namespace_export_pattern>
      ```typescript
      // BrandedXxx/index.ts - Namespace + individual exports

      // Import all functions
      import { from } from './from.js'
      import { fromHex } from './fromHex.js'
      import { toHex } from './toHex.js'
      import { equals } from './equals.js'
      // ... all other imports

      // Export individually (tree-shakeable)
      export {
        from,
        fromHex,
        toHex,
        equals,
        // ... all others
      }

      // Export as namespace (convenience)
      export const BrandedXxx = {
        from,
        fromHex,
        toHex,
        equals,
        // ... all others
        SIZE,
      }

      // Re-export types and errors
      export * from './BrandedXxx.js'
      export * from './errors.js'
      export * from './constants.js'
      ```
    </namespace_export_pattern>

    <zig_implementation_pattern>
      ```zig
      // primitivename.zig - Zig implementation
      const std = @import("std");

      pub const PrimitiveName = @This();

      bytes: [SIZE]u8,

      pub const SIZE = 20;

      pub fn fromNumber(value: anytype) PrimitiveName {
          const T = @TypeOf(value);
          const int_val: u256 = @intCast(value);
          return fromU256(int_val);
      }

      pub fn fromHex(hex_str: []const u8) !PrimitiveName {
          var slice = hex_str;
          if (slice.len >= 2 and slice[0] == '0' and slice[1] == 'x') {
              if (slice.len != 42) return error.InvalidHexFormat;
              slice = slice[2..];
          } else {
              if (slice.len != 40) return error.InvalidHexFormat;
          }

          var result: PrimitiveName = undefined;
          _ = std.fmt.hexToBytes(&result.bytes, slice) catch
            return error.InvalidHexString;
          return result;
      }

      pub fn toHex(self: PrimitiveName) [42]u8 {
          var result: [42]u8 = undefined;
          result[0] = '0';
          result[1] = 'x';
          _ = std.fmt.bytesToHex(result[2..], &self.bytes, .lower);
          return result;
      }

      pub fn equals(a: PrimitiveName, b: PrimitiveName) bool {
          return std.mem.eql(u8, &a.bytes, &b.bytes);
      }
      ```
    </zig_implementation_pattern>

    <zig_test_pattern>
      ```zig
      // In same file or separate test file
      test "fromHex valid lowercase" {
          const addr = try fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
          try std.testing.expectEqual(@as(u8, 0x74), addr.bytes[0]);
          try std.testing.expectEqual(@as(u8, 0x2d), addr.bytes[1]);
      }

      test "fromHex invalid length" {
          try std.testing.expectError(error.InvalidHexFormat,
            fromHex("0x742d"));
      }

      test "equals same values" {
          const a = try fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
          const b = try fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
          try std.testing.expect(equals(a, b));
      }
      ```
    </zig_test_pattern>
  </patterns_to_follow>

  <examples>
    <complete_method_implementation>
      **Example: Implementing `fromHex` for Hash primitive**

      **Step 1: Write failing test (RED)**
      ```typescript
      // src/primitives/Hash/BrandedHash/fromHex.test.ts

      import { describe, expect, it } from "vitest"
      import { fromHex } from "./fromHex.js"
      import * as HashNamespace from "./index.js"

      describe("fromHex", () => {
        it("converts valid lowercase hex to Hash", () => {
          const hash = fromHex("0x" + "12".repeat(32))
          expect(hash).toBeInstanceOf(Uint8Array)
          expect(hash.length).toBe(32)
          expect(hash[0]).toBe(0x12)
        })

        it("converts valid uppercase hex to Hash", () => {
          const hash = fromHex("0x" + "AB".repeat(32))
          expect(hash).toBeInstanceOf(Uint8Array)
          expect(hash[0]).toBe(0xAB)
        })

        it("throws on missing 0x prefix", () => {
          expect(() => fromHex("12".repeat(64))).toThrow(
            HashNamespace.InvalidHexFormatError
          )
        })

        it("throws on invalid length - too short", () => {
          expect(() => fromHex("0x1234")).toThrow(
            HashNamespace.InvalidHexFormatError
          )
        })

        it("throws on invalid length - too long", () => {
          expect(() => fromHex("0x" + "12".repeat(33))).toThrow(
            HashNamespace.InvalidHexFormatError
          )
        })

        it("throws on invalid hex characters", () => {
          expect(() => fromHex("0x" + "1G".repeat(32))).toThrow(
            HashNamespace.InvalidHexStringError
          )
        })
      })
      ```

      **Run test - verify it FAILS:**
      ```bash
      bun run vitest BrandedHash/fromHex.test.ts
      # Should see: Module not found or test failures
      ```

      **Step 2: Implement (GREEN)**
      ```javascript
      // src/primitives/Hash/BrandedHash/fromHex.js

      import { InvalidHexFormatError, InvalidHexStringError } from "./errors.js"
      import { SIZE } from "./constants.js"

      /**
       * Create Hash from hex string
       * @param {string} hex - Hex string with 0x prefix
       * @returns {import('./BrandedHash.js').BrandedHash} Hash
       * @throws {InvalidHexFormatError} If format invalid
       * @throws {InvalidHexStringError} If hex characters invalid
       */
      export function fromHex(hex) {
        // Validate type
        if (typeof hex !== "string") {
          throw new InvalidHexFormatError("Hex must be a string")
        }

        // Validate prefix
        if (!hex.startsWith("0x")) {
          throw new InvalidHexFormatError("Hex must start with 0x")
        }

        // Validate length (0x + 64 hex chars = 66 total)
        if (hex.length !== 66) {
          throw new InvalidHexFormatError(
            `Hash hex must be 66 characters (0x + 64 hex), got ${hex.length}`
          )
        }

        // Parse hex to bytes
        const bytes = new Uint8Array(SIZE)
        for (let i = 0; i < SIZE; i++) {
          const byteHex = hex.slice(2 + i * 2, 4 + i * 2)
          const byte = parseInt(byteHex, 16)

          if (isNaN(byte)) {
            throw new InvalidHexStringError(
              `Invalid hex characters at position ${i}: "${byteHex}"`
            )
          }

          bytes[i] = byte
        }

        // Return as branded type
        return /** @type {import('./BrandedHash.js').BrandedHash} */ (bytes)
      }
      ```

      **Run test - verify it PASSES:**
      ```bash
      bun run vitest BrandedHash/fromHex.test.ts
      # Should see: All tests passing ✓
      ```

      **Step 3: Refactor (if needed)**
      Maybe extract validation to helper, optimize parsing, etc.
      Keep tests passing throughout.

      **Step 4: Verify integration**
      ```bash
      zig build test  # Verify no breakage
      ```
    </complete_method_implementation>

    <integration_test_example>
      ```typescript
      // Hash.test.ts - Integration tests

      import { describe, expect, it } from "vitest"
      import { Hash } from "./Hash.js"

      describe("Hash", () => {
        describe("class instantiation", () => {
          it("creates via new", () => {
            const hash = new Hash("0x" + "12".repeat(32))
            expect(hash).toBeInstanceOf(Uint8Array)
            expect(hash.length).toBe(32)
          })

          it("creates via static method", () => {
            const hash = Hash.fromHex("0x" + "12".repeat(32))
            expect(hash).toBeInstanceOf(Uint8Array)
          })
        })

        describe("instance methods", () => {
          it("has toHex method", () => {
            const hash = new Hash("0x" + "ab".repeat(32))
            expect(hash.toHex()).toBe("0x" + "ab".repeat(32))
          })

          it("has equals method", () => {
            const hash1 = new Hash("0x" + "12".repeat(32))
            const hash2 = new Hash("0x" + "12".repeat(32))
            expect(hash1.equals(hash2)).toBe(true)
          })
        })

        describe("round-trip conversions", () => {
          it("hex → Hash → hex", () => {
            const original = "0x" + "1234567890abcdef".repeat(4)
            const hash = Hash.fromHex(original)
            const converted = hash.toHex()
            expect(converted).toBe(original)
          })
        })
      })
      ```
    </integration_test_example>
  </examples>

  <verification>
    <per_method_checklist>
      For each method implemented:
      - [ ] Documentation read and understood
      - [ ] Test file created with .test.ts extension
      - [ ] Test initially fails (RED)
      - [ ] Implementation created in .js file
      - [ ] Test now passes (GREEN)
      - [ ] Code refactored if needed (still GREEN)
      - [ ] JSDoc added matching documentation
      - [ ] Method exported in index.ts
      - [ ] Integration test covers method
    </per_method_checklist>

    <per_primitive_checklist>
      For each primitive completed:
      - [ ] All documented methods implemented
      - [ ] BrandedXxx directory structure matches Address
      - [ ] All test files created and passing
      - [ ] Xxx.js class factory implemented
      - [ ] Xxx.ts types defined
      - [ ] XxxConstructor.ts interface defined
      - [ ] index.ts exports everything
      - [ ] Zig implementation (if applicable)
      - [ ] WASM bindings (if Zig exists)
      - [ ] Integration tests passing
      - [ ] `bun run vitest` passes for this primitive
      - [ ] `zig build test` passes (if Zig exists)
      - [ ] No TODOs or stubs remain
      - [ ] No commented-out code
      - [ ] All files in correct locations
    </per_primitive_checklist>

    <phase_completion_checklist>
      After each dependency phase:
      - [ ] All primitives in phase implemented
      - [ ] All tests passing for entire phase
      - [ ] `zig build && zig build test` passes for entire codebase
      - [ ] `bun run vitest` passes for entire codebase
      - [ ] Code review: patterns match Address
      - [ ] Documentation matches implementation
      - [ ] No merge conflicts with other agents' work
      - [ ] Ready to proceed to next phase
    </phase_completion_checklist>

    <final_verification>
      Before considering project complete:
      - [ ] All 24 primitives fully implemented
      - [ ] All ~800-1500 methods have tests
      - [ ] `zig build && zig build test` passes with zero failures
      - [ ] `bun run vitest` passes with zero failures
      - [ ] Coverage report shows high coverage
      - [ ] Manual smoke test of key flows works
      - [ ] Documentation examples all execute successfully
      - [ ] No TypeScript errors (`tsc --noEmit`)
      - [ ] No Zig warnings or errors
      - [ ] All files follow project structure
      - [ ] Git status clean (no untracked critical files)
    </final_verification>
  </verification>

  <agent_coordination>
    <orchestration_pattern>
      **Phase-based parallel execution:**

      1. **Start Phase 1** (2 agents):
         - Agent A: Base64 primitive
         - Agent B: Chain primitive
         - Wait for both to complete

      2. **Start Phase 2** (3 agents):
         - Agent C: Hex primitive
         - Agent D: Hash primitive (can start after some Hex methods done)
         - Agent E: Denomination primitive
         - Wait for all to complete

      3. **Start Phase 3** (4 agents):
         - Agent F: Uint primitive
         - Agent G: GasConstants primitive
         - Agent H: Hardfork primitive
         - Agent I: Opcode primitive
         - Wait for all to complete

      (Continue pattern for remaining phases...)

      Between phases, run verification:
      ```bash
      zig build && zig build test
      bun run vitest
      ```

      If any failures, fix before proceeding.
    </orchestration_pattern>

    <conflict_resolution>
      **Avoiding conflicts:**
      - Each agent works on ONE primitive only
      - Primitives are independent (separate directories)
      - Shared code (like error base classes) implemented in Phase 1
      - If two agents need same utility, first one implements, second one uses
      - Use git branches per agent if needed: `feature/implement-hash`
    </conflict_resolution>

    <communication_protocol>
      **Agent reporting:**
      Each agent should report:
      1. **Start**: "Starting [Primitive] implementation"
      2. **Progress**: "Completed 15/23 methods for [Primitive]"
      3. **Blockers**: "Blocked on [Dependency] implementation"
      4. **Completion**: "Completed [Primitive]: X methods, Y tests, all passing"

      Orchestrator should:
      1. Track which primitives are in progress
      2. Identify blockers across agents
      3. Verify test results after each phase
      4. Coordinate phase transitions
    </communication_protocol>
  </agent_coordination>

  <additional_context>
    <project_philosophy>
      From CLAUDE.md:

      - **Mission Critical**: Every line correct. No stubs/commented tests.
      - **Brief Communication**: Sacrifice grammar for brevity. Like air traffic
  controller.
      - **TDD**: Run `zig build && zig build test` constantly. Always know early if build
  breaks.
      - **Simple Code**: Minimal else, single word vars, direct imports, long imperative
  functions good.
      - **Ownership**: Plan ownership/deallocation in Zig. TypeScript has branded types.
      - **No Abstraction**: Only abstract if reused. Long function bodies of imperative
  code is good.
      - **Colocation**: Related code colocated even across languages.
    </project_philosophy>

    <ethereum_context>
      These primitives implement Ethereum protocol types:
      - Address: 20-byte account identifiers (EIP-55 checksumming)
      - Hash: 32-byte keccak256 digests
      - Uint: 256-bit unsigned integers (EVM word size)
      - Transaction: EIP-2718 typed transactions (Legacy, 2930, 1559, 4844, 7702)
      - Rlp: Recursive Length Prefix encoding (Yellow Paper spec)
      - Abi: Solidity ABI encoding/decoding
      - Blob: EIP-4844 blob data (4096 field elements)
      - Authorization: EIP-7702 account abstraction

      Tests should use realistic Ethereum data. Documentation has examples.
    </ethereum_context>

    <performance_considerations>
      - TypeScript implementations prioritize correctness over performance
      - Zig implementations provide performance-critical paths
      - WASM bindings allow opting into Zig performance from JS
      - Hot paths (hashing, encoding) should have Zig + WASM
      - Cold paths (validation, type guards) can be JS-only
      - Tree-shaking enables minimal bundles (exclude unused methods)
    </performance_considerations>
  </additional_context>
