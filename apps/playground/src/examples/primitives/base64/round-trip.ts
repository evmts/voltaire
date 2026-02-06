import { Base64, Bytes, Bytes32 } from "@tevm/voltaire";
const data = Bytes([72, 101, 108, 108, 111]);
const encoded = Base64.encode(data);
const decoded = Base64.decode(encoded);
const matches = data.every((byte, i) => byte === decoded[i]);
const strings = [
	"",
	"a",
	"Hello",
	"Hello, World!",
	"🚀 Rocket",
	"こんにちは",
	"Hello\x00World", // Null byte
];

for (const str of strings) {
	const encoded = Base64.encodeString(str);
	const decoded = Base64.decodeToString(encoded);
	const match = decoded === str ? "✓" : "✗";
}
const edgeCases = [
	{ desc: "Empty", data: Bytes([]) },
	{ desc: "Single byte", data: Bytes([0x42]) },
	{ desc: "All zeros", data: Bytes32.zero() },
	{ desc: "All 0xFF", data: Bytes32.zero().fill(255) },
	{
		desc: "Sequential",
		data: Bytes(Array.from({ length: 100 }, (_, i) => i)),
	},
];

for (const { desc, data } of edgeCases) {
	const encoded = Base64.encode(data);
	const decoded = Base64.decode(encoded);
	const match = data.every((byte, i) => byte === decoded[i]);
}
const urlSafeCases = [
	Bytes([]),
	Bytes([255]),
	Bytes([255, 254, 253, 252, 251]),
	Bytes(Array.from({ length: 50 }, (_, i) => (i * 5) % 256)),
];

for (const data of urlSafeCases) {
	const encoded = Base64.encodeUrlSafe(data);
	const decoded = Base64.decodeUrlSafe(encoded);
	const match = data.every((byte, i) => byte === decoded[i]);
}
const original = Bytes([1, 2, 3, 4, 5]);

// Standard branded
const brandedStd = Base64(original);
const bytesFromBranded = Base64.toBytes(brandedStd);
const matchStd = original.every((byte, i) => byte === bytesFromBranded[i]);

// URL-safe branded
const brandedUrl = Base64.fromUrlSafe(original);
const bytesFromUrl = Base64.toBytesUrlSafe(brandedUrl);
const matchUrl = original.every((byte, i) => byte === bytesFromUrl[i]);
const testData = Bytes([255, 254, 253]);
const standard = Base64(testData);
const urlSafe = Base64.toBase64Url(standard);
const backToStandard = Base64.toBase64(urlSafe);
const finalBytes = Base64.toBytes(backToStandard);
const matchConversion = testData.every((byte, i) => byte === finalBytes[i]);
const sizes = [100, 1000, 10000];
for (const size of sizes) {
	const large = Bytes.zero(size);
	for (let i = 0; i < size; i++) large[i] = (i * 13 + 7) % 256;

	const start = performance.now();
	const enc = Base64.encode(large);
	const dec = Base64.decode(enc);
	const time = performance.now() - start;

	const match = large.every((byte, i) => byte === dec[i]);
}
const utf8Cases = [
	{ desc: "Emoji", text: "🚀🌟💎" },
	{ desc: "Multi-byte", text: "こんにちは世界" },
	{ desc: "Mixed", text: "Hello 世界 🌍" },
	{ desc: "Surrogate pairs", text: "𝕳𝖊𝖑𝖑𝖔" },
];

for (const { desc, text } of utf8Cases) {
	const encoded = Base64.encodeString(text);
	const decoded = Base64.decodeToString(encoded);
	const match = decoded === text ? "✓" : "✗";
}
