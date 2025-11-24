import * as Siwe from "../../../primitives/Siwe/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Example: Formatting and parsing SIWE messages (EIP-4361)

console.log("\n=== Format Basic Message ===\n");

const address = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const basic = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

const formatted = Siwe.format(basic);
console.log("Formatted message:");
console.log(formatted);

console.log("\n=== Format with Statement ===\n");

const withStatement = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com/login",
	chainId: 1,
	statement: "Sign in to access your account",
});

const formattedWithStatement = Siwe.format(withStatement);
console.log("With statement:");
console.log(formattedWithStatement);

console.log("\n=== Format with All Fields ===\n");

const full = Siwe.create({
	domain: "full.example.com",
	address: address,
	uri: "https://full.example.com",
	chainId: 137,
	statement: "Welcome to Example",
	expirationTime: "2024-12-31T23:59:59.000Z",
	notBefore: "2024-01-01T00:00:00.000Z",
	requestId: "req-abc123",
	resources: [
		"https://example.com/resource1",
		"https://example.com/resource2",
		"ipfs://QmExample",
	],
});

const formattedFull = Siwe.format(full);
console.log("Full message:");
console.log(formattedFull);

console.log("\n=== Parse Basic Message ===\n");

const messageText = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6634C0532925a3b844Bc454e4438f44e

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123xyz
Issued At: 2021-09-30T16:25:24.000Z`;

const parsed = Siwe.parse(messageText);
console.log("Parsed message:");
console.log("- Domain:", parsed.domain);
console.log("- Address:", Address.toHex(parsed.address));
console.log("- URI:", parsed.uri);
console.log("- Version:", parsed.version);
console.log("- Chain ID:", parsed.chainId);
console.log("- Nonce:", parsed.nonce);
console.log("- Issued At:", parsed.issuedAt);

console.log("\n=== Parse with Statement ===\n");

const withStatementText = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6634C0532925a3b844Bc454e4438f44e

Sign in to access your account

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123xyz
Issued At: 2021-09-30T16:25:24.000Z`;

const parsedWithStatement = Siwe.parse(withStatementText);
console.log("Statement:", parsedWithStatement.statement);

console.log("\n=== Parse with Multi-line Statement ===\n");

const multilineText = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6634C0532925a3b844Bc454e4438f44e

This is a multi-line statement.
It can contain multiple paragraphs.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123xyz
Issued At: 2021-09-30T16:25:24.000Z`;

const parsedMultiline = Siwe.parse(multilineText);
console.log("Multi-line statement:");
console.log(parsedMultiline.statement);

console.log("\n=== Parse with Resources ===\n");

const withResourcesText = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6634C0532925a3b844Bc454e4438f44e

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123xyz
Issued At: 2021-09-30T16:25:24.000Z
Resources:
- https://example.com/resource1
- https://example.com/resource2
- ipfs://QmExample`;

const parsedWithResources = Siwe.parse(withResourcesText);
console.log("Resources:");
parsedWithResources.resources?.forEach((resource, i) => {
	console.log(`  ${i + 1}. ${resource}`);
});

console.log("\n=== Roundtrip: Format → Parse ===\n");

const original = Siwe.create({
	domain: "roundtrip.example.com",
	address: address,
	uri: "https://roundtrip.example.com/auth",
	chainId: 42161,
	statement: "Test roundtrip conversion",
	nonce: "testnonceabc",
	issuedAt: "2024-01-15T12:00:00.000Z",
	resources: ["https://example.com/api"],
});

console.log("Original:");
console.log("- Domain:", original.domain);
console.log("- Chain ID:", original.chainId);
console.log("- Nonce:", original.nonce);

const formattedRoundtrip = Siwe.format(original);
const parsedRoundtrip = Siwe.parse(formattedRoundtrip);

console.log("\nAfter roundtrip:");
console.log("- Domain:", parsedRoundtrip.domain);
console.log("- Chain ID:", parsedRoundtrip.chainId);
console.log("- Nonce:", parsedRoundtrip.nonce);

console.log(
	"\nMatch:",
	original.domain === parsedRoundtrip.domain &&
		original.chainId === parsedRoundtrip.chainId &&
		original.nonce === parsedRoundtrip.nonce,
);

console.log("\n=== Parse Errors ===\n");

// Invalid domain header
try {
	const invalidHeader = `invalid header format
0x742d35Cc6634C0532925a3b844Bc454e4438f44e`;
	Siwe.parse(invalidHeader);
	console.log("Should have thrown error");
} catch (error) {
	console.log("Invalid header error:", (error as Error).message);
}

// Missing address
try {
	const missingAddress = `example.com wants you to sign in with your Ethereum account:
invalid-address`;
	Siwe.parse(missingAddress);
	console.log("Should have thrown error");
} catch (error) {
	console.log("Invalid address error:", (error as Error).message);
}

// Missing required field
try {
	const missingField = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6634C0532925a3b844Bc454e4438f44e

URI: https://example.com`;
	Siwe.parse(missingField);
	console.log("Should have thrown error");
} catch (error) {
	console.log("Missing field error:", (error as Error).message);
}

console.log("\n=== Format Edge Cases ===\n");

// Empty resources array
const emptyResources = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	resources: [],
});

const formattedEmpty = Siwe.format(emptyResources);
console.log("Empty resources array:");
console.log("- Contains 'Resources:':", formattedEmpty.includes("Resources:"));

// Special characters in statement
const specialChars = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	statement: "Sign in with special chars: @#$%^&*()",
});

const formattedSpecial = Siwe.format(specialChars);
console.log("\nSpecial characters preserved:");
console.log("- Statement:", Siwe.parse(formattedSpecial).statement);

// URI with query params and fragment
const complexUri = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com/path?query=value&other=123#fragment",
	chainId: 1,
});

const formattedComplex = Siwe.format(complexUri);
const parsedComplex = Siwe.parse(formattedComplex);
console.log("\nComplex URI preserved:");
console.log("- Original:", complexUri.uri);
console.log("- Parsed:", parsedComplex.uri);
console.log("- Match:", complexUri.uri === parsedComplex.uri);

console.log("\n=== Address Format ===\n");

// Different address formats
const addresses = [
	Address.from("0x0000000000000000000000000000000000000000"), // zero
	Address.from("0xffffffffffffffffffffffffffffffffffffffff"), // max
	Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"), // mixed
];

addresses.forEach((addr) => {
	const msg = Siwe.create({
		domain: "example.com",
		address: addr,
		uri: "https://example.com",
		chainId: 1,
	});
	const formatted = Siwe.format(msg);
	const parsed = Siwe.parse(formatted);
	const originalHex = Address.toHex(addr);
	const parsedHex = Address.toHex(parsed.address);
	console.log(
		`Address: ${originalHex.slice(0, 10)}...${originalHex.slice(-8)}`,
	);
	console.log(
		`  Match: ${originalHex.toLowerCase() === parsedHex.toLowerCase()}`,
	);
});
