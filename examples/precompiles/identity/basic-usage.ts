/**
 * Identity Precompile Basic Usage
 *
 * Address: 0x0000000000000000000000000000000000000004
 * Gas Cost: 15 + 3 * ceil(input_length / 32)
 *
 * Demonstrates:
 * - Data copying via identity precompile
 * - Gas cost analysis (cheapest per-word cost)
 * - Use cases: memory operations, gas metering, testing
 * - Output equals input (unchanged)
 */

import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";
const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

const words = Math.ceil(data.length / 32);
const gasNeeded = 15n + 3n * BigInt(words);

const result = execute(
	PrecompileAddress.IDENTITY,
	data,
	gasNeeded,
	Hardfork.CANCUN,
);

if (result.success) {
	// Verify output equals input
	const matches = result.output.every((byte, i) => byte === data[i]);
}
const empty = new Uint8Array(0);
const emptyGas = 15n; // Base cost only

const emptyResult = execute(
	PrecompileAddress.IDENTITY,
	empty,
	emptyGas,
	Hardfork.CANCUN,
);
const sizes = [0, 1, 32, 33, 64, 100, 1000, 10000];

for (const size of sizes) {
	const w = Math.ceil(size / 32);
	const gas = 15n + 3n * BigInt(w);
	const perByte = size > 0 ? Number(gas) / size : 0;
}
const largeData = new Uint8Array(1024);
crypto.getRandomValues(largeData);

const largeWords = Math.ceil(largeData.length / 32);
const largeGas = 15n + 3n * BigInt(largeWords);

const largeResult = execute(
	PrecompileAddress.IDENTITY,
	largeData,
	largeGas,
	Hardfork.CANCUN,
);

if (largeResult.success) {
	const matches = largeResult.output.every((byte, i) => byte === largeData[i]);
}
const testSize = 1000;
const testWords = Math.ceil(testSize / 32);

const identityGas = 15n + 3n * BigInt(testWords);
const sha256Gas = 60n + 12n * BigInt(testWords);
const ripemd160Gas = 600n + 120n * BigInt(testWords);
// Simulate forwarding calldata through a proxy
const calldata = new TextEncoder().encode("transfer(address,uint256)");

const forwardGas = 15n + 3n * BigInt(Math.ceil(calldata.length / 32));

const forwarded = execute(
	PrecompileAddress.IDENTITY,
	calldata,
	forwardGas,
	Hardfork.CANCUN,
);
const testData = new Uint8Array(100);
const insufficientGas = 10n; // Need 15 + 3*4 = 27

const oogResult = execute(
	PrecompileAddress.IDENTITY,
	testData,
	insufficientGas,
	Hardfork.CANCUN,
);
