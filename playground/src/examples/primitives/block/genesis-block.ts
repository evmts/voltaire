import { Block, BlockBody, BlockHash, BlockHeader } from "voltaire";
// Genesis block header (block 0)
const genesisHeader = BlockHeader.from({
	// No parent block
	parentHash:
		"0x0000000000000000000000000000000000000000000000000000000000000000",
	// Empty ommers list
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	// Zero address (no miner)
	beneficiary: "0x0000000000000000000000000000000000000000",
	// Initial state root with premined balances
	stateRoot:
		"0xd7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544",
	// Empty transactions
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	// Empty receipts
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	// Empty bloom filter
	logsBloom: new Uint8Array(256),
	// Initial difficulty
	difficulty: 17179869184n,
	// Block number 0
	number: 0n,
	// Initial gas limit
	gasLimit: 5000n,
	// No gas used
	gasUsed: 0n,
	// Unix timestamp: July 30, 2015 at 3:26:13 PM UTC
	timestamp: 0n,
	// Extra data from genesis
	extraData: new TextEncoder().encode("11/5/1955"),
	// Mix hash
	mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
	// Nonce
	nonce: new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x42]),
});

// Genesis block body (empty)
const genesisBody = BlockBody.from({
	transactions: [], // No transactions in genesis
	ommers: [], // No uncles
});

// Genesis block hash
const genesisHash = BlockHash.from(
	"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
);

// Create genesis block
const genesisBlock = Block.from({
	header: genesisHeader,
	body: genesisBody,
	hash: genesisHash,
	size: 540n,
	totalDifficulty: 17179869184n, // Same as difficulty for first block
});
