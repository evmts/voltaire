/**
 * BlockStream Watch with Reorg Handling Example
 *
 * Demonstrates watching for new blocks and handling chain reorganizations.
 */
import { BlockStream, BlockStreamAbortedError } from "../../../../src/block/index.js";

// Simulated chain state for demonstration
let currentBlock = 100;
let reorgTriggered = false;

const mockProvider = {
	request: async ({ method, params }: { method: string; params: unknown[] }) => {
		if (method === "eth_blockNumber") {
			// Simulate reorg: block number goes back
			if (currentBlock >= 103 && !reorgTriggered) {
				reorgTriggered = true;
				currentBlock = 102; // Reorg back to 102
			} else {
				currentBlock++;
			}
			return `0x${currentBlock.toString(16)}`;
		}
		if (method === "eth_getBlockByNumber") {
			const blockNum = Number.parseInt(params[0] as string, 16);
			// After reorg, return different hash for same block number
			const hashSuffix = reorgTriggered && blockNum >= 102 ? "b" : "a";
			return {
				hash: `0x${hashSuffix.repeat(62)}${blockNum.toString(16).padStart(2, "0")}`,
				header: {
					number: BigInt(blockNum),
					parentHash: `0x${hashSuffix.repeat(62)}${(blockNum - 1).toString(16).padStart(2, "0")}`,
					timestamp: BigInt(1700000000 + blockNum * 12),
					beneficiary: `0x${"c".repeat(40)}`,
					stateRoot: `0x${"d".repeat(64)}`,
					transactionsRoot: `0x${"e".repeat(64)}`,
					receiptsRoot: `0x${"f".repeat(64)}`,
					logsBloom: new Uint8Array(256),
					difficulty: 0n,
					gasLimit: 30000000n,
					gasUsed: 1500000n,
					extraData: new Uint8Array(0),
					mixHash: `0x${"0".repeat(64)}`,
					nonce: new Uint8Array(8),
					ommersHash: `0x${"1".repeat(64)}`,
				},
				body: {
					transactions: [],
					ommers: [],
				},
				size: 800n,
			};
		}
		if (method === "eth_getBlockByHash") {
			// Return block for hash lookup during reorg detection
			return null;
		}
		throw new Error(`Unhandled method: ${method}`);
	},
	on: () => mockProvider,
	removeListener: () => mockProvider,
};

async function main() {
	const stream = BlockStream({ provider: mockProvider as any });
	const controller = new AbortController();

	console.log("Watching for new blocks (will stop after 5 events)...\n");

	let eventCount = 0;
	const maxEvents = 5;

	try {
		for await (const event of stream.watch({
			fromBlock: 100n,
			signal: controller.signal,
			pollingInterval: 100, // Fast polling for demo
		})) {
			eventCount++;

			if (event.type === "blocks") {
				for (const block of event.blocks) {
					console.log(`NEW BLOCK ${block.header.number}: ${block.hash.slice(0, 18)}...`);
				}
			} else if (event.type === "reorg") {
				console.log("\n=== REORG DETECTED ===");
				console.log(`Common ancestor: Block ${event.commonAncestor.number}`);
				console.log(`Removed ${event.removed.length} blocks:`);
				for (const block of event.removed) {
					console.log(`  - Block ${block.number}: ${block.hash.toString().slice(0, 18)}...`);
				}
				console.log(`Added ${event.added.length} blocks:`);
				for (const block of event.added) {
					console.log(`  + Block ${block.header.number}: ${block.hash.slice(0, 18)}...`);
				}
				console.log("======================\n");
			}

			if (eventCount >= maxEvents) {
				controller.abort();
			}
		}
	} catch (error) {
		if (error instanceof BlockStreamAbortedError) {
			console.log("\nWatch stopped by abort signal");
		} else {
			throw error;
		}
	}

	console.log(`\nProcessed ${eventCount} events`);
}

main().catch(console.error);
