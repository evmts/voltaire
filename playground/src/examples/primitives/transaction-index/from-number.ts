import { TransactionIndex } from "@tevm/voltaire";
const idx0 = TransactionIndex(0);
const idx1 = TransactionIndex(1);
const idx100 = TransactionIndex(100);
const idxFromBigInt = TransactionIndex(42n);
const largeIdx = TransactionIndex(1000n);
const blockTxCount = 250; // Block has 250 transactions
const indexes = Array.from({ length: 5 }, (_, i) =>
	TransactionIndex(Math.floor((blockTxCount * i) / 4)),
);
indexes.forEach((idx, i) => {});
try {
	TransactionIndex(-1);
} catch (error) {}

try {
	TransactionIndex(3.14);
} catch (error) {}

try {
	// @ts-expect-error - testing invalid input
	TransactionIndex("42");
} catch (error) {}
