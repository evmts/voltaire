import { Address, Bytes, EIP712, Hex, Secp256k1 } from "@tevm/voltaire";
// EIP-712: Meta-transaction signature (gasless transactions)

// Generate user keypair
const userPrivateKey = Secp256k1.PrivateKey.random();
const userPublicKey = Secp256k1.PrivateKey.toPublicKey(userPrivateKey);
const userAddress = Secp256k1.PublicKey.toAddress(userPublicKey);

const forwarderAddress = Address(
	"0x84a0856b038eaAd1cC7E297cF34A7e72685A8693",
); // MinimalForwarder
const targetContract = Address(
	"0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
); // Target contract

// Encode function call data (example: transfer(address,uint256))
// In real usage, you'd encode actual function call
const callData = Bytes.zero(68); // Simplified for example

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

// Verify signature
const recovered = EIP712.recoverAddress(signature, metaTx);
const isValid = EIP712.verifyTypedData(signature, metaTx, userAddress);

// Transaction hash
const txHash = EIP712.hashTypedData(metaTx);
