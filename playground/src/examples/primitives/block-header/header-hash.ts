import { BlockHeader, Hex, Keccak256, Bytes, Bytes32 } from "@tevm/voltaire";
const header = BlockHeader({
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
	logsBloom: Bytes.zero(256),
	difficulty: 0n,
	number: 18000000n,
	gasLimit: 30000000n,
	gasUsed: 15234567n,
	timestamp: 1693903403n,
	extraData: Hex.toBytes("0x657468657265756d"),
	mixHash: Bytes32.zero(),
	nonce: Bytes.zero(8),
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
const numberBuffer = new BigUint64Array([header.number]).buffer;
const numberAsBytes = Array.from(new Uint8Array(numberBuffer));
const exampleData = Bytes([
	// Simplified representation of some header fields
	...header.parentHash.slice(0, 8),
	...header.stateRoot.slice(0, 8),
	...numberAsBytes,
]);

const exampleHash = Keccak256.hash(exampleData);
