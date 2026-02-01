/**
 * CallData Benchmarks - mitata format
 * Compares calldata parsing and manipulation operations
 */

import { bench, run } from "mitata";
import { encodeFunctionData as viemEncodeFunctionData } from "viem";
import * as CallData from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// ERC20 transfer calldata
const transferSelector = "0xa9059cbb";
const transferCalldata =
	"0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e30000000000000000000000000000000000000000000000000de0b6b3a7640000";

// ERC20 approve calldata
const approveCalldata =
	"0x095ea7b3000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// Complex calldata (Uniswap swap)
const swapCalldata =
	"0x38ed1739" + // swapExactTokensForTokens selector
	"0000000000000000000000000000000000000000000000000de0b6b3a7640000" + // amountIn
	"0000000000000000000000000000000000000000000000000000000000000001" + // amountOutMin
	"00000000000000000000000000000000000000000000000000000000000000a0" + // path offset
	"000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3" + // to
	"00000000000000000000000000000000000000000000000000000000deadbeef" + // deadline
	"0000000000000000000000000000000000000000000000000000000000000002" + // path length
	"000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" + // WETH
	"000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7"; // USDT

// Minimal calldata (just selector)
const minimalCalldata = "0xa9059cbb";

// Empty calldata
const emptyCalldata = "0x";

// Pre-create instances
const transferInstance = CallData.from(transferCalldata);
const approveInstance = CallData.from(approveCalldata);
const swapInstance = CallData.from(swapCalldata);
const minimalInstance = CallData.from(minimalCalldata);

// Selector bytes
const transferSelectorBytes = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);

// ============================================================================
// CallData.from - construction from hex
// ============================================================================

bench("CallData.from(hex) - transfer - voltaire", () => {
	CallData.from(transferCalldata);
});

bench("CallData.from(hex) - swap - voltaire", () => {
	CallData.from(swapCalldata);
});

bench("CallData.from(hex) - minimal - voltaire", () => {
	CallData.from(minimalCalldata);
});

await run();

// ============================================================================
// CallData.fromHex - explicit hex construction
// ============================================================================

bench("CallData.fromHex - transfer - voltaire", () => {
	CallData.fromHex(transferCalldata);
});

bench("CallData.fromHex - swap - voltaire", () => {
	CallData.fromHex(swapCalldata);
});

await run();

// ============================================================================
// CallData.fromBytes - construction from bytes
// ============================================================================

const transferBytes = transferInstance;
const swapBytes = swapInstance;

bench("CallData.fromBytes - transfer - voltaire", () => {
	CallData.fromBytes(transferBytes);
});

bench("CallData.fromBytes - swap - voltaire", () => {
	CallData.fromBytes(swapBytes);
});

await run();

// ============================================================================
// CallData.toHex
// ============================================================================

bench("CallData.toHex - transfer - voltaire", () => {
	CallData.toHex(transferInstance);
});

bench("CallData.toHex - swap - voltaire", () => {
	CallData.toHex(swapInstance);
});

await run();

// ============================================================================
// CallData.toBytes
// ============================================================================

bench("CallData.toBytes - transfer - voltaire", () => {
	CallData.toBytes(transferInstance);
});

bench("CallData.toBytes - swap - voltaire", () => {
	CallData.toBytes(swapInstance);
});

await run();

// ============================================================================
// CallData.getSelector
// ============================================================================

bench("CallData.getSelector - transfer - voltaire", () => {
	CallData.getSelector(transferInstance);
});

bench("CallData.getSelector - swap - voltaire", () => {
	CallData.getSelector(swapInstance);
});

await run();

// ============================================================================
// CallData.hasSelector
// ============================================================================

bench("CallData.hasSelector(hex) - match - voltaire", () => {
	CallData.hasSelector(transferInstance, transferSelector);
});

bench("CallData.hasSelector(hex) - no match - voltaire", () => {
	CallData.hasSelector(transferInstance, "0x095ea7b3");
});

bench("CallData.hasSelector(bytes) - match - voltaire", () => {
	CallData.hasSelector(transferInstance, transferSelectorBytes);
});

await run();

// ============================================================================
// CallData.equals
// ============================================================================

const transferInstance2 = CallData.from(transferCalldata);

bench("CallData.equals - same - voltaire", () => {
	CallData.equals(transferInstance, transferInstance2);
});

bench("CallData.equals - different - voltaire", () => {
	CallData.equals(transferInstance, approveInstance);
});

await run();

// ============================================================================
// CallData.is - type check
// ============================================================================

bench("CallData.is - valid - voltaire", () => {
	CallData.is(transferInstance);
});

bench("CallData.is - plain Uint8Array - voltaire", () => {
	CallData.is(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
});

await run();

// ============================================================================
// CallData.isValid - validation
// ============================================================================

bench("CallData.isValid - valid hex - voltaire", () => {
	CallData.isValid(transferCalldata);
});

bench("CallData.isValid - valid bytes - voltaire", () => {
	CallData.isValid(transferBytes);
});

bench("CallData.isValid - empty - voltaire", () => {
	CallData.isValid(emptyCalldata);
});

await run();

// ============================================================================
// CallData.encode - with signature
// ============================================================================

bench("CallData.encode - transfer - voltaire", () => {
	CallData.encode("transfer(address,uint256)", [
		"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		1000000000000000000n,
	]);
});

await run();

// ============================================================================
// Round-trip: from + toHex
// ============================================================================

bench("roundtrip (from+toHex) - transfer - voltaire", () => {
	const cd = CallData.from(transferCalldata);
	CallData.toHex(cd);
});

bench("roundtrip (from+toHex) - swap - voltaire", () => {
	const cd = CallData.from(swapCalldata);
	CallData.toHex(cd);
});

await run();

// ============================================================================
// Instance methods (prototype chain)
// ============================================================================

bench("instance.toHex() - transfer - voltaire", () => {
	const cd = CallData.CallData(transferCalldata);
	cd.toHex();
});

bench("instance.getSelector() - transfer - voltaire", () => {
	const cd = CallData.CallData(transferCalldata);
	cd.getSelector();
});

bench("instance.hasSelector() - transfer - voltaire", () => {
	const cd = CallData.CallData(transferCalldata);
	cd.hasSelector(transferSelector);
});

await run();
