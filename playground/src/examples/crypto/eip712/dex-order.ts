import { Address, EIP712, Hex, Secp256k1 } from "@tevm/voltaire";
// EIP-712: DEX order signature (0x Protocol style)

// Generate maker keypair
const makerPrivateKey = Secp256k1.PrivateKey.random();
const makerPublicKey = Secp256k1.PrivateKey.toPublicKey(makerPrivateKey);
const makerAddress = Secp256k1.PublicKey.toAddress(makerPublicKey);

// Token addresses
const daiAddress = Address("0x6B175474E89094C44Da98b954EedeAC495271d0F");
const usdcAddress = Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const exchangeAddress = Address("0xDef1C0ded9bec7F1a1670819833240f027b25EfF");

// DEX order typed data
const order = {
	domain: {
		name: "0x Protocol",
		version: "4",
		chainId: 1n,
		verifyingContract: exchangeAddress,
	},
	types: {
		Order: [
			{ name: "maker", type: "address" },
			{ name: "taker", type: "address" },
			{ name: "makerToken", type: "address" },
			{ name: "takerToken", type: "address" },
			{ name: "makerAmount", type: "uint256" },
			{ name: "takerAmount", type: "uint256" },
			{ name: "expiry", type: "uint256" },
			{ name: "salt", type: "uint256" },
		],
	},
	primaryType: "Order",
	message: {
		maker: makerAddress,
		taker: Address("0x0000000000000000000000000000000000000000"), // Anyone can fill
		makerToken: daiAddress,
		takerToken: usdcAddress,
		makerAmount: 1000n * 10n ** 18n, // 1000 DAI
		takerAmount: 1000n * 10n ** 6n, // 1000 USDC
		expiry: 1700000000n,
		salt: 123456789n,
	},
};

// Maker signs order off-chain
const signature = EIP712.signTypedData(order, makerPrivateKey);

// Verify order signature
const isValid = EIP712.verifyTypedData(signature, order, makerAddress);

// Order hash uniquely identifies this order
const orderHash = EIP712.hashTypedData(order);
