import { Address, Authorization } from "voltaire";

// Smart wallet contract (batching, gas sponsorship, etc.)
const smartWallet = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// EOA private key
const eoaKey = new Uint8Array(32);
eoaKey.fill(2);

// Create authorization to use smart wallet code
const auth = Authorization.sign(
	{
		chainId: 1n,
		address: smartWallet,
		nonce: 5n, // Current account nonce
	},
	eoaKey,
);

const eoaAddress = Authorization.verify(auth);
