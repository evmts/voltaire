/**
 * Type-level tests for Contract module
 *
 * Tests that Contract properly infers types from ABI definitions.
 * Validates read/write/estimateGas/events typing and type unwrapping.
 */

import { describe, expectTypeOf, it } from "vitest";
import type { AddressType } from "../primitives/Address/AddressType.js";
import type { TransactionHashType } from "../primitives/TransactionHash/TransactionHashType.js";
import type { BlockNumberType } from "../primitives/BlockNumber/BlockNumberType.js";
import type { HashType } from "../primitives/Hash/HashType.js";
import type { Abi } from "../primitives/Abi/AbiConstructor.js";
import type {
	ContractInstance,
	ContractReadMethods,
	ContractWriteMethods,
	ContractEstimateGasMethods,
	ContractEventFilters,
	DecodedEventLog,
	ExtractReadFunctions,
	ExtractWriteFunctions,
	ExtractEvents,
} from "./ContractType.js";
import { Contract } from "./Contract.js";

// ============================================================================
// Test ABI Definition
// ============================================================================

const testAbi = [
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ type: "address", name: "account" }],
		outputs: [{ type: "uint256", name: "" }],
	},
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [
			{ type: "address", name: "to" },
			{ type: "uint256", name: "amount" },
		],
		outputs: [{ type: "bool", name: "" }],
	},
	{
		type: "function",
		name: "approve",
		stateMutability: "nonpayable",
		inputs: [
			{ type: "address", name: "spender" },
			{ type: "uint256", name: "amount" },
		],
		outputs: [{ type: "bool", name: "" }],
	},
	{
		type: "function",
		name: "symbol",
		stateMutability: "pure",
		inputs: [],
		outputs: [{ type: "string", name: "" }],
	},
	{
		type: "function",
		name: "getReserves",
		stateMutability: "view",
		inputs: [],
		outputs: [
			{ type: "uint112", name: "reserve0" },
			{ type: "uint112", name: "reserve1" },
			{ type: "uint32", name: "blockTimestampLast" },
		],
	},
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ type: "address", name: "from", indexed: true },
			{ type: "address", name: "to", indexed: true },
			{ type: "uint256", name: "value", indexed: false },
		],
	},
	{
		type: "event",
		name: "Approval",
		inputs: [
			{ type: "address", name: "owner", indexed: true },
			{ type: "address", name: "spender", indexed: true },
			{ type: "uint256", name: "value", indexed: false },
		],
	},
] as const;

type TestAbi = typeof testAbi;

// ============================================================================
// Contract Instance Type Tests
// ============================================================================

describe("ContractInstance", () => {
	describe("Basic properties", () => {
		it("has address property typed as AddressType", () => {
			type Instance = ContractInstance<TestAbi>;
			expectTypeOf<Instance["address"]>().toEqualTypeOf<AddressType>();
		});

		it("has abi property typed as Abi<TAbi>", () => {
			type Instance = ContractInstance<TestAbi>;
			expectTypeOf<Instance["abi"]>().toEqualTypeOf<Abi<TestAbi>>();
		});

		it("has read property", () => {
			type Instance = ContractInstance<TestAbi>;
			expectTypeOf<Instance>().toHaveProperty("read");
		});

		it("has write property", () => {
			type Instance = ContractInstance<TestAbi>;
			expectTypeOf<Instance>().toHaveProperty("write");
		});

		it("has estimateGas property", () => {
			type Instance = ContractInstance<TestAbi>;
			expectTypeOf<Instance>().toHaveProperty("estimateGas");
		});

		it("has events property", () => {
			type Instance = ContractInstance<TestAbi>;
			expectTypeOf<Instance>().toHaveProperty("events");
		});
	});
});

// ============================================================================
// Read Method Type Tests
// ============================================================================

