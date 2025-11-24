import * as BeaconBlockRoot from "../../../primitives/BeaconBlockRoot/index.js";

// Example: EIP-4788 ring buffer mechanics

// The BEACON_ROOTS_ADDRESS stores roots in a ring buffer
// Buffer size: 8191 slots
// Each slot stores: timestamp → root mapping

// Simulate ring buffer with timestamps
const RING_BUFFER_SIZE = 8191;
const SLOT_TIME = 12; // seconds

// Current block timestamp
const currentTime = 1710338135n; // Example: March 2024

// Recent timestamps and their roots
const recentBlocks = [
	{
		timestamp: currentTime,
		root: BeaconBlockRoot.from(
			"0x1111111111111111111111111111111111111111111111111111111111111111",
		),
	},
	{
		timestamp: currentTime - 12n,
		root: BeaconBlockRoot.from(
			"0x2222222222222222222222222222222222222222222222222222222222222222",
		),
	},
	{
		timestamp: currentTime - 24n,
		root: BeaconBlockRoot.from(
			"0x3333333333333333333333333333333333333333333333333333333333333333",
		),
	},
	{
		timestamp: currentTime - 36n,
		root: BeaconBlockRoot.from(
			"0x4444444444444444444444444444444444444444444444444444444444444444",
		),
	},
];

// Calculate ring buffer index
const getRingBufferIndex = (timestamp: bigint): bigint => {
	return timestamp % BigInt(RING_BUFFER_SIZE);
};

// Calculate how long until a timestamp is overwritten
const getTimeUntilOverwrite = (timestamp: bigint, current: bigint): bigint => {
	const slotsRemaining =
		BigInt(RING_BUFFER_SIZE) - (current - timestamp) / BigInt(SLOT_TIME);
	return slotsRemaining * BigInt(SLOT_TIME);
};

// Max age of readable roots
const MAX_AGE_SECONDS = RING_BUFFER_SIZE * SLOT_TIME; // ~27.3 hours
const MAX_AGE_HOURS = MAX_AGE_SECONDS / 3600;

console.log("=== EIP-4788 Ring Buffer ===\n");

console.log("Buffer Configuration:");
console.log("  Size:", RING_BUFFER_SIZE, "slots");
console.log("  Slot time:", SLOT_TIME, "seconds");
console.log(
	"  Max age:",
	MAX_AGE_SECONDS,
	"seconds (~",
	MAX_AGE_HOURS,
	"hours)",
);
console.log("  Storage: timestamp % 8191 → (timestamp, root)");
console.log();

console.log("Recent Blocks:");
for (const block of recentBlocks) {
	const index = getRingBufferIndex(block.timestamp);
	const age = currentTime - block.timestamp;
	console.log(`  Timestamp: ${block.timestamp}`);
	console.log(`  Age: ${age}s`);
	console.log(`  Ring index: ${index}`);
	console.log(`  Root: ${BeaconBlockRoot.toHex(block.root)}`);
	console.log();
}

console.log("Index Calculation:");
console.log("  Formula: timestamp % 8191");
console.log("  Example: 1710338135 % 8191 =", getRingBufferIndex(currentTime));
console.log("  Note: Two timestamps may map to same index!");
console.log();

console.log("Overwrite Mechanics:");
console.log("  • New block writes to index (timestamp % 8191)");
console.log("  • If slot occupied, old data is overwritten");
console.log("  • After 8191 blocks, slot 0 is reused");
console.log("  • Contract stores (timestamp, root) pair");
console.log("  • Read checks timestamp matches to prevent collisions");
console.log();

const solidityExample = `
// EIP-4788 system contract storage layout
contract BeaconRoots {
    // Ring buffer storage
    mapping(uint256 => uint256) public timestamps;  // index → timestamp
    mapping(uint256 => bytes32) public roots;       // index → root

    // Store beacon root (called at block start)
    function store(uint256 timestamp, bytes32 root) internal {
        uint256 index = timestamp % 8191;
        timestamps[index] = timestamp;
        roots[index] = root;
    }

    // Read beacon root
    function get(uint256 timestamp) external view returns (bytes32) {
        uint256 index = timestamp % 8191;

        // Verify timestamp matches (prevent collision)
        require(timestamps[index] == timestamp, "Root not found");

        return roots[index];
    }
}

// Usage in your contract
contract MyContract {
    address constant BEACON_ROOTS = 0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02;

    function getBeaconRoot(uint256 timestamp) internal view returns (bytes32) {
        // Check timestamp is not too old
        require(
            block.timestamp - timestamp <= 8191 * 12,
            "Root expired"
        );

        // Read from ring buffer
        (bool success, bytes memory data) = BEACON_ROOTS.staticcall(
            abi.encode(timestamp)
        );

        require(success, "Root not found");
        return abi.decode(data, (bytes32));
    }
}
`;

console.log("Solidity Implementation:");
console.log(solidityExample);
console.log();

console.log("Collision Prevention:");
console.log("  • Two timestamps ~8191 blocks apart map to same index");
console.log("  • Contract stores timestamp WITH root");
console.log("  • Read verifies timestamp matches stored value");
console.log("  • Mismatch means root was overwritten");
console.log();

console.log("Best Practices:");
console.log("  ✓ Always check timestamp age (<27 hours)");
console.log("  ✓ Handle 'not found' errors gracefully");
console.log("  ✓ Use recent timestamps for reliability");
console.log("  ✓ Don't rely on very old roots");
console.log("  ✓ Cache roots in your contract if needed long-term");
console.log();

console.log("Example Timeline:");
console.log("  T=0: Root A stored at index 100");
console.log("  T=1: Root B stored at index 101");
console.log("  ...");
console.log("  T=8191: Root Z stored at index 8290");
console.log("  T=8192: Root A' overwrites Root A at index 100");
console.log("  T=8193: Root B' overwrites Root B at index 101");
console.log();

console.log("Gas Costs:");
console.log("  Cold read (first access): ~2,100 gas");
console.log("  Warm read (subsequent): ~100 gas");
console.log("  Storage: 2 SLOADs (timestamp + root)");
console.log("  Total: ~2,600 gas for typical read");
