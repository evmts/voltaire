import { BlockNumber } from "@tevm/voltaire";
// Define a range (e.g., for getLogs queries)
const startBlock = BlockNumber(20000000);
const endBlock = BlockNumber(20001000);

const rangeSize =
	BlockNumber.toBigInt(endBlock) - BlockNumber.toBigInt(startBlock);

// Split large range into chunks (common for RPC rate limiting)
const queryStart = BlockNumber(19000000);
const queryEnd = BlockNumber(19010000);
const chunkSize = 1000n;

const totalRange =
	BlockNumber.toBigInt(queryEnd) - BlockNumber.toBigInt(queryStart);
const numChunks = totalRange / chunkSize;
for (let i = 0n; i < 5n; i++) {
	const chunkStart = BlockNumber(
		BlockNumber.toBigInt(queryStart) + i * chunkSize,
	);
	const chunkEnd = BlockNumber(
		BlockNumber.toBigInt(queryStart) + (i + 1n) * chunkSize - 1n,
	);
}

// Average block time: ~12 seconds
const BLOCKS_PER_MINUTE = 5n;
const BLOCKS_PER_HOUR = BLOCKS_PER_MINUTE * 60n;
const BLOCKS_PER_DAY = BLOCKS_PER_HOUR * 24n;
const BLOCKS_PER_WEEK = BLOCKS_PER_DAY * 7n;

const currentBlock = BlockNumber(21000000n);

// Look back various time periods
const oneHourAgo = BlockNumber(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_HOUR,
);
const oneDayAgo = BlockNumber(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_DAY,
);
const oneWeekAgo = BlockNumber(
	BlockNumber.toBigInt(currentBlock) - BLOCKS_PER_WEEK,
);

const validStart = BlockNumber(15000000);
const validEnd = BlockNumber(15001000);

const isValidRange =
	BlockNumber.toBigInt(validEnd) > BlockNumber.toBigInt(validStart);
