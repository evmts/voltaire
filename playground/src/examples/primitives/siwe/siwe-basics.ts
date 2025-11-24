import * as Siwe from "../../../primitives/Siwe/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Example: SIWE (Sign-In with Ethereum) basics

console.log("\n=== SIWE Message Creation ===\n");

// Create a basic SIWE message
const address = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const basicMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com/login",
	chainId: 1,
});

console.log("Basic message created:");
console.log("Domain:", basicMessage.domain);
console.log("Address:", Address.toHex(basicMessage.address));
console.log("URI:", basicMessage.uri);
console.log("Chain ID:", basicMessage.chainId);
console.log("Nonce:", basicMessage.nonce, "(auto-generated)");
console.log("Issued At:", basicMessage.issuedAt, "(auto-generated)");
console.log("Version:", basicMessage.version);

console.log("\n=== SIWE Message with Statement ===\n");

// Create message with optional statement
const messageWithStatement = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com/auth",
	chainId: 1,
	statement: "Sign in to access your account",
});

console.log("Statement:", messageWithStatement.statement);

console.log("\n=== SIWE Message Formatting ===\n");

// Format message to EIP-4361 text format
const formatted = Siwe.format(basicMessage);
console.log("Formatted message:");
console.log(formatted);

console.log("\n=== SIWE Message Parsing ===\n");

// Parse formatted message back
const parsed = Siwe.parse(formatted);
console.log("Parsed domain:", parsed.domain);
console.log("Parsed address:", Address.toHex(parsed.address));
console.log("Parsed chain ID:", parsed.chainId);

console.log("\n=== SIWE Message Validation ===\n");

// Validate a message
const validResult = Siwe.validate(basicMessage);
console.log("Valid message:", validResult.valid);

// Validate an invalid message
const invalidMessage = {
	...basicMessage,
	version: "2" as "1",
};
const invalidResult = Siwe.validate(invalidMessage);
console.log("Invalid message:", invalidResult.valid);
if (!invalidResult.valid) {
	console.log("Error type:", invalidResult.error.type);
	console.log("Error message:", invalidResult.error.message);
}

console.log("\n=== SIWE with Expiration ===\n");

// Create message with expiration
const expirationTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour
const messageWithExpiry = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com/login",
	chainId: 1,
	expirationTime: expirationTime,
});

console.log("Expiration time:", messageWithExpiry.expirationTime);

// Validate before expiration
const validNow = Siwe.validate(messageWithExpiry);
console.log("Valid before expiration:", validNow.valid);

// Validate after expiration (simulated future time)
const futureTime = new Date(Date.now() + 7200000); // 2 hours
const expiredResult = Siwe.validate(messageWithExpiry, { now: futureTime });
console.log("Valid after expiration:", expiredResult.valid);
if (!expiredResult.valid) {
	console.log("Error:", expiredResult.error.type);
}

console.log("\n=== SIWE Message Hash ===\n");

// Get message hash for signing
const hash = Siwe.getMessageHash(basicMessage);
console.log("Message hash:", Buffer.from(hash).toString("hex"));
console.log("Hash length:", hash.length, "bytes");