describe("ContractReadMethods", () => {
	describe("View function extraction", () => {
		it("includes view functions", () => {
			type ReadMethods = ContractReadMethods<TestAbi>;
			expectTypeOf<ReadMethods>().toHaveProperty("balanceOf");
		});

		it("includes pure functions", () => {
			type ReadMethods = ContractReadMethods<TestAbi>;
			expectTypeOf<ReadMethods>().toHaveProperty("symbol");
		});

		it("excludes nonpayable functions", () => {
			type ReadMethods = ContractReadMethods<TestAbi>;
			// transfer is nonpayable, should NOT be in read
			expectTypeOf<ReadMethods>().not.toHaveProperty("transfer");
		});
	});

	describe("Argument types", () => {
		it("balanceOf accepts AddressType argument", () => {
			type ReadMethods = ContractReadMethods<TestAbi>;
			type BalanceOf = ReadMethods["balanceOf"];
			// Should accept a single address argument
			type Args = Parameters<BalanceOf>;
			expectTypeOf<Args[0]>().toEqualTypeOf<AddressType>();
		});

		it("symbol accepts no arguments", () => {
			type ReadMethods = ContractReadMethods<TestAbi>;
			type Symbol = ReadMethods["symbol"];
			type Args = Parameters<Symbol>;
			expectTypeOf<Args>().toEqualTypeOf<[]>();
		});
	});

	describe("Return types", () => {
		it("single output unwraps to value type", () => {
			type ReadMethods = ContractReadMethods<TestAbi>;
			type BalanceOf = ReadMethods["balanceOf"];
			// Should return bigint, not [bigint]
			type Return = Awaited<ReturnType<BalanceOf>>;
			expectTypeOf<Return>().toEqualTypeOf<bigint>();
		});

		it("string output unwraps to string", () => {
			type ReadMethods = ContractReadMethods<TestAbi>;
			type Symbol = ReadMethods["symbol"];
			type Return = Awaited<ReturnType<Symbol>>;
			expectTypeOf<Return>().toEqualTypeOf<string>();
		});

		it("multiple outputs return tuple", () => {
			type ReadMethods = ContractReadMethods<TestAbi>;
			type GetReserves = ReadMethods["getReserves"];
			type Return = Awaited<ReturnType<GetReserves>>;
			// Should return tuple [bigint, bigint, bigint]
			expectTypeOf<Return>().toMatchTypeOf<readonly [bigint, bigint, bigint]>();
		});
	});
});

// ============================================================================
// Write Method Type Tests
// ============================================================================

describe("ContractWriteMethods", () => {
	describe("Write function extraction", () => {
		it("includes nonpayable functions", () => {
			type WriteMethods = ContractWriteMethods<TestAbi>;
			expectTypeOf<WriteMethods>().toHaveProperty("transfer");
			expectTypeOf<WriteMethods>().toHaveProperty("approve");
		});

		it("excludes view functions", () => {
			type WriteMethods = ContractWriteMethods<TestAbi>;
			expectTypeOf<WriteMethods>().not.toHaveProperty("balanceOf");
		});

		it("excludes pure functions", () => {
			type WriteMethods = ContractWriteMethods<TestAbi>;
			expectTypeOf<WriteMethods>().not.toHaveProperty("symbol");
		});
	});

	describe("Argument types", () => {
		it("transfer accepts (AddressType, bigint)", () => {
			type WriteMethods = ContractWriteMethods<TestAbi>;
			type Transfer = WriteMethods["transfer"];
			type Args = Parameters<Transfer>;
			expectTypeOf<Args[0]>().toEqualTypeOf<AddressType>();
			expectTypeOf<Args[1]>().toEqualTypeOf<bigint>();
		});

		it("approve accepts (AddressType, bigint)", () => {
			type WriteMethods = ContractWriteMethods<TestAbi>;
			type Approve = WriteMethods["approve"];
			type Args = Parameters<Approve>;
			expectTypeOf<Args[0]>().toEqualTypeOf<AddressType>();
			expectTypeOf<Args[1]>().toEqualTypeOf<bigint>();
		});
	});

	describe("Return types", () => {
		it("returns Promise<TransactionHashType>", () => {
			type WriteMethods = ContractWriteMethods<TestAbi>;
			type Transfer = WriteMethods["transfer"];
			type Return = Awaited<ReturnType<Transfer>>;
			expectTypeOf<Return>().toEqualTypeOf<TransactionHashType>();
		});
	});
});

