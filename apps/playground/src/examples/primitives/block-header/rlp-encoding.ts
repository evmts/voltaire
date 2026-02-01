import { BlockHeader, Bytes, Bytes32, Hex } from "@tevm/voltaire";
// Pre-London block (no optional fields)
const preLondonHeader = BlockHeader({
	parentHash: Bytes32.zero().fill(0x12),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	stateRoot: Bytes32.zero().fill(0x34),
	transactionsRoot: Bytes32.zero().fill(0x56),
	receiptsRoot: Bytes32.zero().fill(0x78),
	logsBloom: Bytes.zero(256),
	difficulty: 13000000000000000n,
	number: 12000000n,
	gasLimit: 15000000n,
	gasUsed: 12500000n,
	timestamp: 1619000000n,
	extraData: Hex.toBytes("0x657468657265756d"),
	mixHash: Bytes32.zero().fill(0x9a),
	nonce: Hex.toBytes("0x123456789abcdef0"),
});

// Post-London (EIP-1559)
const postLondonHeader = BlockHeader({
	parentHash: Bytes32.zero().fill(0x23),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x45),
	transactionsRoot: Bytes32.zero().fill(0x67),
	receiptsRoot: Bytes32.zero().fill(0x89),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 15537394n, // Merge block
	gasLimit: 30000000n,
	gasUsed: 15000000n,
	timestamp: 1663224179n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 20000000000n, // Added in London
});

// Post-Shanghai
const postShanghaiHeader = BlockHeader({
	parentHash: Bytes32.zero().fill(0x34),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x56),
	transactionsRoot: Bytes32.zero().fill(0x78),
	receiptsRoot: Bytes32.zero().fill(0x9a),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 17034870n, // Shanghai block
	gasLimit: 30000000n,
	gasUsed: 15000000n,
	timestamp: 1681338455n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 25000000000n,
	withdrawalsRoot: Bytes32.zero().fill(0xbc), // Added in Shanghai
});

// Post-Cancun (complete)
const postCancunHeader = BlockHeader({
	parentHash: Bytes32.zero().fill(0x45),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x67),
	transactionsRoot: Bytes32.zero().fill(0x89),
	receiptsRoot: Bytes32.zero().fill(0xab),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 19426587n, // Cancun block
	gasLimit: 30000000n,
	gasUsed: 15000000n,
	timestamp: 1710338135n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 30000000000n,
	withdrawalsRoot: Bytes32.zero().fill(0xcd),
	blobGasUsed: 262144n, // EIP-4844
	excessBlobGas: 0n, // EIP-4844
	parentBeaconBlockRoot: Bytes32.zero().fill(0xef), // EIP-4788
});
