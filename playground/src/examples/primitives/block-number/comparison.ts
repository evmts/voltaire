import * as BlockNumber from "../../../primitives/BlockNumber/index.js";

const block1 = BlockNumber.from(15000000);
const block2 = BlockNumber.from(15000000);
const block3 = BlockNumber.from(15000001);

const older = BlockNumber.from(10000000);
const newer = BlockNumber.from(20000000);

const olderLessThanNewer =
	BlockNumber.toBigInt(older) < BlockNumber.toBigInt(newer);
const newerGreaterThanOlder =
	BlockNumber.toBigInt(newer) > BlockNumber.toBigInt(older);

const blocks = [
	BlockNumber.from(15537394), // The Merge
	BlockNumber.from(12965000), // London
	BlockNumber.from(17034870), // Shanghai
	BlockNumber.from(19426587), // Cancun
	BlockNumber.from(4370000), // Byzantium
];
blocks.forEach((b) => );

// Find minimum (earliest block)
let minBlock = blocks[0];
for (const block of blocks) {
	if (BlockNumber.toBigInt(block) < BlockNumber.toBigInt(minBlock)) {
		minBlock = block;
	}
}

// Find maximum (latest block)
let maxBlock = blocks[0];
for (const block of blocks) {
	if (BlockNumber.toBigInt(block) > BlockNumber.toBigInt(maxBlock)) {
		maxBlock = block;
	}
}

const unsorted = [
	BlockNumber.from(19426587),
	BlockNumber.from(12965000),
	BlockNumber.from(17034870),
	BlockNumber.from(15537394),
];
unsorted.forEach((b) => );

const sorted = [...unsorted].sort((a, b) => {
	const diff = BlockNumber.toBigInt(a) - BlockNumber.toBigInt(b);
	return diff < 0n ? -1 : diff > 0n ? 1 : 0;
});
sorted.forEach((b) => );

const target = BlockNumber.from(16000000);
const rangeStart = BlockNumber.from(15000000);
const rangeEnd = BlockNumber.from(17000000);

const inRange =
	BlockNumber.toBigInt(target) >= BlockNumber.toBigInt(rangeStart) &&
	BlockNumber.toBigInt(target) <= BlockNumber.toBigInt(rangeEnd);
