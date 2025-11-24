import * as Base64 from "../../../primitives/Base64/index.js";
const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
const encoded = Base64.encode(bytes);
const zeros = new Uint8Array(32);
const zerosEncoded = Base64.encode(zeros);
const maxBytes = new Uint8Array(32).fill(255);
const maxEncoded = Base64.encode(maxBytes);
const random = new Uint8Array(32);
for (let i = 0; i < random.length; i++) {
	random[i] = (i * 7 + 13) % 256;
}
const randomEncoded = Base64.encode(random);
const address = new Uint8Array([
	0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53, 0x29, 0x25, 0xa3, 0xb8, 0x44,
	0xbc, 0x45, 0x4e, 0x44, 0x38, 0xf4, 0x4e,
]);
const addressEncoded = Base64.encode(address);
const hash = new Uint8Array(32);
for (let i = 0; i < 32; i++) hash[i] = i * 8;
const hashEncoded = Base64.encode(hash);
for (const len of [1, 2, 3, 4, 5, 6]) {
	const data = new Uint8Array(len).fill(0x41);
	const enc = Base64.encode(data);
	const paddingCount = (enc.match(/=/g) || []).length;
}
