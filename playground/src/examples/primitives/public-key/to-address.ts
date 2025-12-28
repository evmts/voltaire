
import { Address, PrivateKey, PublicKey } from "@tevm/voltaire";
// Create public key from private key
const privateKey = PrivateKey(
	"0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
);
const publicKey = PublicKey.fromPrivateKey(privateKey);

// Derive address from public key (keccak256 hash, take last 20 bytes)
const address = Address(PublicKey._toAddress.call(publicKey));

// Using public wrapper API
const pkHex = PublicKey._toHex.call(publicKey);
const addressFromWrapper = Address(PublicKey.toAddress(pkHex));
const keys = [
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	"0x8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f",
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
];

for (let i = 0; i < keys.length; i++) {
	const pk = PrivateKey(keys[i]);
	const pubKey = PublicKey.fromPrivateKey(pk);
	const addr = Address(PublicKey._toAddress.call(pubKey));
}
const directAddress = Address(PrivateKey._toAddress.call(privateKey));
