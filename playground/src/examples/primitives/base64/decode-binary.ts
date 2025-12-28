import { Base64, Bytes, Bytes32 } from "@tevm/voltaire";
const simple = "SGVsbG8=";
const simpleBytes = Base64.decode(simple);
const zerosEncoded = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const zeros = Base64.decode(zerosEncoded);
const maxEncoded = "//////////////////////////////////////////8=";
const maxBytes = Base64.decode(maxEncoded);
const addressEncoded = "dC01zGY0wFMpJaO4RLxFTkQ49E4=";
const address = Base64.decode(addressEncoded);
const hashEncoded = "AAgQGCAoMDhAWFBYYGhwgIiIkJCYsLC4wMjI0NDY4OA==";
const hash = Base64.decode(hashEncoded);
const paddingExamples = [
	{ encoded: "QQ==", desc: "1 byte, 2 padding" },
	{ encoded: "QUI=", desc: "2 bytes, 1 padding" },
	{ encoded: "QUJD", desc: "3 bytes, 0 padding" },
	{ encoded: "QUJDRA==", desc: "4 bytes, 2 padding" },
];

for (const { encoded, desc } of paddingExamples) {
	const decoded = Base64.decode(encoded);
}
const original = Bytes32.zero();
for (let i = 0; i < 32; i++) original[i] = (i * 13 + 7) % 256;
const encoded = Base64.encode(original);
const decoded = Base64.decode(encoded);
const matches = original.every((byte, i) => byte === decoded[i]);
