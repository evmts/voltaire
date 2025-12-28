import { Address, Siwe } from "voltaire";
const address = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const basic = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

const formatted = Siwe.format(basic);

const withStatement = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com/login",
	chainId: 1,
	statement: "Sign in to access your account",
});

const formattedWithStatement = Siwe.format(withStatement);

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

const messageText = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6634C0532925a3b844Bc454e4438f44e

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123xyz
Issued At: 2021-09-30T16:25:24.000Z`;

const parsed = Siwe.parse(messageText);

const withStatementText = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6634C0532925a3b844Bc454e4438f44e

Sign in to access your account

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123xyz
Issued At: 2021-09-30T16:25:24.000Z`;

const parsedWithStatement = Siwe.parse(withStatementText);

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
parsedWithResources.resources?.forEach((resource, i) => {});

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

const formattedRoundtrip = Siwe.format(original);
const parsedRoundtrip = Siwe.parse(formattedRoundtrip);

// Invalid domain header
try {
	const invalidHeader = `invalid header format
0x742d35Cc6634C0532925a3b844Bc454e4438f44e`;
	Siwe.parse(invalidHeader);
} catch (error) {}

// Missing address
try {
	const missingAddress = `example.com wants you to sign in with your Ethereum account:
invalid-address`;
	Siwe.parse(missingAddress);
} catch (error) {}

// Missing required field
try {
	const missingField = `example.com wants you to sign in with your Ethereum account:
0x742d35Cc6634C0532925a3b844Bc454e4438f44e

URI: https://example.com`;
	Siwe.parse(missingField);
} catch (error) {}

// Empty resources array
const emptyResources = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	resources: [],
});

const formattedEmpty = Siwe.format(emptyResources);

// Special characters in statement
const specialChars = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
	statement: "Sign in with special chars: @#$%^&*()",
});

const formattedSpecial = Siwe.format(specialChars);

// URI with query params and fragment
const complexUri = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com/path?query=value&other=123#fragment",
	chainId: 1,
});

const formattedComplex = Siwe.format(complexUri);
const parsedComplex = Siwe.parse(formattedComplex);

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
});
