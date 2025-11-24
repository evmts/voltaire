import * as BeaconBlockRoot from "../../../primitives/BeaconBlockRoot/index.js";

// Example: Beacon block root validation

// Valid roots (32 bytes)
const validRoot1 = BeaconBlockRoot.fromHex(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);
const validRoot2 = BeaconBlockRoot.fromBytes(new Uint8Array(32).fill(0x42));

// Zero root (valid but special meaning)
const zeroRoot = BeaconBlockRoot.fromBytes(new Uint8Array(32));

// All 0xff (valid but unlikely)
const maxRoot = BeaconBlockRoot.fromBytes(new Uint8Array(32).fill(0xff));

// Validation checks
const isZero = (root: ReturnType<typeof BeaconBlockRoot.from>): boolean => {
	const zero = BeaconBlockRoot.fromBytes(new Uint8Array(32));
	return BeaconBlockRoot.equals(root, zero);
};

const isSizeValid = (bytes: Uint8Array): boolean => {
	return bytes.length === BeaconBlockRoot.SIZE;
};

// Invalid inputs that would throw
const invalidInputs = [
	"Too short (31 bytes)",
	"Too long (33 bytes)",
	"Not hex string",
	"Invalid hex characters",
];

console.log("=== Beacon Block Root Validation ===\n");

console.log("Valid Roots:");
console.log("  Root 1:", BeaconBlockRoot.toHex(validRoot1));
console.log("  Root 2:", BeaconBlockRoot.toHex(validRoot2));
console.log("  Zero Root:", BeaconBlockRoot.toHex(zeroRoot));
console.log("  Max Root:", BeaconBlockRoot.toHex(maxRoot));
console.log();

console.log("Validation Checks:");
console.log("  Root 1 is zero:", isZero(validRoot1));
console.log("  Root 2 is zero:", isZero(validRoot2));
console.log("  Zero root is zero:", isZero(zeroRoot));
console.log("  Valid size (32 bytes):", isSizeValid(new Uint8Array(32)));
console.log("  Invalid size (31 bytes):", isSizeValid(new Uint8Array(31)));
console.log();

console.log("Size Requirements:");
console.log("  Expected: 32 bytes (256 bits)");
console.log("  Format: Uint8Array with length 32");
console.log("  Hex: 0x + 64 hex characters");
console.log("  Type: BeaconBlockRootType branded type");
console.log();

console.log("Invalid Inputs (would throw):");
invalidInputs.forEach((input, i) => {
	console.log(`  ${i + 1}. ${input}`);
});
console.log();

console.log("Zero Root Semantics:");
console.log("  Meaning: Genesis block or uninitialized");
console.log("  Valid: Yes (legitimate value)");
console.log("  Usage: Special case in ring buffer");
console.log("  Check: Use isZero() helper");
console.log();

console.log("Smart Contract Validation:");
const contractValidation = `
// Validate beacon root in Solidity
function isValidBeaconRoot(bytes32 root) internal pure returns (bool) {
    // Zero root is technically valid but should be handled specially
    if (root == bytes32(0)) return false; // Reject in most cases

    // All other 32-byte values are valid roots
    return true;
}

// Get and validate root from EIP-4788
function getValidatedRoot(uint256 timestamp) internal view returns (bytes32) {
    address beaconRoots = 0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02;

    (bool success, bytes memory data) = beaconRoots.staticcall(
        abi.encode(timestamp)
    );

    require(success, "Root not found in ring buffer");
    require(data.length == 32, "Invalid root size");

    bytes32 root = abi.decode(data, (bytes32));
    require(root != bytes32(0), "Zero root");

    return root;
}
`;
console.log(contractValidation);
console.log();

console.log("Common Validation Errors:");
console.log("  1. Root not in ring buffer (too old)");
console.log("     Solution: Use recent timestamp (<27 hours)");
console.log();
console.log("  2. Zero root returned");
console.log("     Solution: Check timestamp is valid");
console.log();
console.log("  3. Wrong size (not 32 bytes)");
console.log("     Solution: Validate input before creating");
console.log();
console.log("  4. Future timestamp");
console.log("     Solution: Use block.timestamp or earlier");
console.log();

console.log("Best Practices:");
console.log("  ✓ Validate size before construction");
console.log("  ✓ Check for zero root (handle specially)");
console.log("  ✓ Verify timestamp is within ring buffer");
console.log("  ✓ Use finalized roots (2+ epochs old)");
console.log("  ✓ Handle ring buffer overflow gracefully");
console.log("  ✓ Test with edge cases (zero, max values)");
