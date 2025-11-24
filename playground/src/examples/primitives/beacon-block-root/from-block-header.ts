import * as BeaconBlockRoot from "../../../primitives/BeaconBlockRoot/index.js";
import * as BlockHeader from "../../../primitives/BlockHeader/index.js";

// Example: Extracting beacon block root from block headers

// Pre-Cancun block (no beacon root)
const shanghaiBlock = BlockHeader.from({
	parentHash: new Uint8Array(32).fill(0x01),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: new Uint8Array(32).fill(0x02),
	transactionsRoot: new Uint8Array(32).fill(0x03),
	receiptsRoot: new Uint8Array(32).fill(0x04),
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 17034870n, // Shanghai era
	gasLimit: 30000000n,
	gasUsed: 12000000n,
	timestamp: 1681338455n,
	extraData: new Uint8Array(0),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
	baseFeePerGas: 20000000000n,
	withdrawalsRoot: new Uint8Array(32).fill(0x05),
});

// Cancun block with beacon root
const cancunBlock = BlockHeader.from({
	parentHash: new Uint8Array(32).fill(0x06),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: new Uint8Array(32).fill(0x07),
	transactionsRoot: new Uint8Array(32).fill(0x08),
	receiptsRoot: new Uint8Array(32).fill(0x09),
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 19426587n, // Cancun activation
	gasLimit: 30000000n,
	gasUsed: 15000000n,
	timestamp: 1710338135n,
	extraData: new Uint8Array(0),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
	baseFeePerGas: 25000000000n,
	withdrawalsRoot: new Uint8Array(32).fill(0x0a),
	blobGasUsed: 262144n,
	excessBlobGas: 0n,
	parentBeaconBlockRoot: new Uint8Array(32).fill(0x0b),
});

// Subsequent block with different root
const nextBlock = BlockHeader.from({
	parentHash: new Uint8Array(32).fill(0x0c),
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot: new Uint8Array(32).fill(0x0d),
	transactionsRoot: new Uint8Array(32).fill(0x0e),
	receiptsRoot: new Uint8Array(32).fill(0x0f),
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 19426588n,
	gasLimit: 30000000n,
	gasUsed: 18000000n,
	timestamp: 1710338147n,
	extraData: new Uint8Array(0),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
	baseFeePerGas: 28000000000n,
	withdrawalsRoot: new Uint8Array(32).fill(0x10),
	blobGasUsed: 393216n,
	excessBlobGas: 131072n,
	parentBeaconBlockRoot: new Uint8Array(32).fill(0x11),
});

// Extract beacon roots
const hasBeaconRoot = (header: ReturnType<typeof BlockHeader.from>): boolean =>
	header.parentBeaconBlockRoot !== undefined;

const shanghaiHasRoot = hasBeaconRoot(shanghaiBlock);
const cancunHasRoot = hasBeaconRoot(cancunBlock);
const nextHasRoot = hasBeaconRoot(nextBlock);

// Get beacon roots
const cancunRoot = cancunHasRoot
	? BeaconBlockRoot.from(cancunBlock.parentBeaconBlockRoot as Uint8Array)
	: null;
const nextRoot = nextHasRoot
	? BeaconBlockRoot.from(nextBlock.parentBeaconBlockRoot as Uint8Array)
	: null;

console.log("=== Extracting Beacon Root from Block Headers ===\n");

console.log("Shanghai Block (Pre-Cancun):");
console.log("  Number:", shanghaiBlock.number);
console.log("  Has Beacon Root:", shanghaiHasRoot);
console.log("  Note: EIP-4788 not activated");
console.log();

console.log("Cancun Block:");
console.log("  Number:", cancunBlock.number);
console.log("  Has Beacon Root:", cancunHasRoot);
console.log(
	"  Beacon Root:",
	cancunRoot ? BeaconBlockRoot.toHex(cancunRoot) : "N/A",
);
console.log();

console.log("Next Block:");
console.log("  Number:", nextBlock.number);
console.log("  Has Beacon Root:", nextHasRoot);
console.log(
	"  Beacon Root:",
	nextRoot ? BeaconBlockRoot.toHex(nextRoot) : "N/A",
);
console.log();

console.log("Comparison:");
if (cancunRoot && nextRoot) {
	console.log("  Roots Equal:", BeaconBlockRoot.equals(cancunRoot, nextRoot));
	console.log("  Note: Different blocks have different beacon roots");
}
console.log();

console.log("Upgrade Timeline:");
console.log("  Shanghai: Withdrawals enabled (no beacon root)");
console.log("  Cancun: EIP-4788 activated (beacon root added)");
console.log("  Block field: parentBeaconBlockRoot (32 bytes)");
console.log("  Timing: 1 beacon block per 12 EL blocks (~12s)");
