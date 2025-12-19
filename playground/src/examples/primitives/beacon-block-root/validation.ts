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
invalidInputs.forEach((input, i) => {});
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
