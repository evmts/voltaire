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
import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type {
	Parameter,
	ParametersToObject,
	ParametersToPrimitiveTypes,
} from "./Parameter.js";

// Helper to extract actual types for testing
type ExtractActual<T extends readonly Parameter[]> =
	ParametersToPrimitiveTypes<T>;
type ExtractObject<T extends readonly Parameter[]> = ParametersToObject<T>;

// ============================================================================
// ParametersToPrimitiveTypes Tests
// ============================================================================

describe("ParametersToPrimitiveTypes", () => {
	describe("Basic type mappings", () => {
		it("maps address to BrandedAddress", () => {
			type Params = readonly [Parameter<"address", "to">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<BrandedAddress>();
		});

		it("maps uint256 to bigint", () => {
			type Params = readonly [Parameter<"uint256", "amount">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});

		it("maps bool to boolean", () => {
			type Params = readonly [Parameter<"bool", "flag">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<boolean>();
		});

		it("maps string to string", () => {
			type Params = readonly [Parameter<"string", "name">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<string>();
		});

		it("maps bytes to Uint8Array", () => {
			type Params = readonly [Parameter<"bytes", "data">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toMatchTypeOf<Uint8Array>();
		});

		it("maps bytes32 to Uint8Array", () => {
			type Params = readonly [Parameter<"bytes32", "hash">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toMatchTypeOf<Uint8Array>();
		});
	});

	describe("Array type mappings", () => {
		it("maps dynamic address arrays", () => {
			type Params = readonly [Parameter<"address[]", "addresses">];
			type Result = ExtractActual<Params>;
			type Item = Result[0] extends readonly (infer U)[] ? U : never;
			expectTypeOf<Item>().toEqualTypeOf<BrandedAddress>();
		});

		it("maps fixed uint256 arrays", () => {
			type Params = readonly [Parameter<"uint256[3]", "values">];
			type Result = ExtractActual<Params>;
			type Tuple = Result[0];
			expectTypeOf<Tuple>().toMatchTypeOf<readonly [bigint, bigint, bigint]>();
		});

		it("maps nested dynamic arrays", () => {
			type Params = readonly [Parameter<"uint256[][]", "matrix">];
			type Result = ExtractActual<Params>;
			type Outer = Result[0] extends readonly (infer U)[] ? U : never;
			type Inner = Outer extends readonly (infer V)[] ? V : never;
			expectTypeOf<Inner>().toEqualTypeOf<bigint>();
		});

		it("maps bool arrays", () => {
			type Params = readonly [Parameter<"bool[]", "flags">];
			type Result = ExtractActual<Params>;
			type Item = Result[0] extends readonly (infer U)[] ? U : never;
			expectTypeOf<Item>().toEqualTypeOf<boolean>();
		});

		it("maps fixed bytes arrays", () => {
			type Params = readonly [Parameter<"bytes32[2]", "hashes">];
			type Result = ExtractActual<Params>;
			type Tuple = Result[0];
			expectTypeOf<Tuple>().toMatchTypeOf<readonly [Uint8Array, Uint8Array]>();
		});

		it("maps string arrays", () => {
			type Params = readonly [Parameter<"string[]", "names">];
			type Result = ExtractActual<Params>;
			type Item = Result[0] extends readonly (infer U)[] ? U : never;
			expectTypeOf<Item>().toEqualTypeOf<string>();
		});
	});

	describe("Tuple type mappings", () => {
		it("maps simple tuple", () => {
			type TupleParam = Parameter<"tuple", "data"> & {
				components: readonly [
					Parameter<"address", "to">,
					Parameter<"uint256", "amount">,
				];
			};
			type Params = readonly [TupleParam];
			type Result = ExtractActual<Params>;
			type Obj = Result[0];
			expectTypeOf<Obj>().toHaveProperty("to");
			expectTypeOf<Obj>().toHaveProperty("amount");
			type To = Obj extends { to: infer T } ? T : never;
			type Amount = Obj extends { amount: infer A } ? A : never;
			expectTypeOf<To>().toEqualTypeOf<BrandedAddress>();
			expectTypeOf<Amount>().toEqualTypeOf<bigint>();
		});

		it("maps tuple with multiple field types", () => {
			type TupleParam = Parameter<"tuple", "record"> & {
				components: readonly [
					Parameter<"address", "owner">,
					Parameter<"uint256", "balance">,
					Parameter<"bool", "active">,
					Parameter<"string", "name">,
				];
			};
			type Params = readonly [TupleParam];
			type Result = ExtractActual<Params>;
			type Obj = Result[0];
			expectTypeOf<Obj>().toHaveProperty("owner");
			expectTypeOf<Obj>().toHaveProperty("balance");
			expectTypeOf<Obj>().toHaveProperty("active");
			expectTypeOf<Obj>().toHaveProperty("name");
		});

		it("maps nested tuple", () => {
			type InnerTuple = Parameter<"tuple", "inner"> & {
				components: readonly [Parameter<"uint256", "value">];
			};
			type OuterTuple = Parameter<"tuple", "outer"> & {
				components: readonly [InnerTuple, Parameter<"address", "addr">];
			};
			type Params = readonly [OuterTuple];
			type Result = ExtractActual<Params>;
			type Obj = Result[0];
			expectTypeOf<Obj>().toHaveProperty("inner");
			expectTypeOf<Obj>().toHaveProperty("addr");
			type Inner = Obj extends { inner: infer I } ? I : never;
			expectTypeOf<Inner>().toHaveProperty("value");
		});

		it("maps deeply nested tuple", () => {
			type Level3 = Parameter<"tuple", "level3"> & {
				components: readonly [Parameter<"uint256", "id">];
			};
			type Level2 = Parameter<"tuple", "level2"> & {
				components: readonly [Level3, Parameter<"bool", "flag">];
			};
			type Level1 = Parameter<"tuple", "level1"> & {
				components: readonly [Level2, Parameter<"address", "owner">];
			};
			type Params = readonly [Level1];
			type Result = ExtractActual<Params>;
			type Obj = Result[0];
			expectTypeOf<Obj>().toHaveProperty("level2");
			expectTypeOf<Obj>().toHaveProperty("owner");
			type L2 = Obj extends { level2: infer L } ? L : never;
			expectTypeOf<L2>().toHaveProperty("level3");
			expectTypeOf<L2>().toHaveProperty("flag");
		});

		it("maps tuple arrays", () => {
			type TupleParam = Parameter<"tuple[]", "items"> & {
				components: readonly [
					Parameter<"uint256", "id">,
					Parameter<"address", "owner">,
				];
			};
			type Params = readonly [TupleParam];
			type Result = ExtractActual<Params>;
			type ArrayItem = Result[0] extends readonly (infer U)[] ? U : never;
			expectTypeOf<ArrayItem>().toHaveProperty("id");
			expectTypeOf<ArrayItem>().toHaveProperty("owner");
		});

		it("maps fixed tuple arrays", () => {
			type TupleParam = Parameter<"tuple[2]", "pair"> & {
				components: readonly [
					Parameter<"uint256", "x">,
					Parameter<"uint256", "y">,
				];
			};
			type Params = readonly [TupleParam];
			type Result = ExtractActual<Params>;
			type Tuple = Result[0];
			expectTypeOf<Tuple>().toMatchTypeOf<
				readonly [{ x: bigint; y: bigint }, { x: bigint; y: bigint }]
			>();
		});
	});

	describe("Multi-parameter mappings", () => {
		it("maps multiple simple parameters", () => {
			type Params = readonly [
				Parameter<"address", "from">,
				Parameter<"address", "to">,
				Parameter<"uint256", "amount">,
				Parameter<"bytes", "data">,
			];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<BrandedAddress>();
			expectTypeOf<Result[1]>().toEqualTypeOf<BrandedAddress>();
			expectTypeOf<Result[2]>().toEqualTypeOf<bigint>();
			expectTypeOf<Result[3]>().toMatchTypeOf<Uint8Array>();
		});

		it("maps mixed parameter types", () => {
			type Params = readonly [
				Parameter<"address", "sender">,
				Parameter<"uint256[]", "values">,
				Parameter<"bool", "approved">,
				Parameter<"string", "message">,
			];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<BrandedAddress>();
			type Values = Result[1] extends readonly (infer U)[] ? U : never;
			expectTypeOf<Values>().toEqualTypeOf<bigint>();
			expectTypeOf<Result[2]>().toEqualTypeOf<boolean>();
			expectTypeOf<Result[3]>().toEqualTypeOf<string>();
		});

		it("maps complex multi-parameter with tuples", () => {
			type TupleParam = Parameter<"tuple", "data"> & {
				components: readonly [
					Parameter<"address", "to">,
					Parameter<"uint256", "amount">,
				];
			};
			type Params = readonly [
				Parameter<"address", "from">,
				TupleParam,
				Parameter<"bytes32", "hash">,
			];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<BrandedAddress>();
			expectTypeOf<Result[1]>().toHaveProperty("to");
			expectTypeOf<Result[1]>().toHaveProperty("amount");
			expectTypeOf<Result[2]>().toMatchTypeOf<Uint8Array>();
		});
	});
});

// ============================================================================
// ParametersToObject Tests
// ============================================================================

describe("ParametersToObject", () => {
	describe("Basic object creation", () => {
		it("creates object with named parameters", () => {
			type Params = readonly [
				Parameter<"address", "to">,
				Parameter<"uint256", "amount">,
			];
			type Result = ExtractObject<Params>;
			expectTypeOf<Result>().toHaveProperty("to");
			expectTypeOf<Result>().toHaveProperty("amount");
			type To = Result extends { to: infer T } ? T : never;
			type Amount = Result extends { amount: infer A } ? A : never;
			expectTypeOf<To>().toEqualTypeOf<BrandedAddress>();
			expectTypeOf<Amount>().toEqualTypeOf<bigint>();
		});

		it("creates object with multiple field types", () => {
			type Params = readonly [
				Parameter<"address", "owner">,
				Parameter<"uint256", "balance">,
				Parameter<"bool", "active">,
				Parameter<"string", "name">,
			];
			type Result = ExtractObject<Params>;
			expectTypeOf<Result>().toHaveProperty("owner");
			expectTypeOf<Result>().toHaveProperty("balance");
			expectTypeOf<Result>().toHaveProperty("active");
			expectTypeOf<Result>().toHaveProperty("name");
		});

		it("handles parameters with optional names", () => {
			type Params = readonly [Parameter<"address", "to">, Parameter<"uint256">];
			type Result = ExtractObject<Params>;
			expectTypeOf<Result>().toHaveProperty("to");
		});
	});

	describe("Array field mappings", () => {
		it("creates object with array fields", () => {
			type Params = readonly [
				Parameter<"address[]", "recipients">,
				Parameter<"uint256[]", "amounts">,
			];
			type Result = ExtractObject<Params>;
			expectTypeOf<Result>().toHaveProperty("recipients");
			expectTypeOf<Result>().toHaveProperty("amounts");
			type Recipients = Result extends { recipients: infer R } ? R : never;
			type RecipientItem = Recipients extends readonly (infer U)[] ? U : never;
			expectTypeOf<RecipientItem>().toEqualTypeOf<BrandedAddress>();
		});

		it("creates object with fixed array fields", () => {
			type Params = readonly [
				Parameter<"bytes32[2]", "hashes">,
				Parameter<"uint256[3]", "values">,
			];
			type Result = ExtractObject<Params>;
			expectTypeOf<Result>().toHaveProperty("hashes");
			expectTypeOf<Result>().toHaveProperty("values");
		});
	});

	describe("Tuple field mappings", () => {
		it("creates object with tuple fields", () => {
			type TupleParam = Parameter<"tuple", "metadata"> & {
				components: readonly [
					Parameter<"address", "creator">,
					Parameter<"uint256", "timestamp">,
				];
			};
			type Params = readonly [Parameter<"uint256", "id">, TupleParam];
			type Result = ExtractObject<Params>;
			expectTypeOf<Result>().toHaveProperty("id");
			expectTypeOf<Result>().toHaveProperty("metadata");
			type Metadata = Result extends { metadata: infer M } ? M : never;
			expectTypeOf<Metadata>().toHaveProperty("creator");
			expectTypeOf<Metadata>().toHaveProperty("timestamp");
		});

		it("creates object with nested tuple fields", () => {
			type InnerTuple = Parameter<"tuple", "inner"> & {
				components: readonly [Parameter<"uint256", "value">];
			};
			type OuterTuple = Parameter<"tuple", "config"> & {
				components: readonly [InnerTuple, Parameter<"bool", "enabled">];
			};
			type Params = readonly [Parameter<"address", "owner">, OuterTuple];
			type Result = ExtractObject<Params>;
			expectTypeOf<Result>().toHaveProperty("owner");
			expectTypeOf<Result>().toHaveProperty("config");
			type Config = Result extends { config: infer C } ? C : never;
			expectTypeOf<Config>().toHaveProperty("inner");
			expectTypeOf<Config>().toHaveProperty("enabled");
		});
	});
});

// ============================================================================
// Indexed Parameter Tests (for events)
// ============================================================================

describe("Indexed parameters", () => {
	it("preserves indexed flag in parameter type", () => {
		type EventParam = Parameter<"address", "from"> & { indexed: true };
		expectTypeOf<EventParam>().toHaveProperty("indexed");
		expectTypeOf<EventParam["indexed"]>().toEqualTypeOf<true>();
	});

	it("preserves non-indexed flag", () => {
		type EventParam = Parameter<"uint256", "amount"> & { indexed: false };
		expectTypeOf<EventParam["indexed"]>().toEqualTypeOf<false>();
	});

	it("handles optional indexed property", () => {
		type EventParam = Parameter<"address", "to">;
		expectTypeOf<EventParam["indexed"]>().toEqualTypeOf<boolean | undefined>();
	});

	it("maps indexed parameters to primitives correctly", () => {
		type IndexedParam = Parameter<"address", "from"> & { indexed: true };
		type Params = readonly [IndexedParam, Parameter<"uint256", "amount">];
		type Result = ExtractActual<Params>;
		expectTypeOf<Result[0]>().toEqualTypeOf<BrandedAddress>();
		expectTypeOf<Result[1]>().toEqualTypeOf<bigint>();
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Parameter edge cases", () => {
	describe("All uint variants", () => {
		it("maps uint8 to bigint", () => {
			type Params = readonly [Parameter<"uint8", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});

		it("maps uint16 to bigint", () => {
			type Params = readonly [Parameter<"uint16", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});

		it("maps uint32 to bigint", () => {
			type Params = readonly [Parameter<"uint32", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});

		it("maps uint64 to bigint", () => {
			type Params = readonly [Parameter<"uint64", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});

		it("maps uint128 to bigint", () => {
			type Params = readonly [Parameter<"uint128", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});

		it("maps uint256 to bigint", () => {
			type Params = readonly [Parameter<"uint256", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});

		it("maps plain uint to bigint", () => {
			type Params = readonly [Parameter<"uint", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});
	});

	describe("All int variants", () => {
		it("maps int8 to bigint", () => {
			type Params = readonly [Parameter<"int8", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});

		it("maps int16 to bigint", () => {
			type Params = readonly [Parameter<"int16", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});

		it("maps int128 to bigint", () => {
			type Params = readonly [Parameter<"int128", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});

		it("maps int256 to bigint", () => {
			type Params = readonly [Parameter<"int256", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});

		it("maps plain int to bigint", () => {
			type Params = readonly [Parameter<"int", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		});
	});

	describe("All bytesN variants", () => {
		it("maps bytes1 to Uint8Array", () => {
			type Params = readonly [Parameter<"bytes1", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toMatchTypeOf<Uint8Array>();
		});

		it("maps bytes4 to Uint8Array", () => {
			type Params = readonly [Parameter<"bytes4", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toMatchTypeOf<Uint8Array>();
		});

		it("maps bytes8 to Uint8Array", () => {
			type Params = readonly [Parameter<"bytes8", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toMatchTypeOf<Uint8Array>();
		});

		it("maps bytes16 to Uint8Array", () => {
			type Params = readonly [Parameter<"bytes16", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toMatchTypeOf<Uint8Array>();
		});

		it("maps bytes32 to Uint8Array", () => {
			type Params = readonly [Parameter<"bytes32", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toMatchTypeOf<Uint8Array>();
		});

		it("maps dynamic bytes to Uint8Array", () => {
			type Params = readonly [Parameter<"bytes", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toMatchTypeOf<Uint8Array>();
		});
	});

	describe("Empty and edge cases", () => {
		it("handles empty parameter array", () => {
			type Params = readonly [];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result>().toEqualTypeOf<readonly []>();
		});

		it("handles empty parameter object", () => {
			type Params = readonly [];
			type Result = ExtractObject<Params>;
			expectTypeOf<Result>().toEqualTypeOf<Record<never, never>>();
		});

		it("handles single parameter", () => {
			type Params = readonly [Parameter<"address", "addr">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<BrandedAddress>();
		});

		it("preserves readonly tuple type", () => {
			type Params = readonly [Parameter<"uint256", "x">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result>().toMatchTypeOf<readonly [bigint]>();
		});
	});

	describe("Internal type handling", () => {
		it("handles parameter with internalType", () => {
			type Params = readonly [Parameter<"address", "token", "contract IERC20">];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toEqualTypeOf<BrandedAddress>();
		});

		it("handles tuple with internal types", () => {
			type TupleParam = Parameter<"tuple", "data", "struct Data"> & {
				components: readonly [
					Parameter<"address", "owner", "address">,
					Parameter<"uint256", "balance", "uint256">,
				];
			};
			type Params = readonly [TupleParam];
			type Result = ExtractActual<Params>;
			expectTypeOf<Result[0]>().toHaveProperty("owner");
			expectTypeOf<Result[0]>().toHaveProperty("balance");
		});
	});
});

// ============================================================================
// Complex Real-World Scenarios
// ============================================================================

describe("Real-world parameter scenarios", () => {
	it("maps ERC20 transfer parameters", () => {
		type Params = readonly [
			Parameter<"address", "to">,
			Parameter<"uint256", "amount">,
		];
		type ResultArray = ExtractActual<Params>;
		type ResultObject = ExtractObject<Params>;
		expectTypeOf<ResultArray[0]>().toEqualTypeOf<BrandedAddress>();
		expectTypeOf<ResultArray[1]>().toEqualTypeOf<bigint>();
		expectTypeOf<ResultObject>().toHaveProperty("to");
		expectTypeOf<ResultObject>().toHaveProperty("amount");
	});

	it("maps ERC721 safeTransferFrom parameters", () => {
		type Params = readonly [
			Parameter<"address", "from">,
			Parameter<"address", "to">,
			Parameter<"uint256", "tokenId">,
			Parameter<"bytes", "data">,
		];
		type Result = ExtractActual<Params>;
		expectTypeOf<Result[0]>().toEqualTypeOf<BrandedAddress>();
		expectTypeOf<Result[1]>().toEqualTypeOf<BrandedAddress>();
		expectTypeOf<Result[2]>().toEqualTypeOf<bigint>();
		expectTypeOf<Result[3]>().toMatchTypeOf<Uint8Array>();
	});

	it("maps multi-sig transaction parameters", () => {
		type TxParam = Parameter<"tuple", "transaction"> & {
			components: readonly [
				Parameter<"address", "to">,
				Parameter<"uint256", "value">,
				Parameter<"bytes", "data">,
				Parameter<"uint256", "nonce">,
			];
		};
		type Params = readonly [TxParam, Parameter<"bytes[]", "signatures">];
		type Result = ExtractActual<Params>;
		expectTypeOf<Result[0]>().toHaveProperty("to");
		expectTypeOf<Result[0]>().toHaveProperty("value");
		expectTypeOf<Result[0]>().toHaveProperty("data");
		expectTypeOf<Result[0]>().toHaveProperty("nonce");
		type Sigs = Result[1] extends readonly (infer U)[] ? U : never;
		expectTypeOf<Sigs>().toMatchTypeOf<Uint8Array>();
	});

	it("maps DEX swap parameters", () => {
		type PathParam = Parameter<"tuple[]", "path"> & {
			components: readonly [
				Parameter<"address", "token">,
				Parameter<"uint24", "fee">,
			];
		};
		type Params = readonly [
			Parameter<"uint256", "amountIn">,
			Parameter<"uint256", "amountOutMin">,
			PathParam,
			Parameter<"address", "recipient">,
			Parameter<"uint256", "deadline">,
		];
		type Result = ExtractActual<Params>;
		expectTypeOf<Result[0]>().toEqualTypeOf<bigint>();
		expectTypeOf<Result[1]>().toEqualTypeOf<bigint>();
		type PathItem = Result[2] extends readonly (infer U)[] ? U : never;
		expectTypeOf<PathItem>().toHaveProperty("token");
		expectTypeOf<PathItem>().toHaveProperty("fee");
		expectTypeOf<Result[3]>().toEqualTypeOf<BrandedAddress>();
		expectTypeOf<Result[4]>().toEqualTypeOf<bigint>();
	});

	it("maps event log parameters with indexed", () => {
		type TransferEvent = readonly [
			Parameter<"address", "from"> & { indexed: true },
			Parameter<"address", "to"> & { indexed: true },
			Parameter<"uint256", "value">,
		];
		type ResultArray = ExtractActual<TransferEvent>;
		type ResultObject = ExtractObject<TransferEvent>;
		expectTypeOf<ResultArray[0]>().toEqualTypeOf<BrandedAddress>();
		expectTypeOf<ResultArray[1]>().toEqualTypeOf<BrandedAddress>();
		expectTypeOf<ResultArray[2]>().toEqualTypeOf<bigint>();
		expectTypeOf<ResultObject>().toHaveProperty("from");
		expectTypeOf<ResultObject>().toHaveProperty("to");
		expectTypeOf<ResultObject>().toHaveProperty("value");
	});
});
