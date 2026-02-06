import { BeaconBlockRoot, Bytes, Bytes32 } from "@tevm/voltaire";
// Example: Comparing beacon block roots

// Identical roots
const root1a = BeaconBlockRoot(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);
const root1b = BeaconBlockRoot(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);

// Different roots
const root2 = BeaconBlockRoot(
	"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
);
const root3 = BeaconBlockRoot(
	"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
);

// Sequential beacon roots (simulating chain progression)
const slot1000 = BeaconBlockRoot.fromBytes(Bytes32.zero().fill(0x01));
const slot1001 = BeaconBlockRoot.fromBytes(Bytes32.zero().fill(0x02));
const slot1002 = BeaconBlockRoot.fromBytes(Bytes32.zero().fill(0x03));

// Zero and max roots
const zeroRoot = BeaconBlockRoot.fromBytes(Bytes32.zero());
const maxRoot = BeaconBlockRoot.fromBytes(Bytes32.zero().fill(0xff));

// Comparison tests
const sameRoot = BeaconBlockRoot.equals(root1a, root1b);
const differentRoots = BeaconBlockRoot.equals(root1a, root2);
const sequential1 = BeaconBlockRoot.equals(slot1000, slot1001);
const sequential2 = BeaconBlockRoot.equals(slot1001, slot1002);
const zeroVsMax = BeaconBlockRoot.equals(zeroRoot, maxRoot);
const zeroVsZero = BeaconBlockRoot.equals(zeroRoot, zeroRoot);
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
