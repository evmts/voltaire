import { TransactionIndex } from "@tevm/voltaire";
const idx1 = TransactionIndex(42);
const idx2 = TransactionIndex(42);
const idx3 = TransactionIndex(43);
const early = TransactionIndex(10);
const late = TransactionIndex(100);
const unsorted = [50, 10, 100, 25, 75].map((n) => TransactionIndex(n));

const sorted = [...unsorted].sort(
	(a, b) => TransactionIndex.toNumber(a) - TransactionIndex.toNumber(b),
);
const indexes = [42, 10, 95, 23, 67].map((n) => TransactionIndex(n));
const min = indexes.reduce((a, b) =>
	TransactionIndex.toNumber(a) < TransactionIndex.toNumber(b) ? a : b,
);
const max = indexes.reduce((a, b) =>
	TransactionIndex.toNumber(a) > TransactionIndex.toNumber(b) ? a : b,
);
const start = TransactionIndex(25);
const end = TransactionIndex(75);
const distance = Math.abs(
	TransactionIndex.toNumber(end) - TransactionIndex.toNumber(start),
);
const tx1 = TransactionIndex(0); // First
const tx2 = TransactionIndex(50); // Middle
const tx3 = TransactionIndex(99); // Last

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
