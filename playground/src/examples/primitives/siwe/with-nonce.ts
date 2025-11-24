import * as Siwe from "../../../primitives/Siwe/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Example: Nonce handling in SIWE messages

console.log("\n=== Nonce Generation ===\n");

// Generate nonces with default length (11 characters)
console.log("Default length nonces:");
for (let i = 0; i < 5; i++) {
	const nonce = Siwe.generateNonce();
	console.log(`Nonce ${i + 1}: ${nonce} (length: ${nonce.length})`);
}

console.log("\n=== Custom Nonce Lengths ===\n");

// Generate nonces with custom lengths
const lengths = [8, 12, 16, 24, 32];
lengths.forEach((length) => {
	const nonce = Siwe.generateNonce(length);
	console.log(`Length ${length}: ${nonce}`);
});

console.log("\n=== Nonce Uniqueness ===\n");

// Test uniqueness of generated nonces
const nonces = new Set<string>();
const count = 100;
for (let i = 0; i < count; i++) {
	nonces.add(Siwe.generateNonce());
}
console.log(`Generated ${count} nonces, ${nonces.size} unique`);
console.log(
	`Collision rate: ${(((count - nonces.size) / count) * 100).toFixed(2)}%`,
);

console.log("\n=== Auto-Generated Nonces ===\n");

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

console.log("Message 1 nonce:", autoNonce1.nonce);
console.log("Message 2 nonce:", autoNonce2.nonce);
console.log("Nonces are different:", autoNonce1.nonce !== autoNonce2.nonce);

console.log("\n=== Custom Nonces ===\n");

// Use custom nonces for specific requirements
const customNonce = "session-" + Date.now();
const customMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	nonce: customNonce,
});

console.log("Custom nonce:", customMessage.nonce);

console.log("\n=== Nonce Validation ===\n");

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
	console.log(`Nonce "${nonce}": ${result.valid ? "Valid" : "Invalid"}`);
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
console.log(`Nonce "1234567": ${invalidResult.valid ? "Valid" : "Invalid"}`);
if (!invalidResult.valid) {
	console.log("Error:", invalidResult.error.message);
}

console.log("\n=== Nonce Best Practices ===\n");

// Recommended: use auto-generated nonces for maximum entropy
const recommended = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

console.log("Recommended (auto-generated):", recommended.nonce);
console.log("- High entropy");
console.log("- Cryptographically random");
console.log("- Collision resistant");

// Custom: use only when needed for session tracking
const sessionNonce = `user-${address.slice(0, 8)}-${Date.now()}`;
const sessionMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	nonce: sessionNonce,
});

console.log("\nCustom (session tracking):", sessionMessage.nonce);
console.log("- Human readable");
console.log("- Traceable");
console.log("- Application specific");

console.log("\n=== Nonce Error Handling ===\n");

// Handle nonce generation errors
try {
	const tooShort = Siwe.generateNonce(7);
	console.log("Should not reach here:", tooShort);
} catch (error) {
	console.log("Error caught:", (error as Error).message);
}

// Negative length
try {
	const negative = Siwe.generateNonce(-1);
	console.log("Should not reach here:", negative);
} catch (error) {
	console.log("Error caught:", (error as Error).message);
}
