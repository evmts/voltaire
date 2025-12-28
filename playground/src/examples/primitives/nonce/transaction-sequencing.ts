import { Nonce } from "voltaire";

// Account starts with nonce 0
let accountNonce = Nonce.from(0);

// Create transaction queue
interface PendingTx {
	nonce: bigint;
	to: string;
	value: string;
	data: string;
}

const txQueue: PendingTx[] = [];

// Function to create and queue transaction
function queueTransaction(to: string, value: string, data = "0x") {
	const tx: PendingTx = {
		nonce: accountNonce,
		to,
		value,
		data,
	};
	txQueue.push(tx);
	accountNonce = Nonce.increment(accountNonce);
}
queueTransaction("0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "1.0 ETH");
queueTransaction("0xd8da6bf26964af9d7eed9e03e53415d37aa96045", "0.5 ETH");
queueTransaction("0x5aAed5930b9EB3Cd462dDbAEfA21DA757F30FbD", "2.0 ETH");
for (const tx of txQueue) {
}

const receivedTxs = [
	{ nonce: Nonce.from(2), label: "Tx 3" },
	{ nonce: Nonce.from(0), label: "Tx 1" },
	{ nonce: Nonce.from(1), label: "Tx 2" },
];
for (const tx of receivedTxs) {
}

// Sort by nonce for correct execution order
receivedTxs.sort((a, b) => Number(a.nonce - b.nonce));
for (const tx of receivedTxs) {
}

let expectedNonce = Nonce.from(0);
const incomingTxs = [
	Nonce.from(0),
	Nonce.from(1),
	Nonce.from(3), // Gap! Missing nonce 2
	Nonce.from(4),
];

for (const txNonce of incomingTxs) {
	const current = Nonce.toNumber(txNonce);
	const expected = Nonce.toNumber(expectedNonce);

	if (current === expected) {
		expectedNonce = Nonce.increment(expectedNonce);
	} else if (current > expected) {
	} else {
	}
}
