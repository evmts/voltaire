import { BlockNumber } from "voltaire";
// Approximate block times (post-Merge: ~12 seconds)
const SECONDS_PER_BLOCK = 12n;
const BLOCKS_PER_MINUTE = 5n; // 60 / 12
const BLOCKS_PER_HOUR = BLOCKS_PER_MINUTE * 60n; // 300
const BLOCKS_PER_DAY = BLOCKS_PER_HOUR * 24n; // 7200
const BLOCKS_PER_WEEK = BLOCKS_PER_DAY * 7n; // 50400
const BLOCKS_PER_MONTH = BLOCKS_PER_DAY * 30n; // ~216000
const BLOCKS_PER_YEAR = BLOCKS_PER_DAY * 365n; // ~2628000

// Assume current block
const currentBlock = BlockNumber.from(21000000n);

const oneMinuteAgo = BlockNumber.from(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_MINUTE,
);
const tenMinutesAgo = BlockNumber.from(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_MINUTE * 10n,
);
const oneHourAgo = BlockNumber.from(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_HOUR,
);

const oneDayAgo = BlockNumber.from(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_DAY,
);
const threeDaysAgo = BlockNumber.from(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_DAY * 3n,
);
const oneWeekAgo = BlockNumber.from(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_WEEK,
);

const oneMonthAgo = BlockNumber.from(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_MONTH,
);
const threeMonthsAgo = BlockNumber.from(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_MONTH * 3n,
);
const oneYearAgo = BlockNumber.from(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_YEAR,
);

// Analyze last 24 hours in 1-hour chunks
const analysisStart = BlockNumber.from(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_DAY,
);
const analysisEnd = currentBlock;
for (let hour = 0n; hour < 6n; hour++) {
	const hourStart = BlockNumber.from(
		BlockNumber.toBigInt(analysisStart) + hour * BLOCKS_PER_HOUR,
	);
	const hourEnd = BlockNumber.from(
		BlockNumber.toBigInt(hourStart) + BLOCKS_PER_HOUR - 1n,
	);
}

// Calculate time since The Merge
const mergeBlock = BlockNumber.from(15537394);
const blocksSinceMerge =
	BlockNumber.toBigInt(currentBlock) - BlockNumber.toBigInt(mergeBlock);
const daysSinceMerge = blocksSinceMerge / BLOCKS_PER_DAY;
