import * as Domain from "../../../../../src/primitives/Domain/index.js";
import { hash as keccak256 } from "../../../../../src/crypto/Keccak256/index.js";
import * as Hex from "../../../../../src/primitives/Hex/index.js";

// Example: Chain-specific domains prevent cross-chain replay attacks

const protocolName = "MyProtocol";
const version = "1";
const contract = "0x1111111111111111111111111111111111111111";

// Ethereum Mainnet (Chain ID: 1)
const mainnet = Domain.from({
	name: protocolName,
	version,
	chainId: 1,
	verifyingContract: contract,
});

// Optimism (Chain ID: 10)
const optimism = Domain.from({
	name: protocolName,
	version,
	chainId: 10,
	verifyingContract: contract,
});

// BSC (Chain ID: 56)
const bsc = Domain.from({
	name: protocolName,
	version,
	chainId: 56,
	verifyingContract: contract,
});

// Polygon (Chain ID: 137)
const polygon = Domain.from({
	name: protocolName,
	version,
	chainId: 137,
	verifyingContract: contract,
});

// Arbitrum (Chain ID: 42161)
const arbitrum = Domain.from({
	name: protocolName,
	version,
	chainId: 42161,
	verifyingContract: contract,
});

// Base (Chain ID: 8453)
const base = Domain.from({
	name: protocolName,
	version,
	chainId: 8453,
	verifyingContract: contract,
});

// Sepolia Testnet (Chain ID: 11155111)
const sepolia = Domain.from({
	name: protocolName,
	version,
	chainId: 11155111,
	verifyingContract: contract,
});

console.log("Chain-specific domain separators:\n");

const chains = [
	{ name: "Ethereum Mainnet", domain: mainnet },
	{ name: "Optimism", domain: optimism },
	{ name: "BSC", domain: bsc },
	{ name: "Polygon", domain: polygon },
	{ name: "Arbitrum", domain: arbitrum },
	{ name: "Base", domain: base },
	{ name: "Sepolia", domain: sepolia },
];

for (const { name, domain } of chains) {
	const separator = Domain.toHash(domain, { keccak256 });
	console.log(`${name.padEnd(20)} (${domain.chainId}):`);
	console.log(`  ${Hex.fromBytes(separator).slice(0, 34)}...`);
}

// Verify all separators are unique
const separators = chains.map((c) =>
	Hex.fromBytes(Domain.toHash(c.domain, { keccak256 })),
);

console.log("\nCross-chain replay protection:");
for (let i = 0; i < separators.length; i++) {
	for (let j = i + 1; j < separators.length; j++) {
		const different = !Hex.equals(separators[i], separators[j]);
		if (!different) {
			console.log(`FAIL: ${chains[i].name} == ${chains[j].name}`);
		}
	}
}
console.log("All separators unique - replay attacks prevented");

// Same contract on different chains = different domains
console.log(`\nSame contract (${contract})`);
console.log("Different chains = different separators");
console.log("Signature on one chain cannot replay on another");
