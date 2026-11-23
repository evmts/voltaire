import { runBenchSuite } from "../bench-harness.js";
import { bytesToHex } from "./bytesToHex.js";
import { getTransactionType } from "./getTransactionType.js";
import { hexToBytes } from "./hexToBytes.js";
import { matchesFilter } from "./matchesFilter.js";

const sampleBytes = new Uint8Array(32).fill(0xab);
const sampleHex = `0x${"ab".repeat(32)}`;
const sampleTx = {
	hash: sampleBytes,
	from: new Uint8Array(20).fill(0x11),
	to: new Uint8Array(20).fill(0x22),
	value: 1_000_000_000_000_000_000n,
	nonce: 1n,
	gas: 21000n,
	type: 2,
	input: new Uint8Array(0),
} as never;
const filter = {
	from: new Uint8Array(20).fill(0x11),
	to: new Uint8Array(20).fill(0x22),
} as never;

await runBenchSuite("voltaire-ts:transaction-stream", [
	{ name: "hexToBytes (32B)", fn: () => hexToBytes(sampleHex) },
	{ name: "bytesToHex (32B)", fn: () => bytesToHex(sampleBytes) },
	{
		name: "getTransactionType (EIP-1559)",
		fn: () => getTransactionType("0x02"),
	},
	{ name: "matchesFilter", fn: () => matchesFilter(sampleTx, filter) },
]);
