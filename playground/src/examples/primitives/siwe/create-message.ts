import * as Siwe from "../../../primitives/Siwe/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Example: Creating SIWE messages with various configurations

console.log("\n=== Minimal SIWE Message ===\n");

// Minimal message with required fields only
const address = Address.from("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
const minimal = Siwe.create({
	domain: "minimal.example.com",
	address: address,
	uri: "https://minimal.example.com",
	chainId: 1,
});

console.log("Required fields:");
console.log("- Domain:", minimal.domain);
console.log("- Address:", Address.toHex(minimal.address));
console.log("- URI:", minimal.uri);
console.log("- Chain ID:", minimal.chainId);
console.log("- Version:", minimal.version);
console.log("- Nonce:", minimal.nonce);
console.log("- Issued At:", minimal.issuedAt);

console.log("\n=== Full SIWE Message ===\n");

// Message with all optional fields
const full = Siwe.create({
	domain: "full.example.com",
	address: address,
	uri: "https://full.example.com/auth",
	chainId: 137, // Polygon
	statement:
		"Welcome! Sign this message to authenticate with your Ethereum account.",
	expirationTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour
	notBefore: new Date().toISOString(),
	requestId: "req-" + Date.now(),
	resources: [
		"https://api.example.com/user",
		"https://api.example.com/profile",
	],
	nonce: "customnonce123",
	issuedAt: new Date().toISOString(),
});

console.log("All fields:");
console.log("- Domain:", full.domain);
console.log("- Address:", Address.toHex(full.address));
console.log("- Statement:", full.statement);
console.log("- URI:", full.uri);
console.log("- Version:", full.version);
console.log("- Chain ID:", full.chainId);
console.log("- Nonce:", full.nonce);
console.log("- Issued At:", full.issuedAt);
console.log("- Expiration Time:", full.expirationTime);
console.log("- Not Before:", full.notBefore);
console.log("- Request ID:", full.requestId);
console.log("- Resources:", full.resources);

console.log("\n=== Different Chains ===\n");

// Messages for different chains
const chains = [
	{ name: "Ethereum Mainnet", chainId: 1 },
	{ name: "Polygon", chainId: 137 },
	{ name: "Arbitrum", chainId: 42161 },
	{ name: "Optimism", chainId: 10 },
	{ name: "Base", chainId: 8453 },
];

chains.forEach(({ name, chainId }) => {
	const message = Siwe.create({
		domain: "multichain.example.com",
		address: address,
		uri: "https://multichain.example.com",
		chainId: chainId,
	});
	console.log(`${name} (${chainId}):`, message.chainId);
});

console.log("\n=== Custom Domains ===\n");

// Messages with different domain types
const domains = [
	"example.com",
	"app.example.com",
	"auth.subdomain.example.com",
	"localhost:3000",
];

domains.forEach((domain) => {
	const message = Siwe.create({
		domain: domain,
		address: address,
		uri: `https://${domain}/login`,
		chainId: 1,
	});
	console.log(`Domain: ${message.domain}`);
});

console.log("\n=== Different URI Patterns ===\n");

// Messages with various URI formats
const uris = [
	"https://example.com",
	"https://example.com/login",
	"https://example.com/auth?redirect=/dashboard",
	"https://example.com/login#section",
	"http://localhost:3000/auth",
];

uris.forEach((uri) => {
	const message = Siwe.create({
		domain: "example.com",
		address: address,
		uri: uri,
		chainId: 1,
	});
	console.log(`URI: ${message.uri}`);
});
