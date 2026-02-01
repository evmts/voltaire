import { Nonce } from "@tevm/voltaire";

// Start from zero
let nonce = Nonce(0);

// Increment once
nonce = Nonce.increment(nonce);

// Increment again
nonce = Nonce.increment(nonce);
nonce = Nonce(10);

for (let i = 0; i < 5; i++) {
	nonce = Nonce.increment(nonce);
}
let largeNonce = Nonce(999_998n);

largeNonce = Nonce.increment(largeNonce);

largeNonce = Nonce.increment(largeNonce);

largeNonce = Nonce.increment(largeNonce);
let accountNonce = Nonce(0);

const transactions = [
	"Send ETH",
	"Approve USDC",
	"Swap tokens",
	"Transfer NFT",
];

for (const tx of transactions) {
	accountNonce = Nonce.increment(accountNonce);
}
