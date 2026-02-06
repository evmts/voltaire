import { TransactionIndex } from "@tevm/voltaire";
const firstTx = TransactionIndex(0);

// Block 18500000 (172 transactions)
const block18500000First = TransactionIndex(0);

// Block 18500001 (157 transactions)
const block18500001First = TransactionIndex(0);

// Block 18500002 (143 transactions)
const block18500002First = TransactionIndex(0);
const transactions = [
	TransactionIndex(0),
	TransactionIndex(1),
	TransactionIndex(50),
	TransactionIndex(100),
];

transactions.forEach((tx) => {
	const num = TransactionIndex.toNumber(tx);
	const isFirst = num === 0;
});
function isFirstTransaction(idx: typeof firstTx): boolean {
	return TransactionIndex.toNumber(idx) === 0;
}
