import * as BlockHeader from "../../../primitives/BlockHeader/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Pre-merge block example (difficulty > 0)
const powBlock = BlockHeader.from({
	parentHash:
		"0xaa12acd8e4b97ca7a24e5e3c8e7c1d3f5b8e3d4c5a3b8e7c1d3f5b8e3d4c5a3b",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x829BD824B016326A401d083B33D092293333A830", // Ethermine
	stateRoot:
		"0x3e5f8d4c5a3b8e7c1d3f5b8e3d4c5a3b8e7c1d3f5b8e3d4c5a3b8e7c1d3f5b8e",
	transactionsRoot:
		"0x5b8e3d4c5a3b8e7c1d3f5b8e3d4c5a3b8e7c1d3f5b8e3d4c5a3b8e7c1d3f5b8e",
	receiptsRoot:
		"0x7c1d3f5b8e3d4c5a3b8e7c1d3f5b8e3d4c5a3b8e7c1d3f5b8e3d4c5a3b8e7c1d",
	logsBloom: new Uint8Array(256),
	difficulty: 13000000000000000n, // ~13 PH (petahash)
	number: 15000000n, // Pre-merge block
	gasLimit: 30000000n,
	gasUsed: 12500000n,
	timestamp: 1658000000n, // July 2022 (pre-merge)
	extraData: Hex.toBytes("0x657468657265756d2e6f7267"), // "ethereum.org"
	mixHash: "0xf5b8e3d4c5a3b8e7c1d3f5b8e3d4c5a3b8e7c1d3f5b8e3d4c5a3b8e7c1d3f5b8",
	nonce: Hex.toBytes("0x123456789abcdef0"), // 8-byte PoW nonce
	baseFeePerGas: 30000000000n, // 30 gwei
});

// Post-merge block (difficulty = 0)
const posBlock = BlockHeader.from({
	parentHash:
		"0xbb23bcd9f5c98db8b35f6f4d9f8d2e4f6c9f4e5d6b4c9f8d2e4f6c9f4e5d6b4c",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5", // Validator fee recipient
	stateRoot:
		"0x4f6a9e5d6b4c9f8d2e4f6c9f4e5d6b4c9f8d2e4f6c9f4e5d6b4c9f8d2e4f6c9f",
	transactionsRoot:
		"0x6c9f4e5d6b4c9f8d2e4f6c9f4e5d6b4c9f8d2e4f6c9f4e5d6b4c9f8d2e4f6c9f",
	receiptsRoot:
		"0x8d2e4f6c9f4e5d6b4c9f8d2e4f6c9f4e5d6b4c9f8d2e4f6c9f4e5d6b4c9f8d2e",
	logsBloom: new Uint8Array(256),
	difficulty: 0n, // Zero post-merge
	number: 18000000n, // Post-merge block
	gasLimit: 30000000n,
	gasUsed: 15000000n,
	timestamp: 1693903403n, // Sept 2023 (post-merge)
	extraData: Hex.toBytes("0x"), // Often empty post-merge
	mixHash: new Uint8Array(32), // Zero post-merge
	nonce: new Uint8Array(8), // Zero post-merge
	baseFeePerGas: 25000000000n, // 25 gwei
	withdrawalsRoot:
		"0x9f4e5d6b4c9f8d2e4f6c9f4e5d6b4c9f8d2e4f6c9f4e5d6b4c9f8d2e4f6c9f4e",
});
