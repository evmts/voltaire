import * as PrivateKey from "../../../primitives/PrivateKey/index.js";

// Example test keys (from hardhat)
const testKey1 =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const testKey2 =
	"0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const pk1 = PrivateKey.from(testKey1);
const pk2 = PrivateKey.from(testKey1.slice(2));
const hexOut = PrivateKey.toHex(testKey1);

// Invalid length
try {
	PrivateKey.from("0x1234");
} catch (err) {}

// Invalid characters
try {
	PrivateKey.from(
		"0xzz0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	);
} catch (err) {}
