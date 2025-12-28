import { PrivateKey } from "voltaire";

// Helper to convert PublicKeyType to hex
function pubKeyToHex(pk: Uint8Array): string {
	return `0x${Array.from(pk, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

// Example private key
const privateKey =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const publicKey = PrivateKey.toPublicKey(privateKey);
const pubKey1 = PrivateKey.toPublicKey(privateKey);
const pubKey2 = PrivateKey.toPublicKey(privateKey);
const pk1 =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const pk2 =
	"0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

const pub1 = PrivateKey.toPublicKey(pk1);
const pub2 = PrivateKey.toPublicKey(pk2);
