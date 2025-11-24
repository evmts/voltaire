import * as Hardfork from "../../../primitives/Hardfork/index.js";

// London Fork - EIP-1559 Fee Market Reform (August 2021)

console.log("=== LONDON HARDFORK ===\n");

const london = Hardfork.LONDON;

// London introduced EIP-1559, a major change to Ethereum's fee market
console.log("London Hardfork Features:");
console.log("  Name:", Hardfork.toString(london));
console.log("  Date: August 5, 2021");
console.log("  Block: 12,965,000 (mainnet)\n");

// Key feature: EIP-1559
console.log("EIP-1559: Fee Market Change");
console.log("  Introduced base fee mechanism");
console.log("  Added type 2 transactions (EIP-1559)");
console.log("  Burns portion of transaction fees");
console.log("  New BASEFEE opcode (0x48)\n");

// Check EIP-1559 support
console.log("EIP-1559 Support:");
console.log("  London has EIP-1559:", Hardfork.hasEIP1559(london));
console.log("  Berlin has EIP-1559:", Hardfork.hasEIP1559(Hardfork.BERLIN));
console.log("  Shanghai has EIP-1559:", Hardfork.hasEIP1559(Hardfork.SHANGHAI));

// Compare with other forks
console.log("\nComparison with other forks:");
console.log("  London > Berlin:", Hardfork.isAfter(london, Hardfork.BERLIN));
console.log("  London < Merge:", Hardfork.isBefore(london, Hardfork.MERGE));
console.log(
	"  London is at least Berlin:",
	Hardfork.isAtLeast(london, Hardfork.BERLIN),
);

// Transaction types after London
console.log("\nTransaction Types After London:");
console.log("  Type 0: Legacy transactions");
console.log("  Type 1: EIP-2930 (Access lists from Berlin)");
console.log("  Type 2: EIP-1559 (Base fee + priority fee)");

// Fee calculation
console.log("\nFee Calculation:");
console.log("  Legacy: gasPrice × gasUsed");
console.log("  EIP-1559: (baseFee + priorityFee) × gasUsed");
console.log("  Max fee: maxFeePerGas × gasUsed");
console.log("  Refund: (maxFeePerGas - baseFee - priorityFee) × gasUsed");

// Other EIPs in London
console.log("\nOther EIPs:");
console.log("  EIP-3198: BASEFEE opcode");
console.log("  EIP-3529: Reduced gas refunds");
console.log("  EIP-3541: Reject contracts starting with 0xEF");

// Check if hardfork is pre or post London
const checkLondonStatus = (fork: string) => {
	const f = Hardfork.fromString(fork);
	if (!f) return "unknown";
	return Hardfork.isAtLeast(f, london) ? "post-London" : "pre-London";
};

console.log("\nFork Status:");
console.log("  Berlin:", checkLondonStatus("berlin"));
console.log("  London:", checkLondonStatus("london"));
console.log("  Merge:", checkLondonStatus("merge"));
console.log("  Cancun:", checkLondonStatus("cancun"));
