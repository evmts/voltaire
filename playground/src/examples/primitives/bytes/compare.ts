import * as Bytes from "../../../primitives/Bytes/index.js";

// Lexicographic comparison
const a = Bytes.fromHex("0x1234");
const b = Bytes.fromHex("0x5678");
const c = Bytes.fromHex("0x1234");

console.log("compare(a, b):", Bytes.compare(a, b)); // -1 (a < b)
console.log("compare(b, a):", Bytes.compare(b, a)); // 1 (b > a)
console.log("compare(a, c):", Bytes.compare(a, c)); // 0 (equal)

// Sorting byte arrays
const unsorted = [
	Bytes.fromHex("0xffff"),
	Bytes.fromHex("0x0001"),
	Bytes.fromHex("0x1234"),
	Bytes.fromHex("0xabcd"),
];

const sorted = [...unsorted].sort(Bytes.compare);
console.log("Sorted:");
sorted.forEach((b) => console.log("  ", Bytes.toHex(b)));

// Length affects comparison
const short = Bytes.fromHex("0xff");
const long = Bytes.fromHex("0xff00");
console.log("Short vs long:", Bytes.compare(short, long)); // -1
