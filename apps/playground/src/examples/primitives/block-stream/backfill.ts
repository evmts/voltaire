/**
 * BlockStream Backfill Example
 *
 * Demonstrates streaming historical blocks with dynamic chunking.
 */
import { BlockStream } from "../../../../src/block/index.js";

// Mock provider for demonstration
const mockProvider = {
	request: async ({
		method,
		params,
	}: { method: string; params: unknown[] }) => {
		if (method === "eth_blockNumber") {
			return "0x1000000"; // Block 16,777,216
		}
		if (method === "eth_getBlockByNumber") {
			const blockNum = Number.parseInt(params[0] as string, 16);
			return {
				hash: `0x${"a".repeat(62)}${blockNum.toString(16).padStart(2, "0")}`,
				header: {
					number: BigInt(blockNum),
					parentHash: `0x${"a".repeat(62)}${(blockNum - 1).toString(16).padStart(2, "0")}`,
					timestamp: BigInt(1700000000 + blockNum * 12),
					beneficiary: `0x${"b".repeat(40)}`,
					stateRoot: `0x${"c".repeat(64)}`,
					transactionsRoot: `0x${"d".repeat(64)}`,
					receiptsRoot: `0x${"e".repeat(64)}`,
					logsBloom: new Uint8Array(256),
					difficulty: 0n,
					gasLimit: 30000000n,
					gasUsed: 1000000n,
					extraData: new Uint8Array(0),
					mixHash: `0x${"f".repeat(64)}`,
					nonce: new Uint8Array(8),
					ommersHash: `0x${"0".repeat(64)}`,
				},
				body: {
					transactions: [`0x${"1".repeat(64)}`],
					ommers: [],
				},
				size: 1000n,
			};
		}
		throw new Error(`Unhandled method: ${method}`);
	},
	on: () => mockProvider,
	removeListener: () => mockProvider,
};

async function main() {
	const stream = BlockStream({ provider: mockProvider });

	let blockCount = 0;
	for await (const event of stream.backfill({
		fromBlock: 100n,
		toBlock: 105n,
		include: "header",
	})) {
		if (event.type === "blocks") {
			for (const block of event.blocks) {
				blockCount++;
			}
		}
	}
}

main().catch(console.error);
