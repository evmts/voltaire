import * as Ens from "../../../primitives/Ens/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: Famous ENS names and their namehashes

console.log("\n===== Famous ENS Names =====");

// Ethereum Foundation and core devs
console.log("\n1. Ethereum Foundation & Core Developers:");
const ethFoundation = [
	{ name: "vitalik.eth", desc: "Vitalik Buterin - Ethereum founder" },
	{ name: "nick.eth", desc: "Nick Johnson - ENS creator" },
	{ name: "brantly.eth", desc: "Brantly Millegan - Former ENS director" },
];

for (const { name, desc } of ethFoundation) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
	console.log(`\n  ${name}`);
	console.log(`    ${desc}`);
	console.log(`    Namehash: ${Hex.fromBytes(hash)}`);
}

// ENS system domains
console.log("\n2. ENS System Domains:");
const systemDomains = [
	{ name: "eth", desc: "Root TLD for Ethereum Name Service" },
	{ name: "reverse", desc: "Reverse resolution namespace" },
	{ name: "addr.reverse", desc: "Reverse address lookup" },
];

for (const { name, desc } of systemDomains) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
	console.log(`\n  ${name}`);
	console.log(`    ${desc}`);
	console.log(`    Namehash: ${Hex.fromBytes(hash)}`);
}

// Notable projects
console.log("\n3. Notable Projects:");
const projects = [
	{ name: "dao.eth", desc: "The DAO" },
	{ name: "uniswap.eth", desc: "Uniswap protocol" },
	{ name: "ens.eth", desc: "ENS Protocol" },
	{ name: "ethereum.eth", desc: "Ethereum" },
];

for (const { name, desc } of projects) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
	console.log(
		`  ${name.padEnd(16)} (${desc.padEnd(20)}) → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}

// Common name patterns
console.log("\n4. Common Name Patterns:");
const patterns = [
	{ name: "app.eth", desc: "Application domains" },
	{ name: "nft.eth", desc: "NFT projects" },
	{ name: "dao.eth", desc: "DAO organizations" },
	{ name: "defi.eth", desc: "DeFi protocols" },
	{ name: "web3.eth", desc: "Web3 projects" },
];

for (const { name, desc } of patterns) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
	console.log(
		`  ${name.padEnd(12)} (${desc.padEnd(22)}) → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}

// Short valuable names (3-4 characters)
console.log("\n5. Short & Valuable Names:");
const shortNames = [
	"abc.eth",
	"btc.eth",
	"nft.eth",
	"dao.eth",
	"eth.eth",
	"web.eth",
];

for (const name of shortNames) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
	console.log(`  ${name.padEnd(12)} → ${Hex.fromBytes(hash).slice(0, 18)}...`);
}

// Name variants (case sensitivity check)
console.log("\n6. Name Variants (Normalization):");
const variants = [
	["vitalik.eth", "VITALIK.eth", "Vitalik.ETH"],
	["uniswap.eth", "UNISWAP.eth", "UniSwap.ETH"],
	["dao.eth", "DAO.eth", "Dao.ETH"],
];

for (const [lower, upper, mixed] of variants) {
	console.log(`\n  Variants of "${lower}":`);

	const lowerNorm = Ens.normalize(lower);
	const upperNorm = Ens.normalize(upper);
	const mixedNorm = Ens.normalize(mixed);

	const lowerHash = Ens.namehash(lowerNorm);
	const upperHash = Ens.namehash(upperNorm);
	const mixedHash = Ens.namehash(mixedNorm);

	console.log(
		`    ${lower.padEnd(15)} → ${lowerNorm.padEnd(15)} → ${Hex.fromBytes(lowerHash).slice(0, 18)}...`,
	);
	console.log(
		`    ${upper.padEnd(15)} → ${upperNorm.padEnd(15)} → ${Hex.fromBytes(upperHash).slice(0, 18)}...`,
	);
	console.log(
		`    ${mixed.padEnd(15)} → ${mixedNorm.padEnd(15)} → ${Hex.fromBytes(mixedHash).slice(0, 18)}...`,
	);

	const allMatch =
		Hex.fromBytes(lowerHash) === Hex.fromBytes(upperHash) &&
		Hex.fromBytes(upperHash) === Hex.fromBytes(mixedHash);
	console.log(`    All normalized to same hash: ${allMatch ? "✓" : "✗"}`);
}

// Memorable examples
console.log("\n7. Memorable Examples:");
const memorable = [
	{ name: "wallet.eth", desc: "Generic wallet name" },
	{ name: "crypto.eth", desc: "Cryptocurrency" },
	{ name: "hodl.eth", desc: "HODL meme" },
	{ name: "moon.eth", desc: "To the moon" },
	{ name: "lambo.eth", desc: "When Lambo?" },
];

for (const { name, desc } of memorable) {
	const normalized = Ens.normalize(name);
	const hash = Ens.namehash(normalized);
	console.log(
		`  ${name.padEnd(14)} (${desc.padEnd(22)}) → ${Hex.fromBytes(hash).slice(0, 18)}...`,
	);
}
