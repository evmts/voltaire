import { PrivateKey, Bytes, Bytes32 } from "@tevm/voltaire";
import { Address } from "@tevm/voltaire";

const bytes1 = Bytes([
	0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3, 0x6b, 0xa4, 0xa6, 0xb4, 0xd2,
	0x38, 0xff, 0x94, 0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfc, 0xae, 0x78,
	0x4d, 0x7b, 0xf4, 0xf2, 0xff, 0x80,
]);
const pk1 = PrivateKey.fromBytes(bytes1);
const randomBytes = Bytes32.zero();
crypto.getRandomValues(randomBytes);
const pk2 = PrivateKey.fromBytes(randomBytes);
const randHex = `0x${Array.from(randomBytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
const addr2 = PrivateKey.toAddress(randHex);
const testBytes = Bytes32.zero();
testBytes[0] = 0xff;
testBytes[31] = 0xaa;
const pk3 = PrivateKey.fromBytes(testBytes);
const hex3 = PrivateKey.toHex(
	`0x${Array.from(testBytes, (b) => b.toString(16).padStart(2, "0")).join("")}`,
);

try {
	const shortBytes = Bytes.zero(16);
	PrivateKey.fromBytes(shortBytes);
} catch (err) {}

try {
	const longBytes = Bytes.zero(64);
	PrivateKey.fromBytes(longBytes);
} catch (err) {}
const sourceBytes = Bytes32.zero();
crypto.getRandomValues(sourceBytes);
const pk5 = PrivateKey.fromBytes(sourceBytes);

// Modify source
sourceBytes[0] = 0x00;
const hex5 = PrivateKey.toHex(
	`0x${Array.from(pk5 as Uint8Array, (b) => b.toString(16).padStart(2, "0")).join("")}`,
);