// ============================================================================
// EstimateGas Method Type Tests
// ============================================================================

describe("ContractEstimateGasMethods", () => {
	describe("Function extraction", () => {
		it("includes write functions", () => {
			type GasMethods = ContractEstimateGasMethods<TestAbi>;
			expectTypeOf<GasMethods>().toHaveProperty("transfer");
			expectTypeOf<GasMethods>().toHaveProperty("approve");
		});

		it("excludes view functions", () => {
			type GasMethods = ContractEstimateGasMethods<TestAbi>;
			expectTypeOf<GasMethods>().not.toHaveProperty("balanceOf");
		});
	});

	describe("Argument types match write methods", () => {
		it("transfer accepts same args as write.transfer", () => {
			type GasMethods = ContractEstimateGasMethods<TestAbi>;
			type WriteMethods = ContractWriteMethods<TestAbi>;
			type GasArgs = Parameters<GasMethods["transfer"]>;
			type WriteArgs = Parameters<WriteMethods["transfer"]>;
			expectTypeOf<GasArgs>().toEqualTypeOf<WriteArgs>();
		});
	});

	describe("Return types", () => {
		it("returns Promise<bigint>", () => {
			type GasMethods = ContractEstimateGasMethods<TestAbi>;
			type Transfer = GasMethods["transfer"];
			type Return = Awaited<ReturnType<Transfer>>;
			expectTypeOf<Return>().toEqualTypeOf<bigint>();
		});
	});
});

// ============================================================================
// Event Filter Type Tests
// ============================================================================

describe("ContractEventFilters", () => {
	describe("Event extraction", () => {
		it("includes events by name", () => {
			type EventFilters = ContractEventFilters<TestAbi>;
			expectTypeOf<EventFilters>().toHaveProperty("Transfer");
			expectTypeOf<EventFilters>().toHaveProperty("Approval");
		});
	});

	describe("Filter argument types", () => {
		it("Transfer filter accepts partial indexed args", () => {
			type EventFilters = ContractEventFilters<TestAbi>;
			type TransferFilter = EventFilters["Transfer"];
			type FilterArgs = Parameters<TransferFilter>[0];
			// Filter should be optional and accept Partial<{from, to}>
			expectTypeOf<FilterArgs>().toMatchTypeOf<
				| Partial<{ from: AddressType; to: AddressType; value: bigint }>
				| undefined
			>();
		});
	});

	describe("Return types", () => {
		it("returns AsyncGenerator of DecodedEventLog", () => {
			type EventFilters = ContractEventFilters<TestAbi>;
			type TransferFilter = EventFilters["Transfer"];
			type ReturnGen = ReturnType<TransferFilter>;
			// Verify it's an async generator
			expectTypeOf<ReturnGen>().toMatchTypeOf<
				AsyncGenerator<unknown, unknown, unknown>
			>();
		});
	});
});

// ============================================================================
// DecodedEventLog Type Tests
// ============================================================================

