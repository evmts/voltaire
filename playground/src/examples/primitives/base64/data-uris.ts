import { Base64, Bytes } from "@tevm/voltaire";
const text = "Hello, World!";
const textEncoded = Base64.encodeString(text);
const textDataUri = `data:text/plain;base64,${textEncoded}`;
const jsonData = { name: "Alice", age: 30, active: true };
const jsonString = JSON.stringify(jsonData);
const jsonEncoded = Base64.encodeString(jsonString);
const jsonDataUri = `data:application/json;base64,${jsonEncoded}`;

// Decode it back
const jsonMatch = jsonDataUri.match(/^data:application\/json;base64,(.+)$/);
if (jsonMatch) {
	const decoded = Base64.decodeToString(jsonMatch[1]);
	const parsed = JSON.parse(decoded);
}
const svg =
	'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';
const svgEncoded = Base64.encodeString(svg);
const svgDataUri = `data:image/svg+xml;base64,${svgEncoded}`;
// Simulate a small 2x2 pixel image (header + data)
const imageData = Bytes([
	0x89,
	0x50,
	0x4e,
	0x47, // PNG signature
	0x0d,
	0x0a,
	0x1a,
	0x0a,
	0xff,
	0x00,
	0xff,
	0x00, // Pixel data (simplified)
	0x00,
	0xff,
	0x00,
	0xff,
]);
const imageEncoded = Base64.encode(imageData);
const imageDataUri = `data:image/png;base64,${imageEncoded}`;
const html = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Hello</h1></body>
</html>`;
const htmlEncoded = Base64.encodeString(html);
const htmlDataUri = `data:text/html;base64,${htmlEncoded}`;
const css = "body { background: #f0f0f0; color: #333; }";
const cssEncoded = Base64.encodeString(css);
const cssDataUri = `data:text/css;base64,${cssEncoded}`;
const testUri = "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==";
const match = testUri.match(/^data:([^;]+);base64,(.+)$/);
if (match) {
	const [, mimeType, encoded] = match;
	const decoded = Base64.decodeToString(encoded);
}
const sizes = [100, 1000, 10000];
for (const size of sizes) {
	const data = Bytes.zero(size);
	const encoded = Base64.encode(data);
	const dataUri = `data:application/octet-stream;base64,${encoded}`;
	const overhead = ((dataUri.length / size - 1) * 100).toFixed(1);
}
