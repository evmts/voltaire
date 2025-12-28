import { PrivateKey, Bytes, Bytes32 } from "@tevm/voltaire";
import { Address } from "@tevm/voltaire";

const randomBytes = Bytes32.zero();
crypto.getRandomValues(randomBytes);
const pk1 = PrivateKey.fromBytes(randomBytes);

// Derive address to verify
const pkHex = `0x${Array.from(randomBytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
const addr1 = PrivateKey.toAddress(pkHex);
for (let i = 0; i < 3; i++) {
	const keyBytes = Bytes32.zero();
	crypto.getRandomValues(keyBytes);
	const pk = PrivateKey.fromBytes(keyBytes);
	const keyHex = `0x${Array.from(keyBytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
	const addr = PrivateKey.toAddress(keyHex);
}
const testKey = Bytes32.zero();
crypto.getRandomValues(testKey);
