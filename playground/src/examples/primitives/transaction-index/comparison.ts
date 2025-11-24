import * as TransactionIndex from "../../../primitives/TransactionIndex/index.js";
const idx1 = TransactionIndex.from(42);
const idx2 = TransactionIndex.from(42);
const idx3 = TransactionIndex.from(43);
const early = TransactionIndex.from(10);
const late = TransactionIndex.from(100);
const unsorted = [50, 10, 100, 25, 75].map((n) => TransactionIndex.from(n));

const sorted = [...unsorted].sort(
	(a, b) => TransactionIndex.toNumber(a) - TransactionIndex.toNumber(b),
);
const indexes = [42, 10, 95, 23, 67].map((n) => TransactionIndex.from(n));
const min = indexes.reduce((a, b) =>
	TransactionIndex.toNumber(a) < TransactionIndex.toNumber(b) ? a : b,
);
const max = indexes.reduce((a, b) =>
	TransactionIndex.toNumber(a) > TransactionIndex.toNumber(b) ? a : b,
);
const start = TransactionIndex.from(25);
const end = TransactionIndex.from(75);
const distance = Math.abs(
	TransactionIndex.toNumber(end) - TransactionIndex.toNumber(start),
);
const tx1 = TransactionIndex.from(0); // First
const tx2 = TransactionIndex.from(50); // Middle
const tx3 = TransactionIndex.from(99); // Last

// Comparison helper
function compareTransactionIndexes(
	a: typeof idx1,
	b: typeof idx2,
): "before" | "after" | "same" {
	const numA = TransactionIndex.toNumber(a);
	const numB = TransactionIndex.toNumber(b);
	if (numA < numB) return "before";
	if (numA > numB) return "after";
	return "same";
}
