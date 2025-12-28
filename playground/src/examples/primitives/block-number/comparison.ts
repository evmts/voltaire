import { BlockNumber } from "@tevm/voltaire";
const block1 = BlockNumber(15000000);
const block2 = BlockNumber(15000000);
const block3 = BlockNumber(15000001);

const older = BlockNumber(10000000);
const newer = BlockNumber(20000000);

const olderLessThanNewer =
	BlockNumber.toBigInt(older) < BlockNumber.toBigInt(newer);
const newerGreaterThanOlder =
	BlockNumber.toBigInt(newer) > BlockNumber.toBigInt(older);

const blocks = [
	BlockNumber(15537394), // The Merge
	BlockNumber(12965000), // London
	BlockNumber(17034870), // Shanghai
	BlockNumber(19426587), // Cancun
	BlockNumber(4370000), // Byzantium
];
blocks.forEach((b) => console.log(BlockNumber.toNumber(b)));

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
	BlockNumber(19426587),
	BlockNumber(12965000),
	BlockNumber(17034870),
	BlockNumber(15537394),
];
unsorted.forEach((b) => console.log(BlockNumber.toNumber(b)));

const sorted = [...unsorted].sort((a, b) => {
	const diff = BlockNumber.toBigInt(a) - BlockNumber.toBigInt(b);
	return diff < 0n ? -1 : diff > 0n ? 1 : 0;
});
sorted.forEach((b) => console.log(BlockNumber.toNumber(b)));

const target = BlockNumber(16000000);
const rangeStart = BlockNumber(15000000);
const rangeEnd = BlockNumber(17000000);

const inRange =
	BlockNumber.toBigInt(target) >= BlockNumber.toBigInt(rangeStart) &&
	BlockNumber.toBigInt(target) <= BlockNumber.toBigInt(rangeEnd);
