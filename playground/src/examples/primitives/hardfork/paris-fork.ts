import * as Hardfork from "../../../primitives/Hardfork/index.js";

// Paris Fork (The Merge) - Proof of Stake Transition (September 2022)

console.log("=== THE MERGE (PARIS) ===\n");

const merge = Hardfork.MERGE;
const paris = Hardfork.fromString("paris"); // Alias for merge

// The Merge was Ethereum's transition from Proof of Work to Proof of Stake
console.log("The Merge Hardfork:");
console.log("  Name (execution):", Hardfork.toString(merge));
console.log("  Name (consensus): Paris");
console.log("  Date: September 15, 2022");
console.log("  Block: 15,537,394 (mainnet)");
console.log("  Terminal Total Difficulty: 58,750,000,000,000,000,000,000\n");

// Verify paris is an alias
console.log("Paris Alias:");
console.log("  paris === merge:", Hardfork.isEqual(paris!, merge));

// Key changes
console.log("\nKey Changes:");
console.log("  1. Consensus: Proof of Work → Proof of Stake");
console.log("  2. DIFFICULTY → PREVRANDAO (opcode 0x44)");
console.log("  3. Block production by validators, not miners");
console.log("  4. Removed uncle blocks");
console.log("  5. ~99.95% energy reduction\n");

// Proof of Stake detection
console.log("Proof of Stake Detection:");
console.log("  Merge is PoS:", Hardfork.isPoS(merge));
console.log("  London is PoS:", Hardfork.isPoS(Hardfork.LONDON));
console.log("  Shanghai is PoS:", Hardfork.isPoS(Hardfork.SHANGHAI));

console.log("\nPost-Merge Detection:");
console.log("  Merge is post-merge:", Hardfork.isPostMerge(merge));
console.log("  Berlin is post-merge:", Hardfork.isPostMerge(Hardfork.BERLIN));
console.log("  Cancun is post-merge:", Hardfork.isPostMerge(Hardfork.CANCUN));

// Timeline around the merge
console.log("\nTimeline:");
const prePost = [
	{ name: "Berlin", date: "April 2021" },
	{ name: "London", date: "August 2021" },
	{ name: "Arrow Glacier", date: "December 2021" },
	{ name: "Gray Glacier", date: "June 2022" },
	{ name: "Merge", date: "September 2022" },
	{ name: "Shanghai", date: "April 2023" },
	{ name: "Cancun", date: "March 2024" },
];

prePost.forEach(({ name, date }) => {
	const fork = Hardfork.fromString(name.toLowerCase().replace(" ", ""));
	const status = fork && Hardfork.isPostMerge(fork) ? "[PoS]" : "[PoW]";
	console.log(`  ${status} ${name}: ${date}`);
});

// PREVRANDAO vs DIFFICULTY
console.log("\nPREVRANDAO Opcode:");
console.log("  Opcode: 0x44");
console.log("  Pre-merge: Returns block difficulty");
console.log("  Post-merge: Returns previous beacon chain randomness");
console.log("  Use case: On-chain randomness source");

// Validator economics
console.log("\nValidator Economics:");
console.log("  Minimum stake: 32 ETH");
console.log("  Block proposal: ~12 seconds");
console.log("  Rewards: Issuance + priority fees + MEV");
console.log("  Penalties: Slashing for misbehavior");

// Check fork relationships
console.log("\nFork Relationships:");
console.log("  Merge > London:", Hardfork.isAfter(merge, Hardfork.LONDON));
console.log("  Merge < Shanghai:", Hardfork.isBefore(merge, Hardfork.SHANGHAI));
console.log("  Last PoW fork:", Hardfork.GRAY_GLACIER);
console.log("  First PoS fork:", merge);
