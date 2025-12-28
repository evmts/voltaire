import { Address, Authorization, Bytes, Bytes32 } from "@tevm/voltaire";

const delegate = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const privateKey = Bytes32.zero().fill(1);

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

// Verify same signer for all chains
const signer1 = Authorization.verify(mainnet);
const signer2 = Authorization.verify(sepolia);
const signer3 = Authorization.verify(polygon);
const signer4 = Authorization.verify(optimism);

// Chain ID must be non-zero
try {
	const invalidAuth = {
		chainId: 0n,
		address: delegate,
		nonce: 0n,
		yParity: 0,
		r: Bytes32.zero().fill(1),
		s: Bytes32.zero().fill(2),
	};
	Authorization.validate(invalidAuth);
} catch (error) {}
