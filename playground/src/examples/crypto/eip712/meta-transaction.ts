// EIP-712: Meta-transaction signature (gasless transactions)
import * as EIP712 from "../../../crypto/EIP712/index.js";
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate user keypair
const userPrivateKey = Secp256k1.PrivateKey.random();
const userPublicKey = Secp256k1.PrivateKey.toPublicKey(userPrivateKey);
const userAddress = Secp256k1.PublicKey.toAddress(userPublicKey);

const forwarderAddress = Address.from(
	"0x84a0856b038eaAd1cC7E297cF34A7e72685A8693",
); // MinimalForwarder
const targetContract = Address.from(
	"0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
); // Target contract

console.log("User address:", userAddress.toHex());
console.log("Forwarder:", forwarderAddress.toHex());

// Encode function call data (example: transfer(address,uint256))
// In real usage, you'd encode actual function call
const callData = new Uint8Array(68); // Simplified for example

// Meta-transaction typed data
const metaTx = {
	domain: {
		name: "MinimalForwarder",
		version: "1",
		chainId: 1n,
		verifyingContract: forwarderAddress,
	},
	types: {
		ForwardRequest: [
			{ name: "from", type: "address" },
			{ name: "to", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "gas", type: "uint256" },
			{ name: "nonce", type: "uint256" },
			{ name: "data", type: "bytes" },
		],
	},
	primaryType: "ForwardRequest",
	message: {
		from: userAddress,
		to: targetContract,
		value: 0n,
		gas: 100000n,
		nonce: 0n,
		data: callData,
	},
};

// User signs meta-transaction off-chain
const signature = EIP712.signTypedData(metaTx, userPrivateKey);
console.log(
	"Meta-tx signature r:",
	Hex.fromBytes(signature.r).toString().slice(0, 20) + "...",
);
console.log(
	"Meta-tx signature s:",
	Hex.fromBytes(signature.s).toString().slice(0, 20) + "...",
);
console.log("Meta-tx signature v:", signature.v);

// Verify signature
const recovered = EIP712.recoverAddress(signature, metaTx);
const isValid = EIP712.verifyTypedData(signature, metaTx, userAddress);
console.log("Meta-tx signature valid:", isValid);
console.log("Recovered user matches:", recovered.equals(userAddress));

// Transaction hash
const txHash = EIP712.hashTypedData(metaTx);
console.log("Meta-tx hash:", Hex.fromBytes(txHash).toString());

console.log("\nMeta-transaction flow:");
console.log("1. User signs request off-chain (no ETH needed)");
console.log("2. Relayer submits to forwarder contract");
console.log("3. Forwarder verifies signature");
console.log("4. Forwarder executes call on behalf of user");
console.log("5. Relayer pays gas, user gets gasless tx");
