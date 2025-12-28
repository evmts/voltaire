import { Base64 } from "@tevm/voltaire";
const simple = "SGVsbG8sIFdvcmxkIQ==";
const simpleDecoded = Base64.decodeToString(simple);
const vectors = [
	{ encoded: "", text: "" },
	{ encoded: "Zg==", text: "f" },
	{ encoded: "Zm8=", text: "fo" },
	{ encoded: "Zm9v", text: "foo" },
	{ encoded: "Zm9vYg==", text: "foob" },
	{ encoded: "Zm9vYmE=", text: "fooba" },
	{ encoded: "Zm9vYmFy", text: "foobar" },
];

for (const { encoded, text } of vectors) {
	const decoded = Base64.decodeToString(encoded);
	const match = decoded === text ? "✓" : "✗";
}
const emojiEncoded = "8J+Mgvwn8J+MjvCflpI=";
try {
	const emojiDecoded = Base64.decodeToString(emojiEncoded);
} catch (err) {}
const jsonEncoded = "eyJuYW1lIjoiQWxpY2UiLCJhZ2UiOjMwfQ==";
const jsonString = Base64.decodeToString(jsonEncoded);
const jsonData = JSON.parse(jsonString);
const invalidInputs = [
	"!!!",
	"SGVsbG8", // Missing padding
	"SGV=sbG8=", // Padding in middle
	"SGVs bG8=", // Space
];

for (const invalid of invalidInputs) {
	try {
		Base64.decodeToString(invalid);
	} catch (err) {}
}
const emptyDecoded = Base64.decodeToString("");
