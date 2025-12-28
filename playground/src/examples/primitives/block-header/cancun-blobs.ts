import { BlockHeader, Hex, Bytes, Bytes32 } from "@tevm/voltaire";
// Pre-Cancun block (no blob fields)
const preCancun = BlockHeader({
	parentHash: Bytes32.zero().fill(0x01),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x02),
	transactionsRoot: Bytes32.zero().fill(0x03),
	receiptsRoot: Bytes32.zero().fill(0x04),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 19426586n, // Block before Cancun
	gasLimit: 30000000n,
	gasUsed: 15000000n,
	timestamp: 1710338123n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 25000000000n,
	withdrawalsRoot: Bytes32.zero().fill(0x05),
});

// Cancun block with blobs
const cancunWithBlobs = BlockHeader({
	parentHash: Bytes32.zero().fill(0x02),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x03),
	transactionsRoot: Bytes32.zero().fill(0x04),
	receiptsRoot: Bytes32.zero().fill(0x05),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 19426587n, // Cancun activation
	gasLimit: 30000000n,
	gasUsed: 12000000n,
	timestamp: 1710338135n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 30000000000n,
	withdrawalsRoot: Bytes32.zero().fill(0x06),
	blobGasUsed: 262144n, // 2 blobs × 131072 gas per blob
	excessBlobGas: 0n, // No excess yet (genesis)
	parentBeaconBlockRoot: Bytes32.zero().fill(0x07), // EIP-4788
});

const blobCount = Number(cancunWithBlobs.blobGasUsed!) / 131072;

// Full blob block
const fullBlobBlock = BlockHeader({
	parentHash: Bytes32.zero().fill(0x03),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x04),
	transactionsRoot: Bytes32.zero().fill(0x05),
	receiptsRoot: Bytes32.zero().fill(0x06),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 19426588n,
	gasLimit: 30000000n,
	gasUsed: 18000000n,
	timestamp: 1710338147n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 35000000000n,
	withdrawalsRoot: Bytes32.zero().fill(0x07),
	blobGasUsed: 786432n, // 6 blobs (max per block)
	excessBlobGas: 131072n, // Excess accumulating
	parentBeaconBlockRoot: Bytes32.zero().fill(0x08),
});

const fullBlobCount = Number(fullBlobBlock.blobGasUsed!) / 131072;
const maxBlobs = 6;
