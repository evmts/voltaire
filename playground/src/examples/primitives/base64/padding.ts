import * as Base64 from "../../../primitives/Base64/index.js";
for (let len = 0; len <= 6; len++) {
	const data = new Uint8Array(len).fill(0x41); // 'A'
	const encoded = Base64.encode(data);
	const paddingCount = (encoded.match(/=/g) || []).length;
	const encodedLen = encoded.length;
}
const paddingRules = [
	{ inputMod3: 0, padding: 0, example: "QUJD" }, // 3n bytes -> 0 padding
	{ inputMod3: 1, padding: 2, example: "QQ==" }, // 3n+1 bytes -> 2 padding
	{ inputMod3: 2, padding: 1, example: "QUI=" }, // 3n+2 bytes -> 1 padding
];

for (const { inputMod3, padding, example } of paddingRules) {
}
const withoutPadding = "SGVsbG8"; // Missing "="
const withPadding = "SGVsbG8=";
const data = new Uint8Array([72, 101, 108, 108, 111]);
const standard = Base64.encode(data);
const urlSafe = Base64.encodeUrlSafe(data);
const invalidPadding = [
	{ value: "A===", desc: "3 padding chars" },
	{ value: "====", desc: "4 padding chars" },
	{ value: "AA=A", desc: "padding in middle" },
	{ value: "A=AA", desc: "padding near start" },
	{ value: "=AAA", desc: "padding at start" },
];

for (const { value, desc } of invalidPadding) {
	try {
		Base64.decode(value);
	} catch (err) {}
}
const validPadding = [
	{ value: "AAAA", padding: 0 },
	{ value: "AAA=", padding: 1 },
	{ value: "AA==", padding: 2 },
];

for (const { value, padding } of validPadding) {
	try {
		const decoded = Base64.decode(value);
	} catch (err) {}
}
for (let inputBytes = 1; inputBytes <= 10; inputBytes++) {
	const encodedLen = Base64.calcEncodedSize(inputBytes);
	const data = new Uint8Array(inputBytes);
	const encoded = Base64.encode(data);
	const actualPadding = (encoded.match(/=/g) || []).length;
	const expectedPadding = (3 - (inputBytes % 3)) % 3;
}
