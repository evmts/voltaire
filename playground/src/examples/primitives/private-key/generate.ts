import * as Address from "../../../primitives/Address/index.js";
import * as PrivateKey from "../../../primitives/PrivateKey/index.js";
const randomBytes = new Uint8Array(32);
crypto.getRandomValues(randomBytes);
const pk1 = PrivateKey.fromBytes(randomBytes);

// Derive address to verify
const pkHex = `0x${Array.from(randomBytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
const addr1 = PrivateKey.toAddress(pkHex);
for (let i = 0; i < 3; i++) {
	const keyBytes = new Uint8Array(32);
	crypto.getRandomValues(keyBytes);
	const pk = PrivateKey.fromBytes(keyBytes);
	const keyHex = `0x${Array.from(keyBytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
	const addr = PrivateKey.toAddress(keyHex);
}
const testKey = new Uint8Array(32);
crypto.getRandomValues(testKey);
