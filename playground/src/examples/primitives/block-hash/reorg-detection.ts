import * as BlockHash from "../../../primitives/BlockHash/index.js";

// Example: Chain reorganization detection using block hashes

interface BlockHeader {
	number: number;
	hash: string;
	parentHash: string;
	timestamp: number;
}

// Simulate a chain
class BlockchainState {
	private blocks: BlockHeader[] = [];

	addBlock(block: BlockHeader): void {
		this.blocks.push(block);
	}

	getBlock(number: number): BlockHeader | null {
		return this.blocks.find((b) => b.number === number) ?? null;
	}

	getBlockByHash(hashStr: string): BlockHeader | null {
		const searchHash = BlockHash.from(hashStr);
		return (
			this.blocks.find((b) => {
				const blockHash = BlockHash.from(b.hash);
				return BlockHash.equals(searchHash, blockHash);
			}) ?? null
		);
	}

	getChainTip(): BlockHeader | null {
		return this.blocks[this.blocks.length - 1] ?? null;
	}

	getAllBlocks(): BlockHeader[] {
		return [...this.blocks];
	}
}

// Original chain
const originalChain = new BlockchainState();
originalChain.addBlock({
	number: 100,
	hash: "0x1111111111111111111111111111111111111111111111111111111111111111",
	parentHash:
		"0x0000000000000000000000000000000000000000000000000000000000000000",
	timestamp: 1000000,
});
originalChain.addBlock({
	number: 101,
	hash: "0x2222222222222222222222222222222222222222222222222222222222222222",
	parentHash:
		"0x1111111111111111111111111111111111111111111111111111111111111111",
	timestamp: 1000012,
});
originalChain.addBlock({
	number: 102,
	hash: "0x3333333333333333333333333333333333333333333333333333333333333333",
	parentHash:
		"0x2222222222222222222222222222222222222222222222222222222222222222",
	timestamp: 1000024,
});
for (const block of originalChain.getAllBlocks()) {
}

// New chain with reorg at block 101
const newChain = new BlockchainState();
newChain.addBlock({
	number: 100,
	hash: "0x1111111111111111111111111111111111111111111111111111111111111111",
	parentHash:
		"0x0000000000000000000000000000000000000000000000000000000000000000",
	timestamp: 1000000,
});
newChain.addBlock({
	number: 101,
	hash: "0x4444444444444444444444444444444444444444444444444444444444444444", // Different!
	parentHash:
		"0x1111111111111111111111111111111111111111111111111111111111111111",
	timestamp: 1000012,
});
newChain.addBlock({
	number: 102,
	hash: "0x5555555555555555555555555555555555555555555555555555555555555555", // Different!
	parentHash:
		"0x4444444444444444444444444444444444444444444444444444444444444444",
	timestamp: 1000024,
});
newChain.addBlock({
	number: 103,
	hash: "0x6666666666666666666666666666666666666666666666666666666666666666",
	parentHash:
		"0x5555555555555555555555555555555555555555555555555555555555555555",
	timestamp: 1000036,
});
for (const block of newChain.getAllBlocks()) {
}

function detectReorg(
	oldChain: BlockchainState,
	newChain: BlockchainState,
): { reorgDepth: number; commonAncestor: number | null } {
	const oldTip = oldChain.getChainTip();
	const newTip = newChain.getChainTip();

	if (!oldTip || !newTip) {
		return { reorgDepth: 0, commonAncestor: null };
	}

	// Walk backwards to find common ancestor
	let depth = 0;
	for (let i = oldTip.number; i >= 0; i--) {
		const oldBlock = oldChain.getBlock(i);
		const newBlock = newChain.getBlock(i);

		if (!oldBlock || !newBlock) {
			break;
		}

		const oldHash = BlockHash.from(oldBlock.hash);
		const newHash = BlockHash.from(newBlock.hash);

		if (BlockHash.equals(oldHash, newHash)) {
			return { reorgDepth: depth, commonAncestor: i };
		}

		depth++;
	}

	return { reorgDepth: depth, commonAncestor: null };
}

const reorg = detectReorg(originalChain, newChain);
if (reorg.commonAncestor !== null) {
	for (let i = reorg.commonAncestor + 1; i <= 102; i++) {
		const oldBlock = originalChain.getBlock(i);
		const newBlock = newChain.getBlock(i);

		if (oldBlock && newBlock) {
			const oldHash = BlockHash.from(oldBlock.hash);
			const newHash = BlockHash.from(newBlock.hash);
		}
	}
}

const expectedTipHash =
	"0x3333333333333333333333333333333333333333333333333333333333333333";
const currentTipHash =
	"0x5555555555555555555555555555555555555555555555555555555555555555";

const expectedTip = BlockHash.from(expectedTipHash);
const currentTip = BlockHash.from(currentTipHash);

if (!BlockHash.equals(expectedTip, currentTip)) {
} else {
}
