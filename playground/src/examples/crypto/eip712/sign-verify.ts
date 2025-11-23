// EIP-712: Sign and verify typed data
import * as EIP712 from "../../../crypto/EIP712/index.js";
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate keypair
const privateKey = Secp256k1.PrivateKey.random();
const publicKey = Secp256k1.PrivateKey.toPublicKey(privateKey);
const signerAddress = Secp256k1.PublicKey.toAddress(publicKey);

console.log("Signer address:", signerAddress.toHex());

// Define typed data
const typedData = {
	domain: {
		name: "Authentication",
		version: "1",
		chainId: 1n,
	},
	types: {
		Login: [
			{ name: "user", type: "address" },
			{ name: "action", type: "string" },
			{ name: "nonce", type: "uint256" },
		],
	},
	primaryType: "Login",
	message: {
		user: signerAddress,
		action: "authenticate",
		nonce: 42n,
	},
};

// Sign typed data - produces ECDSA signature
const signature = EIP712.signTypedData(typedData, privateKey);
console.log(
	"Signature r:",
	Hex.fromBytes(signature.r).toString().slice(0, 20) + "...",
);
console.log(
	"Signature s:",
	Hex.fromBytes(signature.s).toString().slice(0, 20) + "...",
);
console.log("Signature v:", signature.v);

// Recover signer address from signature
const recoveredAddress = EIP712.recoverAddress(signature, typedData);
console.log("Recovered address:", recoveredAddress.toHex());

// Verify signature matches expected signer
const isValid = EIP712.verifyTypedData(signature, typedData, signerAddress);
console.log("Signature valid:", isValid);

// Verify with wrong address fails
const wrongAddress = Address.from("0x0000000000000000000000000000000000000001");
const invalidCheck = EIP712.verifyTypedData(signature, typedData, wrongAddress);
console.log("Wrong address rejected:", !invalidCheck);
