import { TransactionIndex } from "@tevm/voltaire";
const target = TransactionIndex(50);
const rangeStart = TransactionIndex(0);
const rangeEnd = TransactionIndex(100);

const inRange =
	TransactionIndex.toNumber(target) >= TransactionIndex.toNumber(rangeStart) &&
	TransactionIndex.toNumber(target) <= TransactionIndex.toNumber(rangeEnd);
const blockSize = 200;
const segmentSize = 50;
const segments = Math.ceil(blockSize / segmentSize);

for (let i = 0; i < segments; i++) {
	const start = TransactionIndex(i * segmentSize);
	const end = TransactionIndex(
		Math.min((i + 1) * segmentSize - 1, blockSize - 1),
	);
}
const iterStart = TransactionIndex(10);
const iterEnd = TransactionIndex(15);

const indexes: ReturnType<typeof TransactionIndex.from>[] = [];
for (
	let i = TransactionIndex.toNumber(iterStart);
	i <= TransactionIndex.toNumber(iterEnd);
	i++
) {
	indexes.push(TransactionIndex(i));
}
indexes.forEach((idx) => {});
const totalTxs = 180;
const early = TransactionIndex(Math.floor(totalTxs * 0.1)); // First 10%
const middle = TransactionIndex(Math.floor(totalTxs * 0.5)); // Middle
const late = TransactionIndex(Math.floor(totalTxs * 0.9)); // Last 10%
function isValidRange(
	start: typeof rangeStart,
	end: typeof rangeEnd,
	blockSize: number,
): boolean {
	const s = TransactionIndex.toNumber(start);
	const e = TransactionIndex.toNumber(end);
	return s <= e && s >= 0 && e < blockSize;
}

const validStart = TransactionIndex(10);
const validEnd = TransactionIndex(20);
const invalidStart = TransactionIndex(50);
const invalidEnd = TransactionIndex(30);
