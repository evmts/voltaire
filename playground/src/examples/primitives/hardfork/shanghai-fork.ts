import * as Hardfork from "../../../primitives/Hardfork/index.js";

// Shanghai Fork - Withdrawals & PUSH0 (April 2023)

console.log("=== SHANGHAI HARDFORK ===\n");

const shanghai = Hardfork.SHANGHAI;

// Shanghai enabled withdrawals from the Beacon Chain
console.log("Shanghai Hardfork:");
console.log("  Name:", Hardfork.toString(shanghai));
console.log("  Date: April 12, 2023");
console.log("  Block: 17,034,870 (mainnet)");
console.log("  Epoch: 194,048 (consensus)\n");

// Key feature: Withdrawals
console.log("Key Features:");
console.log("  1. Beacon Chain withdrawals enabled");
console.log("  2. EIP-3855: PUSH0 opcode");
console.log("  3. EIP-3651: Warm COINBASE");
console.log("  4. EIP-3860: Limit initcode size\n");

// PUSH0 opcode
console.log("EIP-3855: PUSH0 Opcode");
console.log("  Opcode: 0x5f");
console.log("  Function: Push 0 to stack");
console.log("  Gas cost: 2 gas");
console.log("  Benefit: More efficient than PUSH1 0x00\n");

// Check PUSH0 support
console.log("PUSH0 Support:");
console.log("  Shanghai has PUSH0:", Hardfork.hasEIP3855(shanghai));
console.log("  Merge has PUSH0:", Hardfork.hasEIP3855(Hardfork.MERGE));
console.log("  Cancun has PUSH0:", Hardfork.hasEIP3855(Hardfork.CANCUN));

// Withdrawals
console.log("\nWithdrawals:");
console.log("  Type: System-level operations");
console.log("  Source: Beacon Chain validator balance");
console.log("  Destination: Execution layer address");
console.log("  Types:");
console.log("    - Partial: Rewards above 32 ETH");
console.log("    - Full: Complete validator exit");
console.log("  Processing: Max 16 per block");

// Compare with surrounding forks
console.log("\nComparison:");
console.log("  Shanghai > Merge:", Hardfork.isAfter(shanghai, Hardfork.MERGE));
console.log("  Shanghai < Cancun:", Hardfork.isBefore(shanghai, Hardfork.CANCUN));
console.log("  Shanghai is post-merge:", Hardfork.isPostMerge(shanghai));

// Feature support inherited from previous forks
console.log("\nInherited Features:");
console.log("  EIP-1559 (London):", Hardfork.hasEIP1559(shanghai));
console.log("  Proof of Stake:", Hardfork.isPostMerge(shanghai));

// Other EIPs
console.log("\nOther EIPs:");
console.log("  EIP-3651: COINBASE warm access");
console.log("    - Reduces gas cost for COINBASE access");
console.log("    - Benefits MEV and payment processing");
console.log("");
console.log("  EIP-3860: Initcode size limit");
console.log("    - Max initcode: 49,152 bytes");
console.log("    - Gas cost: 2 per 32-byte chunk");
console.log("    - Prevents DOS attacks");

// Impact on development
console.log("\nDevelopment Impact:");
console.log("  Contract deployment:");
console.log("    - PUSH0 reduces bytecode size");
console.log("    - Cheaper to push zero values");
console.log("    - Saves gas in many operations");
console.log("");
console.log("  Validator operations:");
console.log("    - Can withdraw staking rewards");
console.log("    - Can exit and reclaim stake");
console.log("    - Completes PoS transition");

// Timeline
console.log("\nTimeline Context:");
const forks = [
	{ name: "Merge", date: "Sep 2022", months: 0 },
	{ name: "Shanghai", date: "Apr 2023", months: 7 },
	{ name: "Cancun", date: "Mar 2024", months: 11 },
];

forks.forEach(({ name, date, months }) => {
	console.log(`  ${name}: ${date} (+${months} months from merge)`);
});
