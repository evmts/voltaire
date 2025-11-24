import * as BloomFilter from "voltaire/primitives/BloomFilter";

// Creating bloom filter from event logs (Ethereum use case)

console.log("\n=== Creating Bloom from Event Logs ===\n");

// ERC20 Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
// Event signature hash: keccak256("Transfer(address,address,uint256)")
const transferEventSig = new Uint8Array([
	0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68, 0xfc,
	0x37, 0x8d, 0xaa, 0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16, 0x28, 0xf5,
	0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef,
]);

// Contract address (20 bytes)
const contractAddr = new Uint8Array([
	0xa0, 0xb8, 0x69, 0x91, 0xc6, 0x21, 0x8b, 0x36, 0xc1, 0xd1, 0x9d, 0x4a, 0x2e,
	0x9e, 0xb0, 0xce, 0x36, 0x06, 0xeb, 0x48,
]);

// From address (indexed, padded to 32 bytes)
const fromAddr = new Uint8Array(32);
fromAddr.set(
	new Uint8Array([
		0x5a, 0xae, 0xd5, 0x93, 0x20, 0xb9, 0xeb, 0x3c, 0xd4, 0x62, 0xdd, 0xba,
		0xef, 0xa2, 0x1d, 0xa7, 0x57, 0xf3, 0x0f, 0xbd,
	]),
	12,
);

// To address (indexed, padded to 32 bytes)
const toAddr = new Uint8Array(32);
toAddr.set(
	new Uint8Array([
		0x70, 0x99, 0x7b, 0x70, 0x83, 0x7e, 0xdc, 0xf3, 0x9c, 0x09, 0x98, 0xf0,
		0x4f, 0x42, 0xa4, 0x95, 0x92, 0x37, 0x04, 0xf5,
	]),
	12,
);

console.log("Single Transfer log:");
const logBloom = BloomFilter.create(2048, 3);

// Add contract address and topics to bloom
BloomFilter.add(logBloom, contractAddr);
BloomFilter.add(logBloom, transferEventSig); // topic[0]
BloomFilter.add(logBloom, fromAddr); // topic[1]
BloomFilter.add(logBloom, toAddr); // topic[2]

console.log("- Added contract address");
console.log("- Added event signature (topic[0])");
console.log("- Added from address (topic[1])");
console.log("- Added to address (topic[2])");
console.log(
	"- Density:",
	(BloomFilter.density(logBloom) * 100).toFixed(4) + "%",
);

// Query the bloom
console.log("\nQuerying log bloom:");
console.log(
	"- Contains contract?",
	BloomFilter.contains(logBloom, contractAddr),
);
console.log(
	"- Contains Transfer event?",
	BloomFilter.contains(logBloom, transferEventSig),
);
console.log(
	"- Contains from address?",
	BloomFilter.contains(logBloom, fromAddr),
);
console.log("- Contains to address?", BloomFilter.contains(logBloom, toAddr));

// Multiple logs
console.log("\n\nMultiple Transfer logs:");
const multiLogBloom = BloomFilter.create(2048, 3);

// Simulate 5 Transfer events
for (let i = 0; i < 5; i++) {
	const from = new Uint8Array(32);
	from.set(new Uint8Array(20).fill(i + 1), 12);
	const to = new Uint8Array(32);
	to.set(new Uint8Array(20).fill(i + 10), 12);

	BloomFilter.add(multiLogBloom, contractAddr); // Same contract
	BloomFilter.add(multiLogBloom, transferEventSig); // Same event
	BloomFilter.add(multiLogBloom, from);
	BloomFilter.add(multiLogBloom, to);
}

console.log("- Added 5 Transfer logs");
console.log(
	"- Density:",
	(BloomFilter.density(multiLogBloom) * 100).toFixed(4) + "%",
);

// Filtering use case
console.log("\n\nFiltering use case:");
const searchAddr = new Uint8Array(32);
searchAddr.set(new Uint8Array(20).fill(3), 12);

console.log("- Looking for transfers involving specific address");
console.log("- Check bloom:", BloomFilter.contains(multiLogBloom, searchAddr));
console.log("  → If true: scan actual logs for matches");
console.log("  → If false: skip this transaction entirely");

// Different event type
const approvalSig = new Uint8Array(32).fill(0xab);
console.log("\n- Looking for Approval events");
console.log("- Check bloom:", BloomFilter.contains(multiLogBloom, approvalSig));
console.log("  → False means no Approval events in this transaction");
