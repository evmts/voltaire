import * as Base64 from "../../../primitives/Base64/index.js";
const ascii = "Hello, World!";
const asciiEncoded = Base64.encodeString(ascii);
const emoji = "Hello 🌍 World 🚀";
const emojiEncoded = Base64.encodeString(emoji);
const multilingual = "Hello 世界 مرحبا мир";
const multiEncoded = Base64.encodeString(multilingual);
const jsonData = { name: "Alice", age: 30, active: true };
const jsonString = JSON.stringify(jsonData);
const jsonEncoded = Base64.encodeString(jsonString);
const jsonDecoded = JSON.parse(Base64.decodeToString(jsonEncoded));
const empty = "";
const emptyEncoded = Base64.encodeString(empty);
const longText =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit.".repeat(10);
const longEncoded = Base64.encodeString(longText);
