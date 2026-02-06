import { Address, EIP712, Hash, Hex } from "@tevm/voltaire";
// EIP-712: Domain separator - prevents signature replay

// Different domain configurations
const domain1 = {
	name: "MyApp",
	version: "1",
	chainId: 1n, // Mainnet
	verifyingContract: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
};

const domain2 = {
	name: "MyApp",
	version: "1",
	chainId: 137n, // Polygon
	verifyingContract: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
};

const domain3 = {
	name: "MyApp",
	version: "2", // Different version
	chainId: 1n,
	verifyingContract: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
};

// Hash each domain
const hash1 = EIP712.Domain.hash(domain1);
const hash2 = EIP712.Domain.hash(domain2);
const hash3 = EIP712.Domain.hash(domain3);

// Minimal domain (name only)
const minimalDomain = { name: "MinimalApp" };
const minimalHash = EIP712.Domain.hash(minimalDomain);

// Domain with salt (additional uniqueness)
const saltedDomain = {
	name: "MyApp",
	version: "1",
	chainId: 1n,
	verifyingContract: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"),
	salt: Hash(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
};

const saltedHash = EIP712.Domain.hash(saltedDomain);
