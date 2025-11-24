import * as BloomFilter from "voltaire/primitives/BloomFilter";

// Block header bloom filter aggregation

console.log("\n=== Block Header Bloom ===\n");

// Block bloom contains ALL logs from ALL receipts in the block
console.log("Block with 3 transactions:\n");

// Transaction 1: 2 logs
console.log("Transaction 1 (2 logs):");
const receipt1 = BloomFilter.create(2048, 3);
const contract1 = new Uint8Array(20).fill(0x01);
const event1 = new Uint8Array(32).fill(0xaa);
const event2 = new Uint8Array(32).fill(0xbb);

BloomFilter.add(receipt1, contract1);
BloomFilter.add(receipt1, event1);
BloomFilter.add(receipt1, event2);
console.log(
	"- Density:",
	(BloomFilter.density(receipt1) * 100).toFixed(4) + "%",
);

// Transaction 2: 3 logs
console.log("\nTransaction 2 (3 logs):");
const receipt2 = BloomFilter.create(2048, 3);
const contract2 = new Uint8Array(20).fill(0x02);
const event3 = new Uint8Array(32).fill(0xcc);
const event4 = new Uint8Array(32).fill(0xdd);
const event5 = new Uint8Array(32).fill(0xee);

BloomFilter.add(receipt2, contract2);
BloomFilter.add(receipt2, event3);
BloomFilter.add(receipt2, event4);
BloomFilter.add(receipt2, event5);
console.log(
	"- Density:",
	(BloomFilter.density(receipt2) * 100).toFixed(4) + "%",
);

// Transaction 3: 1 log
console.log("\nTransaction 3 (1 log):");
const receipt3 = BloomFilter.create(2048, 3);
const contract3 = new Uint8Array(20).fill(0x03);
const event6 = new Uint8Array(32).fill(0xff);

BloomFilter.add(receipt3, contract3);
BloomFilter.add(receipt3, event6);
console.log(
	"- Density:",
	(BloomFilter.density(receipt3) * 100).toFixed(4) + "%",
);

// Aggregate into block bloom
console.log("\n\nBlock bloom (combining all receipts):");
const blockBloom = BloomFilter.combine(receipt1, receipt2, receipt3);
console.log(
	"- Density:",
	(BloomFilter.density(blockBloom) * 100).toFixed(4) + "%",
);
console.log("- Contains all 3 contracts and 6 events");

// Verify all items present
console.log("\nVerifying contents:");
console.log("- Contract 1:", BloomFilter.contains(blockBloom, contract1));
console.log("- Contract 2:", BloomFilter.contains(blockBloom, contract2));
console.log("- Contract 3:", BloomFilter.contains(blockBloom, contract3));
console.log("- Event 1:", BloomFilter.contains(blockBloom, event1));
console.log("- Event 6:", BloomFilter.contains(blockBloom, event6));

// Simulate dense block (many transactions)
console.log("\n\nDense block simulation:");
let denseBlockBloom = BloomFilter.create(2048, 3);
console.log("Adding 100 transactions with 3 logs each...");

for (let tx = 0; tx < 100; tx++) {
	const receiptBloom = BloomFilter.create(2048, 3);
	for (let log = 0; log < 3; log++) {
		const addr = new Uint8Array(20);
		addr[0] = tx;
		addr[19] = log;
		const topic = new Uint8Array(32);
		topic[0] = tx;
		topic[31] = log;
		BloomFilter.add(receiptBloom, addr);
		BloomFilter.add(receiptBloom, topic);
	}
	denseBlockBloom = BloomFilter.merge(denseBlockBloom, receiptBloom);
}

console.log(
	"- Density:",
	(BloomFilter.density(denseBlockBloom) * 100).toFixed(4) + "%",
);
const fpr = BloomFilter.expectedFalsePositiveRate(denseBlockBloom, 600); // 100 tx * 3 logs * 2 items per log
console.log("- False positive rate:", (fpr * 100).toFixed(4) + "%");

// Filtering use case
console.log("\n\nBlock filtering use case:");
const searchContract = new Uint8Array(20).fill(0x05);
console.log("- Looking for logs from specific contract across block");
console.log(
	"- Check block bloom:",
	BloomFilter.contains(blockBloom, searchContract),
);
console.log("  → If false: skip entire block");
console.log("  → If true: check each receipt bloom, then actual logs");
