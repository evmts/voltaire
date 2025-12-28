import { Address, EIP712, Hex, Secp256k1 } from "@tevm/voltaire";
// EIP-712: ERC-2612 Permit signature (gasless token approval)

// Generate owner keypair
const ownerPrivateKey = Secp256k1.PrivateKey.random();
const ownerPublicKey = Secp256k1.PrivateKey.toPublicKey(ownerPrivateKey);
const ownerAddress = Secp256k1.PublicKey.toAddress(ownerPublicKey);

// Spender and token contract addresses
const spenderAddress = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
const tokenAddress = Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"); // USDC

// ERC-2612 Permit typed data
const permit = {
	domain: {
		name: "USD Coin",
		version: "2",
		chainId: 1n,
		verifyingContract: tokenAddress,
	},
	types: {
		Permit: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "nonce", type: "uint256" },
			{ name: "deadline", type: "uint256" },
		],
	},
	primaryType: "Permit",
	message: {
		owner: ownerAddress,
		spender: spenderAddress,
		value: 1000000n, // 1 USDC (6 decimals)
		nonce: 0n,
		deadline: 1700000000n,
	},
};

// Owner signs permit off-chain (no gas cost)
const signature = EIP712.signTypedData(permit, ownerPrivateKey);

// Verify permit signature
const recovered = EIP712.recoverAddress(signature, permit);
const isValid = EIP712.verifyTypedData(signature, permit, ownerAddress);
