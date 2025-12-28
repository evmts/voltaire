import { Block, BlockBody, BlockHash, BlockHeader, Bytes, Bytes32 } from "@tevm/voltaire";
// Block header contains all metadata
const header = BlockHeader({
	parentHash:
		"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263",
	stateRoot:
		"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544",
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	logsBloom: Bytes.zero(256), // Empty bloom filter
	difficulty: 17171480576n,
	number: 1n,
	gasLimit: 5000n,
	gasUsed: 0n,
	timestamp: 1438269988n,
	extraData: Bytes32.zero(),
	mixHash: "0x969b900de27b6ac6a67742365dd65f55a0526c41fd18e1b16f1a1215c2e66f59",
	nonce: Bytes.repeat(0x53, 8),
});

// Block body contains transactions and ommers (uncles)
const body = BlockBody({
	transactions: [], // Empty transaction list
	ommers: [], // No uncle blocks
});

// Block hash identifies the block (computed from header)
const hash = BlockHash(
	"0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
);

// Create complete block
const block = Block({
	header,
	body,
	hash,
	size: 537n, // RLP-encoded size in bytes
	totalDifficulty: 34351349760n, // Cumulative difficulty (pre-merge)
});
