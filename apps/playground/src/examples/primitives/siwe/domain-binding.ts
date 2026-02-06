import { Address, Siwe } from "@tevm/voltaire";
const address = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Single domain
const singleDomain = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});
const formatted = Siwe.format(singleDomain);

// Different subdomain configurations
const subdomains = [
	{ domain: "app.example.com", desc: "Application subdomain" },
	{ domain: "auth.example.com", desc: "Authentication subdomain" },
	{ domain: "api.v2.example.com", desc: "Multi-level subdomain" },
	{ domain: "staging.app.example.com", desc: "Environment subdomain" },
];

subdomains.forEach(({ domain, desc }) => {
	const message = Siwe.create({
		domain: domain,
		address: address,
		uri: `https://${domain}`,
		chainId: 1,
	});
});

// Development environments
const devDomains = [
	"localhost",
	"localhost:3000",
	"localhost:8080",
	"127.0.0.1:3000",
];

devDomains.forEach((domain) => {
	const message = Siwe.create({
		domain: domain,
		address: address,
		uri: `http://${domain}`,
		chainId: 31337, // local chain
	});
});

// Different URI structures
const domain = "example.com";

// Root path
const root = Siwe.create({
	domain: domain,
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

// Nested path
const nested = Siwe.create({
	domain: domain,
	address: address,
	uri: "https://example.com/auth/login",
	chainId: 1,
});

// With query parameters
const withQuery = Siwe.create({
	domain: domain,
	address: address,
	uri: "https://example.com/login?redirect=/dashboard&source=mobile",
	chainId: 1,
});

// With fragment
const withFragment = Siwe.create({
	domain: domain,
	address: address,
	uri: "https://example.com/login#oauth",
	chainId: 1,
});

// Matching domain and URI
const matching = Siwe.create({
	domain: "auth.example.com",
	address: address,
	uri: "https://auth.example.com/signin",
	chainId: 1,
});

// Non-matching (external resource reference)
const external = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://auth-provider.com/callback",
	chainId: 1,
});

// Different tenants on same domain
const tenants = ["tenant-a", "tenant-b", "tenant-c"];
tenants.forEach((tenant) => {
	const message = Siwe.create({
		domain: "platform.example.com",
		address: address,
		uri: `https://platform.example.com/${tenant}/auth`,
		chainId: 1,
		statement: `Sign in to ${tenant}`,
	});
});

// Different API versions
const versions = ["v1", "v2", "v3"];
versions.forEach((version) => {
	const message = Siwe.create({
		domain: "api.example.com",
		address: address,
		uri: `https://api.example.com/${version}/auth`,
		chainId: 1,
	});
});

// Different protocols
const protocols = [
	{ scheme: "https://", desc: "Secure HTTP" },
	{ scheme: "http://", desc: "HTTP (dev only)" },
	{ scheme: "ipfs://", desc: "IPFS" },
];

protocols.forEach(({ scheme, desc }) => {
	const message = Siwe.create({
		domain: "example.com",
		address: address,
		uri: `${scheme}example.com/resource`,
		chainId: 1,
	});
});

// Valid domains
const validDomains = [
	"example.com",
	"sub.example.com",
	"localhost",
	"localhost:3000",
	"app-name.example.com",
	"example.co.uk",
];

validDomains.forEach((domain) => {
	const message = Siwe.create({
		domain: domain,
		address: address,
		uri: `https://${domain}`,
		chainId: 1,
	});
	const result = Siwe.validate(message);
});

// Invalid domain (empty)
const emptyDomain = Siwe.create({
	domain: "",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

const emptyResult = Siwe.validate(emptyDomain);
if (!emptyResult.valid) {
}

// SPA with routing
const spa = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com/dashboard#/settings",
	chainId: 1,
	statement: "Sign in to access your dashboard",
});

// OAuth callback
const oauth = Siwe.create({
	domain: "auth.example.com",
	address: address,
	uri: "https://auth.example.com/callback?code=abc123&state=xyz789",
	chainId: 1,
	statement: "Authorize OAuth flow",
});

// Mobile app
const mobile = Siwe.create({
	domain: "mobile.example.com",
	address: address,
	uri: "https://mobile.example.com/deeplink?action=signin",
	chainId: 1,
	statement: "Sign in to mobile app",
});
