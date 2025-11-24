import * as Siwe from "../../../primitives/Siwe/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Example: Computing SIWE message hashes for signing

console.log("\n=== Basic Message Hash ===\n");

const address = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const message = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

const hash = Siwe.getMessageHash(message);
console.log("Message hash:", Buffer.from(hash).toString("hex"));
console.log("Hash length:", hash.length, "bytes");
console.log("Hash type:", hash.constructor.name);

console.log("\n=== Hash Determinism ===\n");

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

console.log("Hash 1:", Buffer.from(hash1).toString("hex"));
console.log("Hash 2:", Buffer.from(hash2).toString("hex"));
console.log("Hashes match:", Buffer.from(hash1).equals(Buffer.from(hash2)));

console.log("\n=== Hash Uniqueness ===\n");

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

console.log("Hashes for different messages:");
messages.forEach((msg, i) => {
	const h = Siwe.getMessageHash(msg);
	console.log(`Message ${i + 1}: ${Buffer.from(h).toString("hex")}`);
});

console.log("\n=== Field Impact on Hash ===\n");

const baseMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	nonce: "testnonceabc",
	issuedAt: "2024-01-01T00:00:00.000Z",
});

const baseHash = Siwe.getMessageHash(baseMessage);
console.log(
	"Base hash:",
	Buffer.from(baseHash).toString("hex").slice(0, 16) + "...",
);

// Change domain
const differentDomain = { ...baseMessage, domain: "other.com" };
const domainHash = Siwe.getMessageHash(differentDomain);
console.log(
	"Different domain:",
	Buffer.from(domainHash).toString("hex").slice(0, 16) + "...",
);
console.log(
	"  Changed:",
	!Buffer.from(baseHash).equals(Buffer.from(domainHash)),
);

// Change address
const differentAddress = {
	...baseMessage,
	address: Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"),
};
const addressHash = Siwe.getMessageHash(differentAddress);
console.log(
	"Different address:",
	Buffer.from(addressHash).toString("hex").slice(0, 16) + "...",
);
console.log(
	"  Changed:",
	!Buffer.from(baseHash).equals(Buffer.from(addressHash)),
);

// Change nonce
const differentNonce = { ...baseMessage, nonce: "differentnonce" };
const nonceHash = Siwe.getMessageHash(differentNonce);
console.log(
	"Different nonce:",
	Buffer.from(nonceHash).toString("hex").slice(0, 16) + "...",
);
console.log(
	"  Changed:",
	!Buffer.from(baseHash).equals(Buffer.from(nonceHash)),
);

// Change chain ID
const differentChain = { ...baseMessage, chainId: 137 };
const chainHash = Siwe.getMessageHash(differentChain);
console.log(
	"Different chain:",
	Buffer.from(chainHash).toString("hex").slice(0, 16) + "...",
);
console.log(
	"  Changed:",
	!Buffer.from(baseHash).equals(Buffer.from(chainHash)),
);

console.log("\n=== Optional Fields Impact ===\n");

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

console.log(
	"Without statement:",
	Buffer.from(hashNoStatement).toString("hex").slice(0, 16) + "...",
);
console.log(
	"With statement:",
	Buffer.from(hashWithStatement).toString("hex").slice(0, 16) + "...",
);
console.log(
	"Hashes differ:",
	!Buffer.from(hashNoStatement).equals(Buffer.from(hashWithStatement)),
);

// Add expiration
const withExpiry = {
	...noStatement,
	expirationTime: "2024-12-31T23:59:59.000Z",
};

const hashWithExpiry = Siwe.getMessageHash(withExpiry);
console.log(
	"\nWith expiration:",
	Buffer.from(hashWithExpiry).toString("hex").slice(0, 16) + "...",
);
console.log(
	"Differs from base:",
	!Buffer.from(hashNoStatement).equals(Buffer.from(hashWithExpiry)),
);

// Add resources
const withResources = {
	...noStatement,
	resources: ["https://example.com/resource"],
};

const hashWithResources = Siwe.getMessageHash(withResources);
console.log(
	"With resources:",
	Buffer.from(hashWithResources).toString("hex").slice(0, 16) + "...",
);
console.log(
	"Differs from base:",
	!Buffer.from(hashNoStatement).equals(Buffer.from(hashWithResources)),
);

console.log("\n=== Hash Format ===\n");

const testMessage = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

const testHash = Siwe.getMessageHash(testMessage);

console.log("Hash as Uint8Array:");
console.log("- Type:", testHash.constructor.name);
console.log("- Length:", testHash.length);
console.log(
	"- First 4 bytes:",
	Array.from(testHash.slice(0, 4))
		.map((b) => "0x" + b.toString(16).padStart(2, "0"))
		.join(" "),
);

console.log("\nHash as hex string:");
const hexString = Buffer.from(testHash).toString("hex");
console.log("- Full:", hexString);
console.log("- With 0x prefix:", "0x" + hexString);

console.log("\nHash as base64:");
const base64String = Buffer.from(testHash).toString("base64");
console.log("- Encoded:", base64String);

console.log("\n=== Signing Preparation ===\n");

const signingMessage = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com/auth",
	chainId: 1,
	statement: "Sign in to access your account",
});

console.log("Message to sign:");
console.log("- Domain:", signingMessage.domain);
console.log("- Address:", Address.toHex(signingMessage.address));
console.log("- Chain:", signingMessage.chainId);

const signingHash = Siwe.getMessageHash(signingMessage);
console.log("\nHash for signing:");
console.log("- Hex:", "0x" + Buffer.from(signingHash).toString("hex"));
console.log("- Length:", signingHash.length, "bytes (256 bits)");
console.log(
	"\nThis hash would be signed with the private key corresponding to:",
);
console.log("- Address:", Address.toHex(signingMessage.address));

console.log("\n=== Hash Consistency ===\n");

// Generate multiple messages and verify hash consistency
console.log("Generating 5 hashes for same message:");
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
	console.log(`Hash ${i + 1}: ${hashes[i].slice(0, 16)}...`);
}

const allSame = hashes.every((h) => h === hashes[0]);
console.log("\nAll hashes identical:", allSame);
