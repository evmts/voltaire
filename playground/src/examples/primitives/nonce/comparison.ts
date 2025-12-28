import { Nonce } from "voltaire";

// Create nonces for comparison
const nonce0 = Nonce.from(0);
const nonce5 = Nonce.from(5);
const nonce10 = Nonce.from(10);
const nonce10Again = Nonce.from(10);

const currentAccountNonce = Nonce.from(7);

// Test various transaction nonces
const testTxNonces = [
	{ nonce: Nonce.from(5), label: "Old transaction" },
	{ nonce: Nonce.from(7), label: "Current nonce" },
	{ nonce: Nonce.from(8), label: "Next nonce" },
	{ nonce: Nonce.from(10), label: "Future nonce" },
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
	Nonce.from(15),
	Nonce.from(3),
	Nonce.from(42),
	Nonce.from(8),
	Nonce.from(1),
];

const minNonce = nonces.reduce((min, n) => (n < min ? n : min));
const maxNonce = nonces.reduce((max, n) => (n > max ? n : max));

const unsorted = [
	Nonce.from(20),
	Nonce.from(5),
	Nonce.from(15),
	Nonce.from(1),
	Nonce.from(10),
];

const sorted = [...unsorted].sort((a, b) => Number(a - b));

const minAllowed = Nonce.from(10);
const maxAllowed = Nonce.from(20);

const testValues = [Nonce.from(5), Nonce.from(15), Nonce.from(25)];

for (const val of testValues) {
	const num = Nonce.toNumber(val);
	const inRange = val >= minAllowed && val <= maxAllowed;
}
