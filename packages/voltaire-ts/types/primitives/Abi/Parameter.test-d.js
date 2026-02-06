/**
 * Type-level tests for Abi Parameter complex generics
 * Tests ParametersToPrimitiveTypes and ParametersToObject type transformations
 *
 * NOTE: These tests verify the type mappings that Parameter.ts applies on top of abitype.
 * Our custom mappings:
 * - address -> BrandedAddress (overrides abitype's `0x${string}`)
 * - All other types use abitype's default mappings:
 *   - bytes/bytesN -> `0x${string}` (not Uint8Array in type system)
 *   - uint8/uint16/uint32/int8/int16/int32 -> number (not bigint for <= 48 bits)
 *   - uint64+ -> bigint
 *   - tuples -> objects with named fields
 *   - arrays -> readonly arrays
 *
 * The tests cover the critical generic type transformations:
 * - Basic type mapping (address, uint, int, bool, string, bytes)
 * - Array types (dynamic and fixed-length)
 * - Tuple types (simple, nested, arrays of tuples)
 * - Multi-parameter functions
 * - Object creation from parameters
 * - Indexed parameters (for events)
 * - Edge cases and real-world scenarios
 */
import { describe, expectTypeOf, it } from "vitest";
// ============================================================================
// ParametersToPrimitiveTypes Tests
// ============================================================================
describe("ParametersToPrimitiveTypes", () => {
    describe("Basic type mappings", () => {
        it("maps address to BrandedAddress", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps uint256 to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps bool to boolean", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps string to string", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps bytes to Uint8Array", () => {
            expectTypeOf().toMatchTypeOf();
        });
        it("maps bytes32 to Uint8Array", () => {
            expectTypeOf().toMatchTypeOf();
        });
    });
    describe("Array type mappings", () => {
        it("maps dynamic address arrays", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps fixed uint256 arrays", () => {
            expectTypeOf().toMatchTypeOf();
        });
        it("maps nested dynamic arrays", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps bool arrays", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps fixed bytes arrays", () => {
            expectTypeOf().toMatchTypeOf();
        });
        it("maps string arrays", () => {
            expectTypeOf().toEqualTypeOf();
        });
    });
    describe("Tuple type mappings", () => {
        it("maps simple tuple", () => {
            expectTypeOf().toHaveProperty("to");
            expectTypeOf().toHaveProperty("amount");
            expectTypeOf().toEqualTypeOf();
            expectTypeOf().toEqualTypeOf();
        });
        it("maps tuple with multiple field types", () => {
            expectTypeOf().toHaveProperty("owner");
            expectTypeOf().toHaveProperty("balance");
            expectTypeOf().toHaveProperty("active");
            expectTypeOf().toHaveProperty("name");
        });
        it("maps nested tuple", () => {
            expectTypeOf().toHaveProperty("inner");
            expectTypeOf().toHaveProperty("addr");
            expectTypeOf().toHaveProperty("value");
        });
        it("maps deeply nested tuple", () => {
            expectTypeOf().toHaveProperty("level2");
            expectTypeOf().toHaveProperty("owner");
            expectTypeOf().toHaveProperty("level3");
            expectTypeOf().toHaveProperty("flag");
        });
        it("maps tuple arrays", () => {
            expectTypeOf().toHaveProperty("id");
            expectTypeOf().toHaveProperty("owner");
        });
        it("maps fixed tuple arrays", () => {
            expectTypeOf().toMatchTypeOf();
        });
    });
    describe("Multi-parameter mappings", () => {
        it("maps multiple simple parameters", () => {
            expectTypeOf().toEqualTypeOf();
            expectTypeOf().toEqualTypeOf();
            expectTypeOf().toEqualTypeOf();
            expectTypeOf().toMatchTypeOf();
        });
        it("maps mixed parameter types", () => {
            expectTypeOf().toEqualTypeOf();
            expectTypeOf().toEqualTypeOf();
            expectTypeOf().toEqualTypeOf();
            expectTypeOf().toEqualTypeOf();
        });
        it("maps complex multi-parameter with tuples", () => {
            expectTypeOf().toEqualTypeOf();
            expectTypeOf().toHaveProperty("to");
            expectTypeOf().toHaveProperty("amount");
            expectTypeOf().toMatchTypeOf();
        });
    });
});
// ============================================================================
// ParametersToObject Tests
// ============================================================================
describe("ParametersToObject", () => {
    describe("Basic object creation", () => {
        it("creates object with named parameters", () => {
            expectTypeOf().toHaveProperty("to");
            expectTypeOf().toHaveProperty("amount");
            expectTypeOf().toEqualTypeOf();
            expectTypeOf().toEqualTypeOf();
        });
        it("creates object with multiple field types", () => {
            expectTypeOf().toHaveProperty("owner");
            expectTypeOf().toHaveProperty("balance");
            expectTypeOf().toHaveProperty("active");
            expectTypeOf().toHaveProperty("name");
        });
        it("handles parameters with optional names", () => {
            expectTypeOf().toHaveProperty("to");
        });
    });
    describe("Array field mappings", () => {
        it("creates object with array fields", () => {
            expectTypeOf().toHaveProperty("recipients");
            expectTypeOf().toHaveProperty("amounts");
            expectTypeOf().toEqualTypeOf();
        });
        it("creates object with fixed array fields", () => {
            expectTypeOf().toHaveProperty("hashes");
            expectTypeOf().toHaveProperty("values");
        });
    });
    describe("Tuple field mappings", () => {
        it("creates object with tuple fields", () => {
            expectTypeOf().toHaveProperty("id");
            expectTypeOf().toHaveProperty("metadata");
            expectTypeOf().toHaveProperty("creator");
            expectTypeOf().toHaveProperty("timestamp");
        });
        it("creates object with nested tuple fields", () => {
            expectTypeOf().toHaveProperty("owner");
            expectTypeOf().toHaveProperty("config");
            expectTypeOf().toHaveProperty("inner");
            expectTypeOf().toHaveProperty("enabled");
        });
    });
});
// ============================================================================
// Indexed Parameter Tests (for events)
// ============================================================================
describe("Indexed parameters", () => {
    it("preserves indexed flag in parameter type", () => {
        expectTypeOf().toHaveProperty("indexed");
        expectTypeOf().toEqualTypeOf();
    });
    it("preserves non-indexed flag", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("handles optional indexed property", () => {
        expectTypeOf().toEqualTypeOf();
    });
    it("maps indexed parameters to primitives correctly", () => {
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
    });
});
// ============================================================================
// Edge Cases
// ============================================================================
describe("Parameter edge cases", () => {
    describe("All uint variants", () => {
        it("maps uint8 to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps uint16 to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps uint32 to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps uint64 to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps uint128 to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps uint256 to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps plain uint to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
    });
    describe("All int variants", () => {
        it("maps int8 to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps int16 to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps int128 to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps int256 to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("maps plain int to bigint", () => {
            expectTypeOf().toEqualTypeOf();
        });
    });
    describe("All bytesN variants", () => {
        it("maps bytes1 to Uint8Array", () => {
            expectTypeOf().toMatchTypeOf();
        });
        it("maps bytes4 to Uint8Array", () => {
            expectTypeOf().toMatchTypeOf();
        });
        it("maps bytes8 to Uint8Array", () => {
            expectTypeOf().toMatchTypeOf();
        });
        it("maps bytes16 to Uint8Array", () => {
            expectTypeOf().toMatchTypeOf();
        });
        it("maps bytes32 to Uint8Array", () => {
            expectTypeOf().toMatchTypeOf();
        });
        it("maps dynamic bytes to Uint8Array", () => {
            expectTypeOf().toMatchTypeOf();
        });
    });
    describe("Empty and edge cases", () => {
        it("handles empty parameter array", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("handles empty parameter object", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("handles single parameter", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("preserves readonly tuple type", () => {
            expectTypeOf().toMatchTypeOf();
        });
    });
    describe("Internal type handling", () => {
        it("handles parameter with internalType", () => {
            expectTypeOf().toEqualTypeOf();
        });
        it("handles tuple with internal types", () => {
            expectTypeOf().toHaveProperty("owner");
            expectTypeOf().toHaveProperty("balance");
        });
    });
});
// ============================================================================
// Complex Real-World Scenarios
// ============================================================================
describe("Real-world parameter scenarios", () => {
    it("maps ERC20 transfer parameters", () => {
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toHaveProperty("to");
        expectTypeOf().toHaveProperty("amount");
    });
    it("maps ERC721 safeTransferFrom parameters", () => {
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toMatchTypeOf();
    });
    it("maps multi-sig transaction parameters", () => {
        expectTypeOf().toHaveProperty("to");
        expectTypeOf().toHaveProperty("value");
        expectTypeOf().toHaveProperty("data");
        expectTypeOf().toHaveProperty("nonce");
        expectTypeOf().toMatchTypeOf();
    });
    it("maps DEX swap parameters", () => {
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toHaveProperty("token");
        expectTypeOf().toHaveProperty("fee");
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
    });
    it("maps event log parameters with indexed", () => {
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toHaveProperty("from");
        expectTypeOf().toHaveProperty("to");
        expectTypeOf().toHaveProperty("value");
    });
});
