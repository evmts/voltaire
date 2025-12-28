import { Block, BlockBody, BlockHash, BlockHeader } from "voltaire";
// Create a valid block
const validBlock = Block.from({
	header: BlockHeader.from({
		parentHash:
			"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
		ommersHash:
			"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
		beneficiary: "0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263",
		stateRoot:
			"0xd67e4d450343046425ae4271474353857ab860dbc0a1dde64b41b5cd3a532bf3",
		transactionsRoot:
			"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
		receiptsRoot:
			"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
		logsBloom: new Uint8Array(256),
		difficulty: 0n,
		number: 19426587n,
		gasLimit: 30000000n,
		gasUsed: 15234567n, // <= gasLimit (valid)
		timestamp: 1710338455n,
		extraData: new Uint8Array(0),
		mixHash:
			"0x0000000000000000000000000000000000000000000000000000000000000000",
		nonce: new Uint8Array(8),
		baseFeePerGas: 12345678900n,
	}),
	body: BlockBody.from({
		transactions: [],
		ommers: [],
	}),
	hash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
	size: 1234n,
});

// Check gas limit constraint
const gasLimitValid = validBlock.header.gasUsed <= validBlock.header.gasLimit;

// Check extra data size
const extraDataValid = validBlock.header.extraData.length <= 32;

// Check post-merge difficulty
const postMergeDifficultyValid = validBlock.header.difficulty === 0n;

// Check empty ommers hash (post-merge)
const emptyOmmersHash =
	"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347";
const ommersHashValid =
	BlockHash.toHex(validBlock.header.ommersHash) === emptyOmmersHash;

// Simulate parent and child blocks for base fee calculation
const parentBaseFee = 10000000000n; // 10 gwei
const parentGasUsed = 15000000n;
const parentGasLimit = 30000000n;

const gasTarget = parentGasLimit / 2n;
const gasDelta = parentGasUsed - gasTarget;
const baseFeePerGasDelta = (parentBaseFee * gasDelta) / gasTarget / 8n;

const expectedBaseFee =
	gasDelta > 0n
		? parentBaseFee + baseFeePerGasDelta
		: parentBaseFee - baseFeePerGasDelta;
