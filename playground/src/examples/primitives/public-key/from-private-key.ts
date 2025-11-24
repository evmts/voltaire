import * as PrivateKey from "../../../primitives/PrivateKey/index.js";
import * as PublicKey from "../../../primitives/PublicKey/index.js";

// Method 1: Using PublicKey.fromPrivateKey
const privateKey1 = PrivateKey.from(
	"0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
);
const publicKey1 = PublicKey.fromPrivateKey(privateKey1);

// Method 2: Using PrivateKey.toPublicKey
const privateKey2 = PrivateKey.from(
	"0x8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f",
);
const publicKey2 = PrivateKey._toPublicKey.call(privateKey2);

// Method 3: Multiple keys from array
const privateKeys = [
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
];
for (let i = 0; i < privateKeys.length; i++) {
	const pk = PrivateKey.from(privateKeys[i]);
	const pubKey = PublicKey.fromPrivateKey(pk);
}
