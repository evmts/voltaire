import * as Address from "../../../primitives/Address/index.js";
import * as Siwe from "../../../primitives/Siwe/index.js";

const address = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const message = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

const hash = Siwe.getMessageHash(message);

// Same message should produce same hash
const message1 = Siwe.create({
	domain: "test.com",
	address: address,
	uri: "https://test.com",
	chainId: 1,
	nonce: "samenonce123",
	issuedAt: "2024-01-01T00:00:00.000Z",
});

const message2 = Siwe.create({
	domain: "test.com",
	address: address,
	uri: "https://test.com",
	chainId: 1,
	nonce: "samenonce123",
	issuedAt: "2024-01-01T00:00:00.000Z",
});

const hash1 = Siwe.getMessageHash(message1);
const hash2 = Siwe.getMessageHash(message2);

// Different messages produce different hashes
const messages = [
	Siwe.create({
		domain: "example.com",
		address: address,
		uri: "https://example.com",
		chainId: 1,
	}),
	Siwe.create({
		domain: "different.com",
		address: address,
		uri: "https://different.com",
		chainId: 1,
	}),
	Siwe.create({
		domain: "example.com",
		address: address,
		uri: "https://example.com",
		chainId: 137, // different chain
	}),
];
messages.forEach((msg, i) => {
	const h = Siwe.getMessageHash(msg);
});

const baseMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	nonce: "testnonceabc",
	issuedAt: "2024-01-01T00:00:00.000Z",
});

const baseHash = Siwe.getMessageHash(baseMessage);

// Change domain
const differentDomain = { ...baseMessage, domain: "other.com" };
const domainHash = Siwe.getMessageHash(differentDomain);

// Change address
const differentAddress = {
	...baseMessage,
	address: Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
};
const addressHash = Siwe.getMessageHash(differentAddress);

// Change nonce
const differentNonce = { ...baseMessage, nonce: "differentnonce" };
const nonceHash = Siwe.getMessageHash(differentNonce);

// Change chain ID
const differentChain = { ...baseMessage, chainId: 137 };
const chainHash = Siwe.getMessageHash(differentChain);

// Message without statement
const noStatement = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	nonce: "testnonce",
	issuedAt: "2024-01-01T00:00:00.000Z",
});

// Message with statement
const withStatement = {
	...noStatement,
	statement: "Sign in to Example",
};

const hashNoStatement = Siwe.getMessageHash(noStatement);
const hashWithStatement = Siwe.getMessageHash(withStatement);

// Add expiration
const withExpiry = {
	...noStatement,
	expirationTime: "2024-12-31T23:59:59.000Z",
};

const hashWithExpiry = Siwe.getMessageHash(withExpiry);

// Add resources
const withResources = {
	...noStatement,
	resources: ["https://example.com/resource"],
};

const hashWithResources = Siwe.getMessageHash(withResources);

const testMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

const testHash = Siwe.getMessageHash(testMessage);
const hexString = Buffer.from(testHash).toString("hex");
const base64String = Buffer.from(testHash).toString("base64");

const signingMessage = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com/auth",
	chainId: 1,
	statement: "Sign in to access your account",
});

const signingHash = Siwe.getMessageHash(signingMessage);
const consistentMessage = Siwe.create({
	domain: "test.com",
	address: address,
	uri: "https://test.com",
	chainId: 1,
	nonce: "consistentnonce",
	issuedAt: "2024-01-01T00:00:00.000Z",
});

const hashes = [];
for (let i = 0; i < 5; i++) {
	const h = Siwe.getMessageHash(consistentMessage);
	hashes.push(Buffer.from(h).toString("hex"));
}

const allSame = hashes.every((h) => h === hashes[0]);
