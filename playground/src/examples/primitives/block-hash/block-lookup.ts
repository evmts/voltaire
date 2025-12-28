import { BlockHash } from "voltaire";
// Example: Block lookup and tracking patterns

// Block database simulation
interface BlockInfo {
	number: number;
	hash: string;
	timestamp: number;
	transactions: number;
	miner?: string;
}

const blockDatabase: BlockInfo[] = [
	{
		number: 0,
		hash: "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
		timestamp: 1438269973,
		transactions: 0,
	},
	{
		number: 1,
		hash: "0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
		timestamp: 1438270017,
		transactions: 0,
	},
	{
		number: 1920000,
		hash: "0x4985f5ca3d2afbec36529aa96f74de3cc10a2a4a6c44f2157a57d2c6059a11bb",
		timestamp: 1469020840,
		transactions: 6,
		miner: "0x61c808d82a3ac53231750dadc13c777b59310bd9",
	},
	{
		number: 15537393,
		hash: "0x56a9bb0302da44b8c0b3df540781424684c3af04d0b7a38d72842b762076a664",
		timestamp: 1663224179,
		transactions: 98,
		miner: "0x690b9a9e9aa1c9db991c7721a92d351db4fac990",
	},
];

// Lookup by hash
function lookupBlock(hashStr: string): BlockInfo | null {
	const searchHash = BlockHash.from(hashStr);

	for (const block of blockDatabase) {
		const blockHash = BlockHash.from(block.hash);
		if (BlockHash.equals(searchHash, blockHash)) {
			return block;
		}
	}

	return null;
}

// Lookup genesis block
const genesisHash =
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3";
const genesisInfo = lookupBlock(genesisHash);
if (genesisInfo) {
}
const daoHash =
	"0x4985f5ca3d2afbec36529aa96f74de3cc10a2a4a6c44f2157a57d2c6059a11bb";
const daoInfo = lookupBlock(daoHash);
if (daoInfo) {
}
const mergeHash =
	"0x56a9bb0302da44b8c0b3df540781424684c3af04d0b7a38d72842b762076a664";
const mergeInfo = lookupBlock(mergeHash);
if (mergeInfo) {
}
const unknownHash =
	"0x0000000000000000000000000000000000000000000000000000000000000000";
const unknownInfo = lookupBlock(unknownHash);

class BlockHashIndex {
	private index = new Map<string, BlockInfo>();

	constructor(blocks: BlockInfo[]) {
		for (const block of blocks) {
			// Normalize to lowercase for case-insensitive lookups
			const hash = BlockHash.from(block.hash);
			const normalized = BlockHash.toHex(hash).toLowerCase();
			this.index.set(normalized, block);
		}
	}

	lookup(hashStr: string): BlockInfo | null {
		const hash = BlockHash.from(hashStr);
		const normalized = BlockHash.toHex(hash).toLowerCase();
		return this.index.get(normalized) ?? null;
	}

	has(hashStr: string): boolean {
		const hash = BlockHash.from(hashStr);
		const normalized = BlockHash.toHex(hash).toLowerCase();
		return this.index.has(normalized);
	}

	size(): number {
		return this.index.size;
	}
}

const index = new BlockHashIndex(blockDatabase);

// Case-insensitive lookup
const upperCaseHash =
	"0xD4E56740F876AEF8C010B86A40D5F56745A118D0906A34E69AEC8C0DB1CB8FA3";
const found = index.lookup(upperCaseHash);
