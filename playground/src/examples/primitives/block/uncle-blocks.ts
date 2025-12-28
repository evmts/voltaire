import { type UncleType, Bytes, Bytes32 } from "@tevm/voltaire";
import { Block, BlockBody, BlockHash, BlockHeader } from "@tevm/voltaire";

// Create uncle blocks (headers only, no body)
const uncle1: UncleType = BlockHeader({
	parentHash:
		"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263", // Uncle miner
	stateRoot:
		"0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	logsBloom: Bytes.zero(256),
	difficulty: 17171480576n,
	number: 5n, // Same height as main block
	gasLimit: 5000n,
	gasUsed: 0n,
	timestamp: 1438270123n,
	extraData: Bytes32.zero(),
	mixHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	nonce: Bytes.repeat(0x11, 8),
});

const uncle2: UncleType = BlockHeader({
	parentHash:
		"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5", // Different miner
	stateRoot:
		"0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	logsBloom: Bytes.zero(256),
	difficulty: 17171480576n,
	number: 5n, // Same height as main block
	gasLimit: 5000n,
	gasUsed: 0n,
	timestamp: 1438270134n,
	extraData: Bytes32.zero(),
	mixHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	nonce: Bytes.repeat(0x22, 8),
});

// Main block header with references to uncles
const mainHeader = BlockHeader({
	parentHash:
		"0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6",
	// ommersHash is Keccak256(RLP([uncle1_header, uncle2_header]))
	ommersHash:
		"0xabcd1234567890efabcd1234567890efabcd1234567890efabcd1234567890ef",
	beneficiary: "0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8", // Main miner
	stateRoot:
		"0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
	transactionsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	receiptsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	logsBloom: Bytes.zero(256),
	difficulty: 17171480576n,
	number: 5n,
	gasLimit: 5000n,
	gasUsed: 0n,
	timestamp: 1438270098n,
	extraData: Bytes32.zero(),
	mixHash: "0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
	nonce: Bytes.repeat(0x42, 8),
});

// Block body includes uncle headers
const body = BlockBody({
	transactions: [],
	ommers: [uncle1, uncle2], // Up to 2 uncles allowed
});

// Create block with uncles
const blockWithUncles = Block({
	header: mainHeader,
	body,
	hash: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
	size: 1234n,
	totalDifficulty: 85857402880n,
});
const baseReward = 2n * 10n ** 18n; // 2 ETH base block reward (simplified)
const uncleReward = baseReward / 8n; // 0.25 ETH per uncle
const mainMinerBonus = (baseReward * BigInt(body.ommers.length)) / 32n; // 1/32 per uncle

// Example of post-merge block (no uncles)
const postMergeHeader = BlockHeader({
	parentHash:
		"0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347", // Empty
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot:
		"0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
	transactionsRoot:
		"0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
	receiptsRoot:
		"0xf6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
	logsBloom: Bytes.zero(256),
	difficulty: 0n, // Always 0 post-merge
	number: 15537394n,
	gasLimit: 30000000n,
	gasUsed: 12345678n,
	timestamp: 1663224179n,
	extraData: Bytes.zero(0),
	mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
	nonce: Bytes.zero(8),
	baseFeePerGas: 20000000000n,
});

const postMergeBody = BlockBody({
	transactions: [],
	ommers: [], // Always empty post-merge
});

const postMergeBlock = Block({
	header: postMergeHeader,
	body: postMergeBody,
	hash: "0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a",
	size: 987n,
});
