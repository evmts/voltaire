import { BlockHash, Hash, Hex } from "voltaire";
// Example: Calculate block hash from block header fields
// Note: Real block hash calculation requires RLP encoding of header

interface BlockHeader {
	parentHash: string;
	ommersHash: string;
	beneficiary: string;
	stateRoot: string;
	transactionsRoot: string;
	receiptsRoot: string;
	logsBloom: string;
	difficulty: bigint;
	number: bigint;
	gasLimit: bigint;
	gasUsed: bigint;
	timestamp: bigint;
	extraData: string;
	mixHash: string;
	nonce: string;
}

// Simplified demonstration (not actual RLP encoding)
function calculateBlockHashSimplified(header: BlockHeader): string {
	// In reality, you would:
	// 1. RLP encode all header fields in correct order
	// 2. Keccak256 hash the encoded bytes
	// 3. Result is the block hash

	// This is a simplified demonstration showing the concept
	const fields = [
		header.parentHash,
		header.ommersHash,
		header.beneficiary,
		header.stateRoot,
		header.transactionsRoot,
		header.receiptsRoot,
		header.logsBloom,
		header.difficulty.toString(16),
		header.number.toString(16),
		header.gasLimit.toString(16),
		header.gasUsed.toString(16),
		header.timestamp.toString(16),
		header.extraData,
		header.mixHash,
		header.nonce,
	].join("");

	// Hash the concatenated fields (simplified - not actual implementation)
	const data = Hex.fromString(fields);
	const hash = Hash.keccak256(data);
	return Hex.toString(hash);
}
const genesisHeader: BlockHeader = {
	parentHash:
		"0x0000000000000000000000000000000000000000000000000000000000000000",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x0000000000000000000000000000000000000000",
	stateRoot:
		"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544",
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	logsBloom: `0x${"0".repeat(512)}`,
	difficulty: 17179869184n,
	number: 0n,
	gasLimit: 5000n,
	gasUsed: 0n,
	timestamp: 0n,
	extraData:
		"0x11bbe8db4e347b4e8c937c1c8370e4b5ed33adb3db69cbdb7a38e1e50b1b82fa",
	mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
	nonce: "0x0000000000000042",
};

// Known genesis hash
const knownGenesisHash =
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3";
const genesis = BlockHash.from(knownGenesisHash);
const block1Hash =
	"0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6";
const block1 = BlockHash.from(block1Hash);

interface SimpleBlock {
	number: number;
	hash: string;
	parentHash: string;
}

const blocks: SimpleBlock[] = [
	{
		number: 0,
		hash: "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
		parentHash:
			"0x0000000000000000000000000000000000000000000000000000000000000000",
	},
	{
		number: 1,
		hash: "0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
		parentHash:
			"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
	},
	{
		number: 2,
		hash: "0xb495a1d7e6663152ae92708da4843337b958146015a2802f4193a410044698c9",
		parentHash:
			"0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
	},
];

for (const block of blocks) {
	const hash = BlockHash.from(block.hash);
	const parent = BlockHash.from(block.parentHash);

	// Verify chain continuity
	if (block.number > 0) {
		const prevBlock = blocks[block.number - 1];
		const prevHash = BlockHash.from(prevBlock.hash);
		const chainValid = BlockHash.equals(parent, prevHash);
	}
}
