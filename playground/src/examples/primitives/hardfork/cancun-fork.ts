import * as Hardfork from "../../../primitives/Hardfork/index.js";

// Cancun Fork - Proto-Danksharding & Transient Storage (March 2024)

console.log("=== CANCUN HARDFORK ===\n");

const cancun = Hardfork.CANCUN;

// Cancun introduced major scalability features
console.log("Cancun Hardfork:");
console.log("  Name:", Hardfork.toString(cancun));
console.log("  Date: March 13, 2024");
console.log("  Block: 19,426,587 (mainnet)");
console.log("  Epoch: 269,568 (consensus)\n");

// Key features
console.log("Major Features:");
console.log("  1. EIP-4844: Proto-Danksharding (blobs)");
console.log("  2. EIP-1153: Transient storage");
console.log("  3. EIP-5656: MCOPY opcode");
console.log("  4. EIP-6780: SELFDESTRUCT changes\n");

// EIP-4844: Blob transactions
console.log("EIP-4844: Proto-Danksharding");
console.log("  Purpose: Cheaper L2 data availability");
console.log("  Blob size: 128 KB (4096 field elements)");
console.log("  Max blobs per block: 6 (target: 3)");
console.log("  Blob lifetime: ~18 days");
console.log("  Transaction type: Type 3 (blob transaction)");
console.log("  Cost: Separate blob gas market");
console.log("  Impact: 10-100x cheaper L2 transactions\n");

// Check blob support
console.log("Blob Support:");
console.log("  Cancun has blobs:", Hardfork.hasEIP4844(cancun));
console.log("  Shanghai has blobs:", Hardfork.hasEIP4844(Hardfork.SHANGHAI));
console.log("  Prague has blobs:", Hardfork.hasEIP4844(Hardfork.PRAGUE));

// New opcodes
console.log("\nNew Opcodes:");
console.log("  BLOBHASH (0x49): Get blob versioned hash");
console.log("  BLOBBASEFEE (0x4a): Get current blob base fee");

// EIP-1153: Transient storage
console.log("\nEIP-1153: Transient Storage");
console.log("  Purpose: Temporary storage within transaction");
console.log("  Lifetime: Cleared after transaction");
console.log("  Gas cost: Cheaper than SSTORE/SLOAD");
console.log("  Use cases:");
console.log("    - Reentrancy locks");
console.log("    - Flash loan intermediates");
console.log("    - Cross-contract calls");
console.log("    - Gas optimization\n");

// Check transient storage support
console.log("Transient Storage Support:");
console.log(
	"  Cancun has transient storage:",
	Hardfork.hasEIP1153(cancun),
);
console.log(
	"  Shanghai has transient storage:",
	Hardfork.hasEIP1153(Hardfork.SHANGHAI),
);

// Transient storage opcodes
console.log("\nTransient Storage Opcodes:");
console.log("  TLOAD (0x5c): Load from transient storage");
console.log("    Gas cost: 100 gas");
console.log("  TSTORE (0x5d): Store to transient storage");
console.log("    Gas cost: 100 gas");
console.log("  Compare SLOAD: 2,100 gas (warm)");
console.log("  Compare SSTORE: 2,900-20,000 gas");

// EIP-5656: MCOPY
console.log("\nEIP-5656: MCOPY Opcode");
console.log("  Opcode: 0x5e");
console.log("  Function: Copy memory areas");
console.log("  Gas cost: 3 + 3×words + memory expansion");
console.log("  Benefit: More efficient than loop copying");

// EIP-6780: SELFDESTRUCT changes
console.log("\nEIP-6780: SELFDESTRUCT Restriction");
console.log("  Old behavior: Destroys contract, sends balance");
console.log("  New behavior: Only sends balance");
console.log("  Exception: Same transaction as creation");
console.log("  Reason: State growth, security concerns");

// Feature comparison
console.log("\nAll Cancun Features:");
console.log("  EIP-1559:", Hardfork.hasEIP1559(cancun));
console.log("  PUSH0:", Hardfork.hasEIP3855(cancun));
console.log("  Blobs:", Hardfork.hasEIP4844(cancun));
console.log("  Transient storage:", Hardfork.hasEIP1153(cancun));
console.log("  Post-merge:", Hardfork.isPostMerge(cancun));

// Impact on ecosystem
console.log("\nEcosystem Impact:");
console.log("  L2 Rollups:");
console.log("    - Dramatically reduced costs");
console.log("    - Increased throughput");
console.log("    - Better data availability");
console.log("");
console.log("  Smart Contracts:");
console.log("    - More efficient storage patterns");
console.log("    - Cheaper reentrancy protection");
console.log("    - New optimization strategies");

// Compare with other major forks
console.log("\nMajor Fork Comparison:");
console.log("  London (EIP-1559): Fee market reform");
console.log("  Merge (Paris): Proof of Stake");
console.log("  Shanghai: Withdrawals + PUSH0");
console.log("  Cancun: Scalability + efficiency");
