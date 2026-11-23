import { runBenchSuite } from "../../bench-harness.js";
import * as Uncle from "./index.js";

const like = {
	parentHash: `0x${"11".repeat(32)}`,
	ommersHash: `0x${"22".repeat(32)}`,
	beneficiary: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
	stateRoot: `0x${"33".repeat(32)}`,
	transactionsRoot: `0x${"44".repeat(32)}`,
	receiptsRoot: `0x${"55".repeat(32)}`,
	logsBloom: new Uint8Array(256),
	difficulty: 1000n,
	number: 1000n,
	gasLimit: 8_000_000n,
	gasUsed: 4_000_000n,
	timestamp: 1_600_000_000n,
	extraData: new Uint8Array(0),
	mixHash: `0x${"66".repeat(32)}`,
	nonce: new Uint8Array(8),
} as never;

await runBenchSuite("voltaire-ts:Uncle", [
	{ name: "Uncle.from", fn: () => Uncle.from(like) },
]);
