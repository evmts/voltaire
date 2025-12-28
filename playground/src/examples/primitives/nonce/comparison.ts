import { Nonce } from "@tevm/voltaire";

// Create nonces for comparison
const nonce0 = Nonce(0);
const nonce5 = Nonce(5);
const nonce10 = Nonce(10);
const nonce10Again = Nonce(10);

const currentAccountNonce = Nonce(7);

// Test various transaction nonces
const testTxNonces = [
	{ nonce: Nonce(5), label: "Old transaction" },
	{ nonce: Nonce(7), label: "Current nonce" },
	{ nonce: Nonce(8), label: "Next nonce" },
	{ nonce: Nonce(10), label: "Future nonce" },
];

for (const tx of testTxNonces) {
	const txNum = Nonce.toNumber(tx.nonce);
	const accNum = Nonce.toNumber(currentAccountNonce);

	if (tx.nonce < currentAccountNonce) {
	} else if (tx.nonce === currentAccountNonce) {
	} else if (tx.nonce === Nonce.increment(currentAccountNonce)) {
	} else {
	}
}

const nonces = [
	Nonce(15),
	Nonce(3),
	Nonce(42),
	Nonce(8),
	Nonce(1),
];

const minNonce = nonces.reduce((min, n) => (n < min ? n : min));
const maxNonce = nonces.reduce((max, n) => (n > max ? n : max));

const unsorted = [
	Nonce(20),
	Nonce(5),
	Nonce(15),
	Nonce(1),
	Nonce(10),
];

const sorted = [...unsorted].sort((a, b) => Number(a - b));

const minAllowed = Nonce(10);
const maxAllowed = Nonce(20);

const testValues = [Nonce(5), Nonce(15), Nonce(25)];

for (const val of testValues) {
	const num = Nonce.toNumber(val);
	const inRange = val >= minAllowed && val <= maxAllowed;
}
