import { BlockHash } from "voltaire";
// Create some block hashes for comparison
const genesis = BlockHash.from(
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
);
const block1 = BlockHash.from(
	"0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
);
const merge = BlockHash.from(
	"0x56a9bb0302da44b8c0b3df540781424684c3af04d0b7a38d72842b762076a664",
);

const genesisClone = BlockHash.from(
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
);
const upperCase = BlockHash.from(
	"0xD4E56740F876AEF8C010B86A40D5F56745A118D0906A34E69AEC8C0DB1CB8FA3",
);
const lowerCase = BlockHash.from(
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
);

const knownBlocks = [
	{
		name: "Genesis",
		hash: "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
	},
	{
		name: "Block 1",
		hash: "0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
	},
	{
		name: "DAO Fork",
		hash: "0x4985f5ca3d2afbec36529aa96f74de3cc10a2a4a6c44f2157a57d2c6059a11bb",
	},
	{
		name: "Merge",
		hash: "0x56a9bb0302da44b8c0b3df540781424684c3af04d0b7a38d72842b762076a664",
	},
];

function findBlock(searchHash: string): string | null {
	const search = BlockHash.from(searchHash);
	for (const block of knownBlocks) {
		const blockHash = BlockHash.from(block.hash);
		if (BlockHash.equals(search, blockHash)) {
			return block.name;
		}
	}
	return null;
}

const testHash =
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3";

// Not found case
const unknownHash =
	"0x0000000000000000000000000000000000000000000000000000000000000000";

const duplicates = [
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3", // Duplicate
	"0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
	"0xD4E56740F876AEF8C010B86A40D5F56745A118D0906A34E69AEC8C0DB1CB8FA3", // Duplicate (different case)
];

const unique: string[] = [];
for (const hashStr of duplicates) {
	const hash = BlockHash.from(hashStr);
	const isDuplicate = unique.some((u) =>
		BlockHash.equals(hash, BlockHash.from(u)),
	);
	if (!isDuplicate) {
		unique.push(BlockHash.toHex(hash));
	}
}
for (const hash of unique) {
}
