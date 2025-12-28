import { BlockNumber } from "@tevm/voltaire";
// Genesis and early milestones
const genesis = BlockNumber(0);
const firstMillion = BlockNumber(1000000);
const fiveMillion = BlockNumber(5000000);
const tenMillion = BlockNumber(10000000);

const fifteenMillion = BlockNumber(15000000);
const twentyMillion = BlockNumber(20000000);
const currentHeight = BlockNumber(21000000);

// Calculate blocks until next million
const nextMilestone = BlockNumber(22000000n);
const blocksUntilNext =
	BlockNumber.toBigInt(nextMilestone) - BlockNumber.toBigInt(currentHeight);

// Estimate time (12 seconds per block)
const secondsUntilNext = blocksUntilNext * 12n;
const hoursUntilNext = secondsUntilNext / 3600n;
const daysUntilNext = hoursUntilNext / 24n;

// Blocks per time period (post-Merge: ~12 sec blocks)
const BLOCKS_PER_YEAR = 7200n * 365n; // ~2,628,000

const mergeBl = BlockNumber(15537394); // Sept 2022
const currentBl = BlockNumber(21000000); // ~Oct 2024

const blocksSinceMerge =
	BlockNumber.toBigInt(currentBl) - BlockNumber.toBigInt(mergeBl);
const yearsSinceMerge = blocksSinceMerge / BLOCKS_PER_YEAR;

// Define meaningful ranges
const ranges = [
	{ name: "Genesis Era", start: 0, end: 1000000 },
	{ name: "Early Growth", start: 1000000, end: 5000000 },
	{ name: "Pre-PoS", start: 5000000, end: 15537394 },
	{ name: "Post-Merge", start: 15537394, end: 21000000 },
];

ranges.forEach(({ name, start, end }) => {
	const startBlock = BlockNumber(start);
	const endBlock = BlockNumber(end);
	const span =
		BlockNumber.toBigInt(endBlock) - BlockNumber.toBigInt(startBlock);
});

// Check if block height is within valid range
function isValidHeight(block: BlockNumber.BlockNumberType): boolean {
	const height = BlockNumber.toBigInt(block);
	const currentMax = 21000000n; // approximate current
	return height >= 0n && height <= currentMax;
}

const testHeights = [
	BlockNumber(0),
	BlockNumber(10000000),
	BlockNumber(21000000),
	BlockNumber(25000000),
];
testHeights.forEach((h) => {});

// Create checkpoints every N blocks
const CHECKPOINT_INTERVAL = 100000n;
const base = BlockNumber(20000000);
for (let i = 0n; i < 5n; i++) {
	const checkpoint = BlockNumber(
		BlockNumber.toBigInt(base) + i * CHECKPOINT_INTERVAL,
	);
}
