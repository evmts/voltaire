import { TransactionIndex } from "voltaire";
const target = TransactionIndex.from(50);
const rangeStart = TransactionIndex.from(0);
const rangeEnd = TransactionIndex.from(100);

const inRange =
	TransactionIndex.toNumber(target) >= TransactionIndex.toNumber(rangeStart) &&
	TransactionIndex.toNumber(target) <= TransactionIndex.toNumber(rangeEnd);
const blockSize = 200;
const segmentSize = 50;
const segments = Math.ceil(blockSize / segmentSize);

for (let i = 0; i < segments; i++) {
	const start = TransactionIndex.from(i * segmentSize);
	const end = TransactionIndex.from(
		Math.min((i + 1) * segmentSize - 1, blockSize - 1),
	);
}
const iterStart = TransactionIndex.from(10);
const iterEnd = TransactionIndex.from(15);

const indexes: ReturnType<typeof TransactionIndex.from>[] = [];
for (
	let i = TransactionIndex.toNumber(iterStart);
	i <= TransactionIndex.toNumber(iterEnd);
	i++
) {
	indexes.push(TransactionIndex.from(i));
}
indexes.forEach((idx) => {});
const totalTxs = 180;
const early = TransactionIndex.from(Math.floor(totalTxs * 0.1)); // First 10%
const middle = TransactionIndex.from(Math.floor(totalTxs * 0.5)); // Middle
const late = TransactionIndex.from(Math.floor(totalTxs * 0.9)); // Last 10%
function isValidRange(
	start: typeof rangeStart,
	end: typeof rangeEnd,
	blockSize: number,
): boolean {
	const s = TransactionIndex.toNumber(start);
	const e = TransactionIndex.toNumber(end);
	return s <= e && s >= 0 && e < blockSize;
}

const validStart = TransactionIndex.from(10);
const validEnd = TransactionIndex.from(20);
const invalidStart = TransactionIndex.from(50);
const invalidEnd = TransactionIndex.from(30);
