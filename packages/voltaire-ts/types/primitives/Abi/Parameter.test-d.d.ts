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
export {};
//# sourceMappingURL=Parameter.test-d.d.ts.map