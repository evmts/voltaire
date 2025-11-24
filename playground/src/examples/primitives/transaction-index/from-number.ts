import * as TransactionIndex from "../../../primitives/TransactionIndex/index.js";
const idx0 = TransactionIndex.from(0);
const idx1 = TransactionIndex.from(1);
const idx100 = TransactionIndex.from(100);
const idxFromBigInt = TransactionIndex.from(42n);
const largeIdx = TransactionIndex.from(1000n);
const blockTxCount = 250; // Block has 250 transactions
const indexes = Array.from({ length: 5 }, (_, i) =>
	TransactionIndex.from(Math.floor((blockTxCount * i) / 4)),
);
indexes.forEach((idx, i) => {});
try {
	TransactionIndex.from(-1);
} catch (error) {}

try {
	TransactionIndex.from(3.14);
} catch (error) {}

try {
	// @ts-expect-error - testing invalid input
	TransactionIndex.from("42");
} catch (error) {}
