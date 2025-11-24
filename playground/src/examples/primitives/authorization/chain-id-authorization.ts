import * as Address from "voltaire/primitives/Address";
import * as Authorization from "voltaire/primitives/Authorization";

// Example: Chain ID Scoping
// Authorizations are chain-specific for security

console.log("=== Chain ID Scoping ===\n");

const delegate = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const privateKey = new Uint8Array(32).fill(1);

// Create authorizations for different chains
console.log("Creating Chain-Specific Authorizations...\n");

// Mainnet authorization
const mainnet = Authorization.sign(
	{
		chainId: 1n, // Ethereum Mainnet
		address: delegate,
		nonce: 0n,
	},
	privateKey,
);

// Sepolia authorization
const sepolia = Authorization.sign(
	{
		chainId: 11155111n, // Sepolia Testnet
		address: delegate,
		nonce: 0n,
	},
	privateKey,
);

// Polygon authorization
const polygon = Authorization.sign(
	{
		chainId: 137n, // Polygon Mainnet
		address: delegate,
		nonce: 0n,
	},
	privateKey,
);

// Optimism authorization
const optimism = Authorization.sign(
	{
		chainId: 10n, // Optimism Mainnet
		address: delegate,
		nonce: 0n,
	},
	privateKey,
);

console.log("Authorizations by Chain:");
console.log();

console.log("1. Ethereum Mainnet (1)");
console.log("   Chain ID:", mainnet.chainId);
console.log(
	"   Delegate:",
	Address.toHex(mainnet.address).slice(0, 10) + "...",
);
console.log();

console.log("2. Sepolia Testnet (11155111)");
console.log("   Chain ID:", sepolia.chainId);
console.log(
	"   Delegate:",
	Address.toHex(sepolia.address).slice(0, 10) + "...",
);
console.log();

console.log("3. Polygon Mainnet (137)");
console.log("   Chain ID:", polygon.chainId);
console.log(
	"   Delegate:",
	Address.toHex(polygon.address).slice(0, 10) + "...",
);
console.log();

console.log("4. Optimism Mainnet (10)");
console.log("   Chain ID:", optimism.chainId);
console.log(
	"   Delegate:",
	Address.toHex(optimism.address).slice(0, 10) + "...",
);
console.log();

// Verify same signer for all chains
const signer1 = Authorization.verify(mainnet);
const signer2 = Authorization.verify(sepolia);
const signer3 = Authorization.verify(polygon);
const signer4 = Authorization.verify(optimism);

console.log("Signature Recovery:");
console.log("All signed by:", Address.toHex(signer1));
console.log(
	"Same signer:",
	Address.equals(signer1, signer2) &&
		Address.equals(signer2, signer3) &&
		Address.equals(signer3, signer4),
);
console.log();

// Security implications
console.log("Security Properties:");
console.log("- Authorizations are chain-specific");
console.log("- Cannot replay on different chains");
console.log("- Chain ID is part of signed message");
console.log("- Prevents cross-chain attacks");
console.log();

// Chain ID must be non-zero
try {
	const invalidAuth = {
		chainId: 0n,
		address: delegate,
		nonce: 0n,
		yParity: 0,
		r: new Uint8Array(32).fill(1),
		s: new Uint8Array(32).fill(2),
	};
	Authorization.validate(invalidAuth);
	console.log("Zero chain ID: ALLOWED (unexpected)");
} catch (error) {
	console.log("Zero chain ID: REJECTED (expected)");
	console.log("Error:", (error as Error).message);
}
