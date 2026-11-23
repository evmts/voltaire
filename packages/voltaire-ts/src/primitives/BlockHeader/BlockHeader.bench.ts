import { runBenchSuite } from "../../bench-harness.js";
import * as BlockHeader from "./index.js";

const header = BlockHeader.from({
	parentHash: `0x${"11".repeat(32)}`,
	ommersHash: `0x${"22".repeat(32)}`,
	beneficiary: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
	stateRoot: `0x${"33".repeat(32)}`,
	transactionsRoot: `0x${"44".repeat(32)}`,
	receiptsRoot: `0x${"55".repeat(32)}`,
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 20_000_000n,
	gasLimit: 30_000_000n,
	gasUsed: 15_000_000n,
	timestamp: 1_700_000_000n,
	extraData: new Uint8Array(0),
	mixHash: `0x${"66".repeat(32)}`,
	nonce: new Uint8Array(8),
	baseFeePerGas: 10_000_000_000n,
});

await runBenchSuite("voltaire-ts:BlockHeader", [
	{
		name: "BlockHeader.from",
		fn: () =>
			BlockHeader.from({
				parentHash: header.parentHash,
				ommersHash: header.ommersHash,
				beneficiary: header.beneficiary,
				stateRoot: header.stateRoot,
				transactionsRoot: header.transactionsRoot,
				receiptsRoot: header.receiptsRoot,
				logsBloom: header.logsBloom,
				difficulty: 0n,
				number: 20_000_000n,
				gasLimit: 30_000_000n,
				gasUsed: 15_000_000n,
				timestamp: 1_700_000_000n,
				extraData: header.extraData,
				mixHash: header.mixHash,
				nonce: header.nonce,
				baseFeePerGas: 10_000_000_000n,
			}),
	},
	{
		name: "BlockHeader.calculateHash",
		fn: () => BlockHeader.calculateHash(header),
	},
]);
