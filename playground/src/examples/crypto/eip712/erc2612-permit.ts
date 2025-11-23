// EIP-712: ERC-2612 Permit signature (gasless token approval)
import * as EIP712 from "../../../crypto/EIP712/index.js";
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate owner keypair
const ownerPrivateKey = Secp256k1.PrivateKey.random();
const ownerPublicKey = Secp256k1.PrivateKey.toPublicKey(ownerPrivateKey);
const ownerAddress = Secp256k1.PublicKey.toAddress(ownerPublicKey);

// Spender and token contract addresses
const spenderAddress = Address.from(
	"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
);
const tokenAddress = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"); // USDC

console.log("Token owner:", ownerAddress.toHex());
console.log("Spender:", spenderAddress.toHex());

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
console.log(
	"Permit signature r:",
	Hex.fromBytes(signature.r).toString().slice(0, 20) + "...",
);
console.log(
	"Permit signature s:",
	Hex.fromBytes(signature.s).toString().slice(0, 20) + "...",
);
console.log("Permit signature v:", signature.v);

// Verify permit signature
const recovered = EIP712.recoverAddress(signature, permit);
const isValid = EIP712.verifyTypedData(signature, permit, ownerAddress);
console.log("Permit signature valid:", isValid);
console.log(
	"Recovered owner matches:",
	recovered.equals(ownerAddress),
);

// Spender can submit this signature to token.permit() to approve without owner paying gas
console.log("\nBenefits:");
console.log("- Owner signs off-chain (no gas)");
console.log("- Spender submits to contract");
console.log("- Approval granted in same tx as transfer");
console.log("- Better UX for end users");
