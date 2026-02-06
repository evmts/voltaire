import { Address, Siwe } from "@tevm/voltaire";
// Create a basic SIWE message
const address = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const basicMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com/login",
	chainId: 1,
});

// Create message with optional statement
const messageWithStatement = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com/auth",
	chainId: 1,
	statement: "Sign in to access your account",
});

// Format message to EIP-4361 text format
const formatted = Siwe.format(basicMessage);

// Parse formatted message back
const parsed = Siwe.parse(formatted);

// Validate a message
const validResult = Siwe.validate(basicMessage);

// Validate an invalid message
const invalidMessage = {
	...basicMessage,
	version: "2" as "1",
};
const invalidResult = Siwe.validate(invalidMessage);
if (!invalidResult.valid) {
}

// Create message with expiration
const expirationTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour
const messageWithExpiry = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com/login",
	chainId: 1,
	expirationTime: expirationTime,
});

// Validate before expiration
const validNow = Siwe.validate(messageWithExpiry);

// Validate after expiration (simulated future time)
const futureTime = new Date(Date.now() + 7200000); // 2 hours
const expiredResult = Siwe.validate(messageWithExpiry, { now: futureTime });
if (!expiredResult.valid) {
}

// Get message hash for signing
const hash = Siwe.getMessageHash(basicMessage);
