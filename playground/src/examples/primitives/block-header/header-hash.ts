import * as Keccak256 from "../../../crypto/Keccak256/index.js";
import * as BlockHeader from "../../../primitives/BlockHeader/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

const header = BlockHeader.from({
	parentHash:
		"0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
	ommersHash:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	beneficiary: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5",
	stateRoot:
		"0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
	transactionsRoot:
		"0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
	receiptsRoot:
		"0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
	logsBloom: new Uint8Array(256),
	difficulty: 0n,
	number: 18000000n,
	gasLimit: 30000000n,
	gasUsed: 15234567n,
	timestamp: 1693903403n,
	extraData: Hex.toBytes("0x657468657265756d"),
	mixHash: new Uint8Array(32),
	nonce: new Uint8Array(8),
	baseFeePerGas: 20000000000n,
	withdrawalsRoot:
		"0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
});

if (header.baseFeePerGas !== undefined) {
}
if (header.withdrawalsRoot !== undefined) {
}
if (header.blobGasUsed !== undefined) {
}
if (header.excessBlobGas !== undefined) {
}
if (header.parentBeaconBlockRoot !== undefined) {
}

// Example: Simplified hash for demonstration
const exampleData = new Uint8Array([
	// Simplified representation of some header fields
	...header.parentHash.slice(0, 8),
	...header.stateRoot.slice(0, 8),
	...new Uint8Array(new BigUint64Array([header.number]).buffer),
]);

const exampleHash = Keccak256.hash(exampleData);
