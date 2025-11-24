import * as Hardfork from "../../../primitives/Hardfork/index.js";

// Hardfork Basics - Core concepts of Ethereum hardforks

// Hardforks represent protocol upgrades in Ethereum's history
// Each fork adds new features, changes gas costs, or fixes issues

// 1. Creating hardforks from strings
const cancun = Hardfork.fromString("cancun");
const merge = Hardfork.fromString("merge");
const paris = Hardfork.fromString("paris"); // Alias for merge
const london = Hardfork.fromString("london");

console.log("Created hardforks:");
console.log("  Cancun:", cancun);
console.log("  Merge:", merge);
console.log("  Paris (alias):", paris);
console.log("  London:", london);

// 2. All available hardforks
const allForks = Hardfork.allNames();
console.log("\nAll hardforks (chronological):", allForks);
console.log(`Total hardforks: ${allForks.length}`);

// 3. Comparing hardforks
console.log("\nComparison:");
console.log(
	"  London > Berlin:",
	Hardfork.isAfter(Hardfork.LONDON, Hardfork.BERLIN),
);
console.log(
	"  Merge >= Shanghai:",
	Hardfork.isAtLeast(Hardfork.MERGE, Hardfork.SHANGHAI),
);
console.log(
	"  Cancun < Prague:",
	Hardfork.isBefore(Hardfork.CANCUN, Hardfork.PRAGUE),
);
console.log(
	"  Frontier == Frontier:",
	Hardfork.isEqual(Hardfork.FRONTIER, Hardfork.FRONTIER),
);

// 4. Feature detection
console.log("\nFeature support:");
console.log(
	"  London has EIP-1559:",
	Hardfork.hasEIP1559(Hardfork.LONDON),
);
console.log("  Shanghai has PUSH0:", Hardfork.hasEIP3855(Hardfork.SHANGHAI));
console.log("  Cancun has blobs:", Hardfork.hasEIP4844(Hardfork.CANCUN));
console.log(
	"  Cancun has transient storage:",
	Hardfork.hasEIP1153(Hardfork.CANCUN),
);

// 5. Proof of Stake detection
console.log("\nProof of Stake:");
console.log("  Merge is PoS:", Hardfork.isPostMerge(Hardfork.MERGE));
console.log(
	"  Shanghai is post-merge:",
	Hardfork.isPostMerge(Hardfork.SHANGHAI),
);
console.log("  London is pre-merge:", !Hardfork.isPostMerge(Hardfork.LONDON));

// 6. Hardfork ranges
const modernForks = Hardfork.range(Hardfork.LONDON, Hardfork.CANCUN);
console.log("\nModern era (London → Cancun):", modernForks);

// 7. Min/max operations
const latest = Hardfork.max([Hardfork.BERLIN, Hardfork.CANCUN]);
const earliest = Hardfork.min([Hardfork.LONDON, Hardfork.MERGE]);
console.log("\nMin/max:");
console.log("  Latest of Berlin/Cancun:", latest);
console.log("  Earliest of London/Merge:", earliest);

// 8. Validation
console.log("\nValidation:");
console.log("  'cancun' is valid:", Hardfork.isValidName("cancun"));
console.log("  'invalid' is valid:", Hardfork.isValidName("invalid"));
