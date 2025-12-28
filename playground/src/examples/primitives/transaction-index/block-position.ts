import { TransactionIndex } from "@tevm/voltaire";
const blockSize = 200;
const txIndex = TransactionIndex(50);

const position = TransactionIndex.toNumber(txIndex) + 1; // 1-based position
const percentComplete =
	(TransactionIndex.toNumber(txIndex) / (blockSize - 1)) * 100;
function categorizePosition(idx: typeof txIndex, total: number): string {
	const num = TransactionIndex.toNumber(idx);
	const percent = (num / (total - 1)) * 100;

	if (num === 0) return "FIRST";
	if (num === total - 1) return "LAST";
	if (percent < 25) return "EARLY";
	if (percent < 75) return "MIDDLE";
	return "LATE";
}

const positions = [0, 25, 50, 100, 150, 199].map((n) => TransactionIndex(n));
positions.forEach((idx) => {
	const cat = categorizePosition(idx, blockSize);
});
const block18500000Size = 172;
const sampleIndexes = [0, 43, 86, 129, 171].map((n) => TransactionIndex(n));

sampleIndexes.forEach((idx) => {
	const num = TransactionIndex.toNumber(idx);
	const pos = num + 1;
	const percent = (num / (block18500000Size - 1)) * 100;
	const cat = categorizePosition(idx, block18500000Size);
});
const ranges = [
	{ start: 0, end: 49, label: "First quarter" },
	{ start: 50, end: 99, label: "Second quarter" },
	{ start: 100, end: 149, label: "Third quarter" },
	{ start: 150, end: 199, label: "Fourth quarter" },
];

ranges.forEach((range) => {
	const count = range.end - range.start + 1;
});
function indexAtPercent(
	percent: number,
	total: number,
): ReturnType<typeof TransactionIndex.from> {
	const index = Math.floor((total - 1) * (percent / 100));
	return TransactionIndex(index);
}

const percentages = [0, 25, 50, 75, 100];
percentages.forEach((pct) => {
	const idx = indexAtPercent(pct, blockSize);
});
const reference = TransactionIndex(100);
const others = [50, 100, 150].map((n) => TransactionIndex(n));
others.forEach((idx) => {
	const num = TransactionIndex.toNumber(idx);
	const ref = TransactionIndex.toNumber(reference);
	const diff = num - ref;
	const rel =
		diff === 0
			? "same position"
			: diff < 0
				? `${Math.abs(diff)} before`
				: `${diff} after`;
});
