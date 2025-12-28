import { PrivateKey } from "voltaire";
import { Address } from "voltaire";

// Example private keys (from hardhat accounts)
const pk1 =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const pk2 =
	"0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const addr1 = PrivateKey.toAddress(pk1);
const addr2 = PrivateKey.toAddress(pk2);
const pubKey = PrivateKey.toPublicKey(pk1);
const pubHex = `0x${Array.from(pubKey, (b) => b.toString(16).padStart(2, "0")).join("")}`;
const derivedAddr = PrivateKey.toAddress(pk1);
const addr1a = PrivateKey.toAddress(pk1);
const addr1b = PrivateKey.toAddress(pk1);
const addr1Hex = Address.toHex(addr1);
const keys = [
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	"0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
	"0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
];

for (let i = 0; i < keys.length; i++) {
	const addr = PrivateKey.toAddress(keys[i] as string);
}
