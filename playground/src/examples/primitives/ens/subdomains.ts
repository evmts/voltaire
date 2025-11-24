import * as Ens from "../../../primitives/Ens/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: ENS subdomains and hierarchical structure

console.log("\n===== ENS Subdomains =====");

// Basic subdomain structure
console.log("\n1. Basic Subdomain Structure:");
const domain = "example.eth";
const subdomains = [
	"example.eth",
	"www.example.eth",
	"api.example.eth",
	"app.example.eth",
	"blog.example.eth",
];

console.log("\n  Domain hierarchy:");
for (const name of subdomains) {
	const hash = Ens.namehash(name);
	const depth = name.split(".").length - 1;
	const indent = "  ".repeat(depth);
	console.log(
		`${indent}${name.padEnd(24 - depth * 2)} → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}

// Deep nesting
console.log("\n2. Deep Nesting:");
const deepSubdomains = [
	"eth",
	"example.eth",
	"sub.example.eth",
	"deep.sub.example.eth",
	"very.deep.sub.example.eth",
	"extremely.very.deep.sub.example.eth",
];

for (const name of deepSubdomains) {
	const hash = Ens.namehash(name);
	const depth = name === "eth" ? 0 : name.split(".").length - 1;
	console.log(
		`  ${"  ".repeat(depth)}${name.padEnd(45 - depth * 2)} → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}

// Common subdomain patterns
console.log("\n3. Common Subdomain Patterns:");
const base = "company.eth";
const patterns = [
	{ subdomain: `www.${base}`, purpose: "Website" },
	{ subdomain: `api.${base}`, purpose: "API endpoint" },
	{ subdomain: `app.${base}`, purpose: "Application" },
	{ subdomain: `docs.${base}`, purpose: "Documentation" },
	{ subdomain: `staging.${base}`, purpose: "Staging environment" },
	{ subdomain: `prod.${base}`, purpose: "Production" },
];

for (const { subdomain, purpose } of patterns) {
	const hash = Ens.namehash(subdomain);
	console.log(
		`  ${subdomain.padEnd(25)} (${purpose.padEnd(22)}) → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}

// User subdomains
console.log("\n4. User Subdomains (like GitHub pages):");
const mainDomain = "users.eth";
const users = ["alice", "bob", "charlie", "david"];

console.log(`  Main domain: ${mainDomain}`);
for (const user of users) {
	const userDomain = `${user}.${mainDomain}`;
	const hash = Ens.namehash(userDomain);
	console.log(
		`    ${userDomain.padEnd(20)} → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}

// Environment-based subdomains
console.log("\n5. Environment-based Subdomains:");
const app = "dapp.eth";
const environments = [
	{ env: "local", subdomain: `local.${app}` },
	{ env: "dev", subdomain: `dev.${app}` },
	{ env: "staging", subdomain: `staging.${app}` },
	{ env: "prod", subdomain: app },
];

for (const { env, subdomain } of environments) {
	const hash = Ens.namehash(subdomain);
	console.log(
		`  ${env.padEnd(8)} → ${subdomain.padEnd(20)} → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}

// Subdomain independence
console.log("\n6. Subdomain Independence:");
console.log("  Each subdomain has completely independent hash:");

const parent = "domain.eth";
const child1 = "sub1.domain.eth";
const child2 = "sub2.domain.eth";

const parentHash = Ens.namehash(parent);
const child1Hash = Ens.namehash(child1);
const child2Hash = Ens.namehash(child2);

console.log(
	`    ${parent.padEnd(20)} → ${Hex.fromBytes(parentHash).slice(0, 18)}...`,
);
console.log(
	`    ${child1.padEnd(20)} → ${Hex.fromBytes(child1Hash).slice(0, 18)}...`,
);
console.log(
	`    ${child2.padEnd(20)} → ${Hex.fromBytes(child2Hash).slice(0, 18)}...`,
);
console.log(`\n  Sibling subdomains share same parent but have unique hashes`);

// Wildcard-like patterns
console.log("\n7. Wildcard-like Patterns (explicit subdomains):");
const wildcardBase = "catch.eth";
const wildcardExamples = [
	`a.${wildcardBase}`,
	`b.${wildcardBase}`,
	`anything.${wildcardBase}`,
	`test123.${wildcardBase}`,
];

console.log(`  Base: ${wildcardBase}`);
for (const name of wildcardExamples) {
	const hash = Ens.namehash(name);
	console.log(
		`    ${name.padEnd(25)} → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}
