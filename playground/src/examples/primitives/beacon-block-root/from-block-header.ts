import { BeaconBlockRoot, BlockHeader, Bytes, Bytes32 } from "@tevm/voltaire";
// Example: Extracting beacon block root from block headers

// Pre-Cancun block (no beacon root)
const shanghaiBlock = BlockHeader({
	parentHash: Bytes32.zero().fill(0x01),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x02),
	transactionsRoot: Bytes32.zero().fill(0x03),
	receiptsRoot: Bytes32.zero().fill(0x04),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 17034870n, // Shanghai era
	gasLimit: 30000000n,
	gasUsed: 12000000n,
	timestamp: 1681338455n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 20000000000n,
	withdrawalsRoot: Bytes32.zero().fill(0x05),
});

// Cancun block with beacon root
const cancunBlock = BlockHeader({
	parentHash: Bytes32.zero().fill(0x06),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x07),
	transactionsRoot: Bytes32.zero().fill(0x08),
	receiptsRoot: Bytes32.zero().fill(0x09),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 19426587n, // Cancun activation
	gasLimit: 30000000n,
	gasUsed: 15000000n,
	timestamp: 1710338135n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 25000000000n,
	withdrawalsRoot: Bytes32.zero().fill(0x0a),
	blobGasUsed: 262144n,
	excessBlobGas: 0n,
	parentBeaconBlockRoot: Bytes32.zero().fill(0x0b),
});

// Subsequent block with different root
const nextBlock = BlockHeader({
	parentHash: Bytes32.zero().fill(0x0c),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: Bytes32.zero().fill(0x0d),
	transactionsRoot: Bytes32.zero().fill(0x0e),
	receiptsRoot: Bytes32.zero().fill(0x0f),
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 19426588n,
	gasLimit: 30000000n,
	gasUsed: 18000000n,
	timestamp: 1710338147n,
	extraData: Bytes.zero(0),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
	baseFeePerGas: 28000000000n,
	withdrawalsRoot: Bytes32.zero().fill(0x10),
	blobGasUsed: 393216n,
	excessBlobGas: 131072n,
	parentBeaconBlockRoot: Bytes32.zero().fill(0x11),
});

// Extract beacon roots
const hasBeaconRoot = (header: ReturnType<typeof BlockHeader.from>): boolean =>
	header.parentBeaconBlockRoot !== undefined;

const shanghaiHasRoot = hasBeaconRoot(shanghaiBlock);
const cancunHasRoot = hasBeaconRoot(cancunBlock);
const nextHasRoot = hasBeaconRoot(nextBlock);

// Get beacon roots
const cancunRoot = cancunHasRoot
	? BeaconBlockRoot(cancunBlock.parentBeaconBlockRoot as Uint8Array)
	: null;
const nextRoot = nextHasRoot
	? BeaconBlockRoot(nextBlock.parentBeaconBlockRoot as Uint8Array)
	: null;
if (cancunRoot && nextRoot) {
}
