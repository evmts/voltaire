import { runBenchSuite } from "../bench-harness.js";
import { isBlockRangeTooLargeError } from "./isBlockRangeTooLargeError.js";
import { toLightBlock } from "./toLightBlock.js";

const fullBlock = {
	header: {
		parentHash: new Uint8Array(32),
		ommersHash: new Uint8Array(32),
		beneficiary: new Uint8Array(20),
		stateRoot: new Uint8Array(32),
		transactionsRoot: new Uint8Array(32),
		receiptsRoot: new Uint8Array(32),
		logsBloom: new Uint8Array(256),
		difficulty: 0n,
		number: 20_000_000n,
		gasLimit: 30_000_000n,
		gasUsed: 15_000_000n,
		timestamp: 1_700_000_000n,
		extraData: new Uint8Array(0),
		mixHash: new Uint8Array(32),
		nonce: new Uint8Array(8),
		baseFeePerGas: 10_000_000_000n,
	},
	hash: new Uint8Array(32).fill(0xaa),
	size: 50_000n,
	body: { transactions: [], ommers: [], withdrawals: [] },
} as never;

const rangeErr = {
	code: -32005,
	message: "query returned more than 10000 results",
};

await runBenchSuite("voltaire-ts:block", [
	{ name: "toLightBlock", fn: () => toLightBlock(fullBlock) },
	{
		name: "isBlockRangeTooLargeError",
		fn: () => isBlockRangeTooLargeError(rangeErr),
	},
]);