describe("DecodedEventLog", () => {
	// Extract Transfer event type
	type TransferEvent = Extract<TestAbi[number], { name: "Transfer" }>;

	it("has eventName property", () => {
		type Log = DecodedEventLog<TransferEvent>;
		expectTypeOf<Log["eventName"]>().toEqualTypeOf<"Transfer">();
	});

	it("has typed args property", () => {
		type Log = DecodedEventLog<TransferEvent>;
		expectTypeOf<Log["args"]>().toHaveProperty("from");
		expectTypeOf<Log["args"]>().toHaveProperty("to");
		expectTypeOf<Log["args"]>().toHaveProperty("value");
		type From = Log["args"]["from"];
		type To = Log["args"]["to"];
		type Value = Log["args"]["value"];
		expectTypeOf<From>().toEqualTypeOf<AddressType>();
		expectTypeOf<To>().toEqualTypeOf<AddressType>();
		expectTypeOf<Value>().toEqualTypeOf<bigint>();
	});

	it("has blockNumber property", () => {
		type Log = DecodedEventLog<TransferEvent>;
		expectTypeOf<Log["blockNumber"]>().toEqualTypeOf<BlockNumberType>();
	});

	it("has blockHash property", () => {
		type Log = DecodedEventLog<TransferEvent>;
		expectTypeOf<Log["blockHash"]>().toEqualTypeOf<HashType>();
	});

	it("has transactionHash property", () => {
		type Log = DecodedEventLog<TransferEvent>;
		expectTypeOf<Log["transactionHash"]>().toEqualTypeOf<TransactionHashType>();
	});

	it("has logIndex property", () => {
		type Log = DecodedEventLog<TransferEvent>;
		expectTypeOf<Log["logIndex"]>().toEqualTypeOf<number>();
	});
});

// ============================================================================
// Helper Type Tests
// ============================================================================

describe("ExtractReadFunctions", () => {
	it("extracts view/pure functions from ABI", () => {
		type ReadFns = ExtractReadFunctions<TestAbi>;
		// Should include balanceOf (view) and symbol (pure)
		type Names = ReadFns["name"];
		expectTypeOf<Names>().toMatchTypeOf<"balanceOf" | "symbol" | "getReserves">();
	});
});

describe("ExtractWriteFunctions", () => {
	it("extracts nonpayable/payable functions from ABI", () => {
		type WriteFns = ExtractWriteFunctions<TestAbi>;
		type Names = WriteFns["name"];
		expectTypeOf<Names>().toMatchTypeOf<"transfer" | "approve">();
	});
});

describe("ExtractEvents", () => {
	it("extracts events from ABI", () => {
		type Events = ExtractEvents<TestAbi>;
		type Names = Events["name"];
		expectTypeOf<Names>().toMatchTypeOf<"Transfer" | "Approval">();
	});
});

// ============================================================================
// Complex ABI Scenarios
// ============================================================================

describe("Complex ABI scenarios", () => {
	const complexAbi = [
		{
			type: "function",
			name: "multicall",
			stateMutability: "payable",
			inputs: [{ type: "bytes[]", name: "data" }],
			outputs: [{ type: "bytes[]", name: "results" }],
		},
		{
			type: "function",
			name: "getPosition",
			stateMutability: "view",
			inputs: [{ type: "bytes32", name: "key" }],
			outputs: [
				{
					type: "tuple",
					name: "position",
					components: [
						{ type: "uint128", name: "liquidity" },
						{ type: "uint256", name: "feeGrowthInside0LastX128" },
						{ type: "uint256", name: "feeGrowthInside1LastX128" },
						{ type: "uint128", name: "tokensOwed0" },
						{ type: "uint128", name: "tokensOwed1" },
					],
				},
			],
		},
	] as const;

	type ComplexAbi = typeof complexAbi;

	it("handles bytes[] input and output", () => {
		type ReadMethods = ContractWriteMethods<ComplexAbi>;
		type Multicall = ReadMethods["multicall"];
		type Args = Parameters<Multicall>;
		// bytes[] should map to Uint8Array[]
		expectTypeOf<Args[0]>().toMatchTypeOf<readonly Uint8Array[]>();
	});

	it("handles tuple output", () => {
		type ReadMethods = ContractReadMethods<ComplexAbi>;
		type GetPosition = ReadMethods["getPosition"];
		type Return = Awaited<ReturnType<GetPosition>>;
		// Should return the tuple unwrapped (single output)
		expectTypeOf<Return>().toHaveProperty("liquidity");
		expectTypeOf<Return>().toHaveProperty("feeGrowthInside0LastX128");
		expectTypeOf<Return>().toHaveProperty("tokensOwed0");
	});
});
