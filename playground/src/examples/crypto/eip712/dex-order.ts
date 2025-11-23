// EIP-712: DEX order signature (0x Protocol style)
import * as EIP712 from "../../../crypto/EIP712/index.js";
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate maker keypair
const makerPrivateKey = Secp256k1.PrivateKey.random();
const makerPublicKey = Secp256k1.PrivateKey.toPublicKey(makerPrivateKey);
const makerAddress = Secp256k1.PublicKey.toAddress(makerPublicKey);

// Token addresses
const daiAddress = Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F");
const usdcAddress = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const exchangeAddress = Address.from(
	"0xDef1C0ded9bec7F1a1670819833240f027b25EfF",
);

console.log("Maker address:", makerAddress.toHex());
console.log("Trading DAI for USDC");

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
		taker: Address.from("0x0000000000000000000000000000000000000000"), // Anyone can fill
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
console.log(
	"Order signature r:",
	Hex.fromBytes(signature.r).toString().slice(0, 20) + "...",
);
console.log(
	"Order signature s:",
	Hex.fromBytes(signature.s).toString().slice(0, 20) + "...",
);
console.log("Order signature v:", signature.v);

// Verify order signature
const isValid = EIP712.verifyTypedData(signature, order, makerAddress);
console.log("Order signature valid:", isValid);

// Order hash uniquely identifies this order
const orderHash = EIP712.hashTypedData(order);
console.log("Order hash:", Hex.fromBytes(orderHash).toString());

console.log("\nOrder details:");
console.log("- Sell: 1000 DAI");
console.log("- Buy: 1000 USDC");
console.log("- Rate: 1 DAI = 1 USDC");
console.log("- Open to any taker");
console.log(
	"- Expires:",
	new Date(Number(order.message.expiry) * 1000).toISOString(),
);
