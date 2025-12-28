import { Address, Siwe } from "voltaire";
for (let i = 0; i < 5; i++) {
	const nonce = Siwe.generateNonce();
}

// Generate nonces with custom lengths
const lengths = [8, 12, 16, 24, 32];
lengths.forEach((length) => {
	const nonce = Siwe.generateNonce(length);
});

// Test uniqueness of generated nonces
const nonces = new Set<string>();
const count = 100;
for (let i = 0; i < count; i++) {
	nonces.add(Siwe.generateNonce());
}

// Messages automatically generate nonces if not provided
const address = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const autoNonce1 = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

const autoNonce2 = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

// Use custom nonces for specific requirements
const customNonce = `session-${Date.now()}`;
const customMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	nonce: customNonce,
});

// Nonces must be at least 8 characters
const validNonces = [
	"12345678", // minimum length
	"abcdefghij", // alphabetic
	"abc123xyz", // alphanumeric
	"ABCD1234", // uppercase
];

validNonces.forEach((nonce) => {
	const message = Siwe.create({
		domain: "example.com",
		address: address,
		uri: "https://example.com",
		chainId: 1,
		nonce: nonce,
	});
	const result = Siwe.validate(message);
});

// Invalid nonce (too short)
const invalidMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	nonce: "1234567", // only 7 characters
});

const invalidResult = Siwe.validate(invalidMessage);
if (!invalidResult.valid) {
}

// Recommended: use auto-generated nonces for maximum entropy
const recommended = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

// Custom: use only when needed for session tracking
const sessionNonce = `user-${address.slice(0, 8)}-${Date.now()}`;
const sessionMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	nonce: sessionNonce,
});

// Handle nonce generation errors
try {
	const tooShort = Siwe.generateNonce(7);
} catch (error) {}

// Negative length
try {
	const negative = Siwe.generateNonce(-1);
} catch (error) {}
