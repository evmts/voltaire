// EIP-712: Domain separator - prevents signature replay
import * as EIP712 from "../../../crypto/EIP712/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";
import * as Hash from "../../../primitives/Hash/index.js";

// Different domain configurations
const domain1 = {
	name: "MyApp",
	version: "1",
	chainId: 1n, // Mainnet
	verifyingContract: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
};

const domain2 = {
	name: "MyApp",
	version: "1",
	chainId: 137n, // Polygon
	verifyingContract: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
};

const domain3 = {
	name: "MyApp",
	version: "2", // Different version
	chainId: 1n,
	verifyingContract: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
};

// Hash each domain
const hash1 = EIP712.Domain.hash(domain1);
const hash2 = EIP712.Domain.hash(domain2);
const hash3 = EIP712.Domain.hash(domain3);

console.log("Mainnet v1 domain:", Hex.fromBytes(hash1).toString());
console.log("Polygon v1 domain:", Hex.fromBytes(hash2).toString());
console.log("Mainnet v2 domain:", Hex.fromBytes(hash3).toString());

// Verify they're all different
console.log("\nDomain uniqueness:");
console.log("Mainnet ≠ Polygon:", !Hash.equals(hash1, hash2));
console.log("v1 ≠ v2:", !Hash.equals(hash1, hash3));

// Minimal domain (name only)
const minimalDomain = { name: "MinimalApp" };
const minimalHash = EIP712.Domain.hash(minimalDomain);
console.log("\nMinimal domain:", Hex.fromBytes(minimalHash).toString());

// Domain with salt (additional uniqueness)
const saltedDomain = {
	name: "MyApp",
	version: "1",
	chainId: 1n,
	verifyingContract: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
	salt: Hash.from(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
};

const saltedHash = EIP712.Domain.hash(saltedDomain);
console.log("Salted domain:", Hex.fromBytes(saltedHash).toString());
console.log("Different from unsalted:", !Hash.equals(hash1, saltedHash));

console.log("\nWhy domain matters:");
console.log("- Prevents cross-chain replay (same tx different chains)");
console.log("- Prevents cross-contract replay (same sig different contracts)");
console.log("- Prevents cross-version replay (v1 sig invalid for v2)");
console.log("- User sees what app/contract they authorize");
