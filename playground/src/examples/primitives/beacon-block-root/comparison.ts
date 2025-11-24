import * as BeaconBlockRoot from "../../../primitives/BeaconBlockRoot/index.js";

// Example: Comparing beacon block roots

// Identical roots
const root1a = BeaconBlockRoot.from(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);
const root1b = BeaconBlockRoot.from(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);

// Different roots
const root2 = BeaconBlockRoot.from(
	"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
);
const root3 = BeaconBlockRoot.from(
	"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
);

// Sequential beacon roots (simulating chain progression)
const slot1000 = BeaconBlockRoot.fromBytes(new Uint8Array(32).fill(0x01));
const slot1001 = BeaconBlockRoot.fromBytes(new Uint8Array(32).fill(0x02));
const slot1002 = BeaconBlockRoot.fromBytes(new Uint8Array(32).fill(0x03));

// Zero and max roots
const zeroRoot = BeaconBlockRoot.fromBytes(new Uint8Array(32));
const maxRoot = BeaconBlockRoot.fromBytes(new Uint8Array(32).fill(0xff));

// Comparison tests
const sameRoot = BeaconBlockRoot.equals(root1a, root1b);
const differentRoots = BeaconBlockRoot.equals(root1a, root2);
const sequential1 = BeaconBlockRoot.equals(slot1000, slot1001);
const sequential2 = BeaconBlockRoot.equals(slot1001, slot1002);
const zeroVsMax = BeaconBlockRoot.equals(zeroRoot, maxRoot);
const zeroVsZero = BeaconBlockRoot.equals(zeroRoot, zeroRoot);

console.log("=== Beacon Block Root Comparison ===\n");

console.log("Identical Roots:");
console.log("  Root 1a:", BeaconBlockRoot.toHex(root1a));
console.log("  Root 1b:", BeaconBlockRoot.toHex(root1b));
console.log("  Equal:", sameRoot);
console.log();

console.log("Different Roots:");
console.log("  Root 1:", BeaconBlockRoot.toHex(root1a));
console.log("  Root 2:", BeaconBlockRoot.toHex(root2));
console.log("  Equal:", differentRoots);
console.log();

console.log("Chain Progression:");
console.log("  Slot 1000:", BeaconBlockRoot.toHex(slot1000));
console.log("  Slot 1001:", BeaconBlockRoot.toHex(slot1001));
console.log("  Slot 1002:", BeaconBlockRoot.toHex(slot1002));
console.log("  1000 == 1001:", sequential1);
console.log("  1001 == 1002:", sequential2);
console.log();

console.log("Edge Cases:");
console.log("  Zero Root:", BeaconBlockRoot.toHex(zeroRoot));
console.log("  Max Root:", BeaconBlockRoot.toHex(maxRoot));
console.log("  Zero == Max:", zeroVsMax);
console.log("  Zero == Zero:", zeroVsZero);
console.log();

console.log("Equality Semantics:");
console.log("  • Byte-by-byte comparison");
console.log("  • All 32 bytes must match exactly");
console.log("  • Case-insensitive (hex is normalized)");
console.log("  • No special treatment for zero/max");
console.log();

console.log("Use Cases for Comparison:");
console.log("  1. Verify root matches expected value");
console.log("  2. Check if block is reorg'd (root changed)");
console.log("  3. Deduplicate roots in data structures");
console.log("  4. Validate Merkle proof consistency");
console.log("  5. Track beacon chain forks");
console.log();

console.log("Solidity Comparison:");
const solidityExample = `
// Compare beacon roots in Solidity
function verifyExpectedRoot(
    uint256 timestamp,
    bytes32 expectedRoot
) external view returns (bool) {
    address beaconRoots = 0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02;

    (bool success, bytes memory data) = beaconRoots.staticcall(
        abi.encode(timestamp)
    );

    require(success, "Root not found");
    bytes32 actualRoot = abi.decode(data, (bytes32));

    return actualRoot == expectedRoot;
}

// Track multiple roots for reorg detection
mapping(uint256 => bytes32) public observedRoots;

function trackRoot(uint256 slot) external {
    bytes32 root = getBeaconRoot(block.timestamp);
    bytes32 previous = observedRoots[slot];

    if (previous != bytes32(0) && previous != root) {
        emit ReorgDetected(slot, previous, root);
    }

    observedRoots[slot] = root;
}
`;
console.log(solidityExample);
console.log();

console.log("Performance:");
console.log("  TypeScript: O(32) byte comparison");
console.log("  Solidity: O(1) bytes32 comparison");
console.log("  Gas Cost: ~3 gas (EQ opcode)");
console.log("  Optimized: Compiler inlines comparison");
