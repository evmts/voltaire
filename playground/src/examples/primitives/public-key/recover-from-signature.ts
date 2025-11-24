import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import Address from "../../../primitives/Address/index.js";
import { Hash } from "../../../primitives/Hash/index.js";
import * as PrivateKey from "../../../primitives/PrivateKey/index.js";
import * as PublicKey from "../../../primitives/PublicKey/index.js";

// Create key pair
const privateKey = PrivateKey.from(
	"0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
);
const originalPublicKey = PublicKey.fromPrivateKey(privateKey);

// Sign a message
const message = "Hello, Ethereum!";
const messageHash = Hash.keccak256String(message);
const signature = PrivateKey._sign(privateKey, messageHash);
const recoveredPublicKey = Secp256k1.recoverPublicKey(signature, messageHash);

// Verify they match
const keysMatch =
	PublicKey._toHex.call(originalPublicKey) ===
	PublicKey._toHex.call(recoveredPublicKey);

// Verify the recovered key can verify the signature
const isValid = PublicKey._verify(recoveredPublicKey, messageHash, signature);
const originalAddress = Address(PublicKey._toAddress.call(originalPublicKey));
const recoveredAddress = Address(PublicKey._toAddress.call(recoveredPublicKey));
const testMessages = ["Transaction 1", "Transfer 100 ETH", "Deploy contract"];

for (const msg of testMessages) {
	const hash = Hash.keccak256String(msg);
	const sig = PrivateKey._sign(privateKey, hash);
	const recovered = Secp256k1.recoverPublicKey(sig, hash);
	const match =
		PublicKey._toHex.call(originalPublicKey) ===
		PublicKey._toHex.call(recovered);
}
