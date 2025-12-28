import { Address, Siwe } from "@tevm/voltaire";
// Minimal message with required fields only
const address = Address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
const minimal = Siwe.create({
	domain: "minimal.example.com",
	address: address,
	uri: "https://minimal.example.com",
	chainId: 1,
});

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
	requestId: `req-${Date.now()}`,
	resources: [
		"https://api.example.com/user",
		"https://api.example.com/profile",
	],
	nonce: "customnonce123",
	issuedAt: new Date().toISOString(),
});

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
});

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
});

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
});
