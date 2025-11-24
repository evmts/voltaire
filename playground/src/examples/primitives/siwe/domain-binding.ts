import * as Siwe from "../../../primitives/Siwe/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Example: Domain binding and URI patterns in SIWE

console.log("\n=== Domain Binding ===\n");

const address = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Single domain
const singleDomain = Siwe.create({
	domain: "example.com",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

console.log("Single domain:", singleDomain.domain);
console.log("Formatted:");
const formatted = Siwe.format(singleDomain);
console.log(formatted.split("\n")[0]); // First line shows domain

console.log("\n=== Subdomain Patterns ===\n");

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
	console.log(`${desc}: ${message.domain}`);
});

console.log("\n=== Localhost Development ===\n");

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
	console.log(`Dev domain: ${message.domain}`);
});

console.log("\n=== URI Patterns ===\n");

// Different URI structures
const domain = "example.com";

// Root path
const root = Siwe.create({
	domain: domain,
	address: address,
	uri: "https://example.com",
	chainId: 1,
});
console.log("Root URI:", root.uri);

// Nested path
const nested = Siwe.create({
	domain: domain,
	address: address,
	uri: "https://example.com/auth/login",
	chainId: 1,
});
console.log("Nested URI:", nested.uri);

// With query parameters
const withQuery = Siwe.create({
	domain: domain,
	address: address,
	uri: "https://example.com/login?redirect=/dashboard&source=mobile",
	chainId: 1,
});
console.log("URI with query:", withQuery.uri);

// With fragment
const withFragment = Siwe.create({
	domain: domain,
	address: address,
	uri: "https://example.com/login#oauth",
	chainId: 1,
});
console.log("URI with fragment:", withFragment.uri);

console.log("\n=== Domain-URI Relationship ===\n");

// Matching domain and URI
const matching = Siwe.create({
	domain: "auth.example.com",
	address: address,
	uri: "https://auth.example.com/signin",
	chainId: 1,
});

console.log("Domain:", matching.domain);
console.log("URI:", matching.uri);
console.log("Match:", matching.uri.includes(matching.domain));

// Non-matching (external resource reference)
const external = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://auth-provider.com/callback",
	chainId: 1,
});

console.log("\nDomain:", external.domain);
console.log("URI:", external.uri);
console.log("Match:", external.uri.includes(external.domain));

console.log("\n=== Multi-Tenant Architecture ===\n");

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
	console.log(`Tenant: ${tenant}`);
	console.log(`  URI: ${message.uri}`);
	console.log(`  Statement: ${message.statement}`);
});

console.log("\n=== API Versioning ===\n");

// Different API versions
const versions = ["v1", "v2", "v3"];
versions.forEach((version) => {
	const message = Siwe.create({
		domain: "api.example.com",
		address: address,
		uri: `https://api.example.com/${version}/auth`,
		chainId: 1,
	});
	console.log(`${version}: ${message.uri}`);
});

console.log("\n=== Protocol Schemes ===\n");

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
	console.log(`${desc}: ${message.uri}`);
});

console.log("\n=== Domain Validation ===\n");

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
	console.log(`${domain}: ${result.valid ? "Valid" : "Invalid"}`);
});

// Invalid domain (empty)
const emptyDomain = Siwe.create({
	domain: "",
	address: address,
	uri: "https://example.com",
	chainId: 1,
});

const emptyResult = Siwe.validate(emptyDomain);
console.log(`Empty domain: ${emptyResult.valid ? "Valid" : "Invalid"}`);
if (!emptyResult.valid) {
	console.log("Error:", emptyResult.error.message);
}

console.log("\n=== Real-World Scenarios ===\n");

// SPA with routing
const spa = Siwe.create({
	domain: "app.example.com",
	address: address,
	uri: "https://app.example.com/dashboard#/settings",
	chainId: 1,
	statement: "Sign in to access your dashboard",
});

console.log("SPA scenario:");
console.log("- Domain:", spa.domain);
console.log("- URI:", spa.uri);
console.log("- Statement:", spa.statement);

// OAuth callback
const oauth = Siwe.create({
	domain: "auth.example.com",
	address: address,
	uri: "https://auth.example.com/callback?code=abc123&state=xyz789",
	chainId: 1,
	statement: "Authorize OAuth flow",
});

console.log("\nOAuth scenario:");
console.log("- Domain:", oauth.domain);
console.log("- URI:", oauth.uri);

// Mobile app
const mobile = Siwe.create({
	domain: "mobile.example.com",
	address: address,
	uri: "https://mobile.example.com/deeplink?action=signin",
	chainId: 1,
	statement: "Sign in to mobile app",
});

console.log("\nMobile scenario:");
console.log("- Domain:", mobile.domain);
console.log("- URI:", mobile.uri);
