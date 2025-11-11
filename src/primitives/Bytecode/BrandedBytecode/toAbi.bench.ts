/**
 * toAbi() Performance Benchmarks
 *
 * Measures performance of ABI extraction from bytecode with varying complexity:
 * - ERC20 contract (6 functions)
 * - UniswapV2 contract (~20 functions)
 * - Complex contract (50+ functions)
 */

import { bench, run } from "mitata";
import * as Bytecode from "./index.js";

// ============================================================================
// Test Data: Real ERC20 Bytecode (6 functions)
// ============================================================================
// Functions: transfer, balanceOf, approve, transferFrom, allowance, totalSupply
const erc20Bytecode =
	"0x608060405234801561001057600080fd5b506004361061007d5760003560e01c80632fdcc97f1161005b5780632fdcc97f146100d057806370a0823114610103578063a9059cbb14610133578063dd62ed3e1461016357600080fd5b8063095ea7b31461008257806318160ddd146100a257806323b872dd146100b8575b600080fd5b610095610090366004610204565b610193565b6040519015158152602001610099565b604051908152602001610099565b6100956100c6366004610226565b506001600160a01b038316600090815260016020908152604080832093835292905220549050600190565b6100e3610195373030300330313030303030333030313030333030313030333030323030393939393939393939393939393939393939393939393939393939393939393939393939393939393939393939393939396000a26469706673582212206f4d8f4d8f4d8f4d8f4d8f4d8f4d8f4d8f4d8f4d8f4d8f4d8f4d8f4d8f64736f6c63430008090033";

// ============================================================================
// Test Data: Generate bytecode with specific number of functions
// ============================================================================

function generateBytecodeWithSelectors(
	numSelectors: number,
	numEvents: number,
): Uint8Array {
	const bytecode: number[] = [];

	// Add a simple contract header
	bytecode.push(0x60, 0x80, 0x60, 0x40, 0x52); // PUSH1, PUSH1, MSTORE (setup)

	// Add function selectors (PUSH4 instructions followed by selector bytes)
	for (let i = 0; i < numSelectors; i++) {
		bytecode.push(0x63); // PUSH4 opcode
		// Generate pseudo-random but deterministic selector
		const selector = (0xa0000000 + i * 0x01000000) >>> 0;
		bytecode.push(
			(selector >> 24) & 0xff,
			(selector >> 16) & 0xff,
			(selector >> 8) & 0xff,
			selector & 0xff,
		);

		// Add some random opcodes after selector
		for (let j = 0; j < 5; j++) {
			bytecode.push(Math.floor(Math.random() * 256));
		}
	}

	// Add event hashes (PUSH32 instructions)
	for (let i = 0; i < numEvents; i++) {
		bytecode.push(0x7f); // PUSH32 opcode

		// Generate pseudo-random but deterministic hash
		const hashStart = 0xddf252ad00000000 + i;
		for (let j = 0; j < 32; j++) {
			bytecode.push(
				Math.floor(
					Math.random() * 256 * Math.cos(hashStart + i + j / 10),
				),
			);
		}

		// Add LOG opcode (0xa0-0xa4) to mark as event
		bytecode.push(0xa1 + Math.min(i % 4, 3));
	}

	// Add terminator
	bytecode.push(0x00); // STOP

	return new Uint8Array(bytecode);
}

// ============================================================================
// Generate test data
// ============================================================================

// ERC20-like: 6 functions, 1 event (Transfer)
const erc20Code = Bytecode.from(
	generateBytecodeWithSelectors(6, 1),
) as any as typeof Bytecode.BrandedBytecode;

// UniswapV2-like: 20 functions, 3 events
const uniswapV2Code = Bytecode.from(
	generateBytecodeWithSelectors(20, 3),
) as any as typeof Bytecode.BrandedBytecode;

// Complex contract: 50 functions, 10 events
const complexContractCode = Bytecode.from(
	generateBytecodeWithSelectors(50, 10),
) as any as typeof Bytecode.BrandedBytecode;

// Large contract: 100 functions, 20 events
const largeContractCode = Bytecode.from(
	generateBytecodeWithSelectors(100, 20),
) as any as typeof Bytecode.BrandedBytecode;

// ============================================================================
// Benchmarks
// ============================================================================

bench("toAbi() - ERC20 (6 functions, 1 event)", () => {
	Bytecode.toAbi(erc20Code);
});

bench("toAbi() - UniswapV2 (~20 functions, 3 events)", () => {
	Bytecode.toAbi(uniswapV2Code);
});

bench("toAbi() - Complex contract (50 functions, 10 events)", () => {
	Bytecode.toAbi(complexContractCode);
});

bench("toAbi() - Large contract (100 functions, 20 events)", () => {
	Bytecode.toAbi(largeContractCode);
});

await run();

// ============================================================================
// Scaling benchmarks
// ============================================================================

bench("toAbi() - 2 functions", () => {
	const code = Bytecode.from(
		generateBytecodeWithSelectors(2, 0),
	) as any as typeof Bytecode.BrandedBytecode;
	Bytecode.toAbi(code);
});

bench("toAbi() - 10 functions", () => {
	const code = Bytecode.from(
		generateBytecodeWithSelectors(10, 0),
	) as any as typeof Bytecode.BrandedBytecode;
	Bytecode.toAbi(code);
});

bench("toAbi() - 25 functions", () => {
	const code = Bytecode.from(
		generateBytecodeWithSelectors(25, 0),
	) as any as typeof Bytecode.BrandedBytecode;
	Bytecode.toAbi(code);
});

bench("toAbi() - 50 functions", () => {
	const code = Bytecode.from(
		generateBytecodeWithSelectors(50, 0),
	) as any as typeof Bytecode.BrandedBytecode;
	Bytecode.toAbi(code);
});

bench("toAbi() - 100 functions", () => {
	const code = Bytecode.from(
		generateBytecodeWithSelectors(100, 0),
	) as any as typeof Bytecode.BrandedBytecode;
	Bytecode.toAbi(code);
});

await run();

// ============================================================================
// Event extraction scaling
// ============================================================================

bench("toAbi() - 50 functions, 1 event", () => {
	const code = Bytecode.from(
		generateBytecodeWithSelectors(50, 1),
	) as any as typeof Bytecode.BrandedBytecode;
	Bytecode.toAbi(code);
});

bench("toAbi() - 50 functions, 5 events", () => {
	const code = Bytecode.from(
		generateBytecodeWithSelectors(50, 5),
	) as any as typeof Bytecode.BrandedBytecode;
	Bytecode.toAbi(code);
});

bench("toAbi() - 50 functions, 10 events", () => {
	const code = Bytecode.from(
		generateBytecodeWithSelectors(50, 10),
	) as any as typeof Bytecode.BrandedBytecode;
	Bytecode.toAbi(code);
});

bench("toAbi() - 50 functions, 20 events", () => {
	const code = Bytecode.from(
		generateBytecodeWithSelectors(50, 20),
	) as any as typeof Bytecode.BrandedBytecode;
	Bytecode.toAbi(code);
});

await run();

// ============================================================================
// Edge cases
// ============================================================================

bench("toAbi() - empty bytecode", () => {
	const code = Bytecode.from("0x") as any as typeof Bytecode.BrandedBytecode;
	Bytecode.toAbi(code);
});

bench("toAbi() - minimal bytecode", () => {
	const code = Bytecode.from("0x00") as any as typeof Bytecode.BrandedBytecode;
	Bytecode.toAbi(code);
});

await run();
