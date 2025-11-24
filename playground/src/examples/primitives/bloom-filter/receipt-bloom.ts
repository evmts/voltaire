import * as BloomFilter from "voltaire/primitives/BloomFilter";

// Transaction receipt bloom filter aggregation

console.log("\n=== Transaction Receipt Bloom ===\n");

// Receipt bloom contains ALL logs from a single transaction
console.log("Transaction with 3 event logs:\n");

// Log 1: Transfer event
console.log("Log 1: Transfer(from, to, amount)");
const log1Bloom = BloomFilter.create(2048, 3);
const contract1 = new Uint8Array(20).fill(0x01);
const transferSig = new Uint8Array(32).fill(0xaa);
const from1 = new Uint8Array(32).fill(0x10);
const to1 = new Uint8Array(32).fill(0x20);

BloomFilter.add(log1Bloom, contract1);
BloomFilter.add(log1Bloom, transferSig);
BloomFilter.add(log1Bloom, from1);
BloomFilter.add(log1Bloom, to1);
console.log(
	"- Density:",
	(BloomFilter.density(log1Bloom) * 100).toFixed(4) + "%",
);

// Log 2: Approval event
console.log("\nLog 2: Approval(owner, spender, amount)");
const log2Bloom = BloomFilter.create(2048, 3);
const contract2 = new Uint8Array(20).fill(0x01); // Same contract
const approvalSig = new Uint8Array(32).fill(0xbb);
const owner = new Uint8Array(32).fill(0x30);
const spender = new Uint8Array(32).fill(0x40);

BloomFilter.add(log2Bloom, contract2);
BloomFilter.add(log2Bloom, approvalSig);
BloomFilter.add(log2Bloom, owner);
BloomFilter.add(log2Bloom, spender);
console.log(
	"- Density:",
	(BloomFilter.density(log2Bloom) * 100).toFixed(4) + "%",
);

// Log 3: Custom event
console.log("\nLog 3: CustomEvent(data)");
const log3Bloom = BloomFilter.create(2048, 3);
const contract3 = new Uint8Array(20).fill(0x02);
const customSig = new Uint8Array(32).fill(0xcc);

BloomFilter.add(log3Bloom, contract3);
BloomFilter.add(log3Bloom, customSig);
console.log(
	"- Density:",
	(BloomFilter.density(log3Bloom) * 100).toFixed(4) + "%",
);

// Combine into receipt bloom using merge
console.log("\n\nReceipt bloom (combining all logs):");
let receiptBloom = BloomFilter.merge(log1Bloom, log2Bloom);
receiptBloom = BloomFilter.merge(receiptBloom, log3Bloom);
console.log(
	"- Density:",
	(BloomFilter.density(receiptBloom) * 100).toFixed(4) + "%",
);

// Alternative: combine multiple at once
const receiptBloom2 = BloomFilter.combine(log1Bloom, log2Bloom, log3Bloom);
console.log(
	"- Using combine():",
	(BloomFilter.density(receiptBloom2) * 100).toFixed(4) + "%",
);

// Query receipt bloom
console.log("\n\nQuerying receipt bloom:");
console.log(
	"- Contains contract1?",
	BloomFilter.contains(receiptBloom, contract1),
);
console.log(
	"- Contains contract2?",
	BloomFilter.contains(receiptBloom, contract2),
);
console.log(
	"- Contains Transfer sig?",
	BloomFilter.contains(receiptBloom, transferSig),
);
console.log(
	"- Contains Approval sig?",
	BloomFilter.contains(receiptBloom, approvalSig),
);
console.log(
	"- Contains custom sig?",
	BloomFilter.contains(receiptBloom, customSig),
);

// Filtering use case
console.log("\n\nFiltering use case:");
const targetContract = new Uint8Array(20).fill(0x01);
console.log("- Looking for logs from specific contract");
console.log(
	"- Receipt bloom contains:",
	BloomFilter.contains(receiptBloom, targetContract),
);
console.log("  → If true: examine logs in this receipt");
console.log("  → If false: skip this receipt entirely");

const unknownContract = new Uint8Array(20).fill(0xff);
console.log("\n- Looking for logs from unknown contract");
console.log(
	"- Receipt bloom contains:",
	BloomFilter.contains(receiptBloom, unknownContract),
);
console.log("  → False means definitely no logs from this contract");
