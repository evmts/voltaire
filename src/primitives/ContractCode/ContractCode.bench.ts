/**
 * ContractCode Benchmarks - mitata format
 * Combined init + runtime code operations
 */

import { bench, run } from "mitata";
import * as ContractCode from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Simple deployed contract bytecode
const simpleCode =
	"0x6080604052600080fd00a264697066735822122012345678901234567890123456789012345678901234567890123456789012345678901234564736f6c63430008110033";

// Medium contract (simple storage)
const mediumCode =
	"0x6080604052348015600f57600080fd5b506004361060325760003560e01c80632e64cec11460375780636057361d14604f575b600080fd5b603d606b565b60405160489190607d565b60405180910390f35b6069600480360381019060659190608a565b6074565b005b60008054905090565b8060008190555050565b60828184609a565b92915050565b60006020828403121560a057600080fd5b600060ac8482850160af565b91505092915050565b600081359050609c8160c1565b92915050565b6000819050919050565b600060208284031215609557600080fd5b600060a1848285016098565b91505092915050565b609a8160a2565b8114609f57600080fd5ba264697066735822122012345678901234567890123456789012345678901234567890123456789012345678901234564736f6c63430008110033";

// Large contract (ERC20-like, ~5KB)
const largeCode =
	"0x6080604052" +
	"60".repeat(2500) +
	"a264697066735822122012345678901234567890123456789012345678901234567890123456789012345678901234564736f6c63430008110033";

// Code with Solidity metadata
const codeWithMetadata =
	"0x608060405234801561001057600080fd5ba264697066735822122012345678901234567890123456789012345678901234567890123456789012345678901234564736f6c63430008110033";

// Code without metadata
const codeWithoutMetadata = "0x608060405234801561001057600080fd5b00";

// Bytes versions
const simpleBytes = new Uint8Array([
	0x60, 0x80, 0x60, 0x40, 0x52, 0x60, 0x00, 0x80, 0xfd, 0x00,
]);

// Pre-created instances
const simpleInstance = ContractCode.from(simpleCode);
const mediumInstance = ContractCode.from(mediumCode);
const largeInstance = ContractCode.from(largeCode);
const withMetadataInstance = ContractCode.from(codeWithMetadata);
const withoutMetadataInstance = ContractCode.from(codeWithoutMetadata);

// ============================================================================
// ContractCode.from - construction
// ============================================================================

bench("ContractCode.from(hex) - simple - voltaire", () => {
	ContractCode.from(simpleCode);
});

bench("ContractCode.from(hex) - medium - voltaire", () => {
	ContractCode.from(mediumCode);
});

bench("ContractCode.from(hex) - large (5KB) - voltaire", () => {
	ContractCode.from(largeCode);
});

await run();

// ============================================================================
// ContractCode.fromHex
// ============================================================================

bench("ContractCode.fromHex - simple - voltaire", () => {
	ContractCode.fromHex(simpleCode);
});

bench("ContractCode.fromHex - medium - voltaire", () => {
	ContractCode.fromHex(mediumCode);
});

await run();

// ============================================================================
// ContractCode.toHex
// ============================================================================

bench("ContractCode.toHex - simple - voltaire", () => {
	ContractCode.toHex(simpleInstance);
});

bench("ContractCode.toHex - medium - voltaire", () => {
	ContractCode.toHex(mediumInstance);
});

bench("ContractCode.toHex - large - voltaire", () => {
	ContractCode.toHex(largeInstance);
});

await run();

// ============================================================================
// ContractCode.equals
// ============================================================================

const simpleInstance2 = ContractCode.from(simpleCode);

bench("ContractCode.equals - same - voltaire", () => {
	ContractCode.equals(simpleInstance, simpleInstance2);
});

bench("ContractCode.equals - different - voltaire", () => {
	ContractCode.equals(simpleInstance, mediumInstance);
});

await run();

// ============================================================================
// ContractCode.hasMetadata
// ============================================================================

bench("ContractCode.hasMetadata - with metadata - voltaire", () => {
	ContractCode.hasMetadata(withMetadataInstance);
});

bench("ContractCode.hasMetadata - without metadata - voltaire", () => {
	ContractCode.hasMetadata(withoutMetadataInstance);
});

bench("ContractCode.hasMetadata - simple - voltaire", () => {
	ContractCode.hasMetadata(simpleInstance);
});

bench("ContractCode.hasMetadata - large - voltaire", () => {
	ContractCode.hasMetadata(largeInstance);
});

await run();

// ============================================================================
// ContractCode.stripMetadata
// ============================================================================

bench("ContractCode.stripMetadata - with metadata - voltaire", () => {
	ContractCode.stripMetadata(withMetadataInstance);
});

bench("ContractCode.stripMetadata - without metadata - voltaire", () => {
	ContractCode.stripMetadata(withoutMetadataInstance);
});

bench("ContractCode.stripMetadata - large - voltaire", () => {
	ContractCode.stripMetadata(largeInstance);
});

await run();

// ============================================================================
// ContractCode.extractRuntime
// ============================================================================

bench("ContractCode.extractRuntime - simple - voltaire", () => {
	ContractCode.extractRuntime(simpleInstance);
});

bench("ContractCode.extractRuntime - medium - voltaire", () => {
	ContractCode.extractRuntime(mediumInstance);
});

bench("ContractCode.extractRuntime - large - voltaire", () => {
	ContractCode.extractRuntime(largeInstance);
});

await run();

// ============================================================================
// Round-trip operations
// ============================================================================

bench("roundtrip (from+toHex) - simple - voltaire", () => {
	const cc = ContractCode.from(simpleCode);
	ContractCode.toHex(cc);
});

bench("roundtrip (from+toHex) - medium - voltaire", () => {
	const cc = ContractCode.from(mediumCode);
	ContractCode.toHex(cc);
});

bench("roundtrip (from+toHex) - large - voltaire", () => {
	const cc = ContractCode.from(largeCode);
	ContractCode.toHex(cc);
});

await run();

// ============================================================================
// Full analysis workflow
// ============================================================================

bench("full analysis - simple - voltaire", () => {
	const cc = ContractCode.from(simpleCode);
	ContractCode.hasMetadata(cc);
	ContractCode.stripMetadata(cc);
	ContractCode.toHex(cc);
});

bench("full analysis - with metadata - voltaire", () => {
	const cc = ContractCode.from(codeWithMetadata);
	ContractCode.hasMetadata(cc);
	ContractCode.stripMetadata(cc);
	ContractCode.extractRuntime(cc);
	ContractCode.toHex(cc);
});

await run();
