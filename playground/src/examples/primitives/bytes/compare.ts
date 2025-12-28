import { Bytes } from "@tevm/voltaire";
// Lexicographic comparison
const a = Bytes.fromHex("0x1234");
const b = Bytes.fromHex("0x5678");
const c = Bytes.fromHex("0x1234");

// Sorting byte arrays
const unsorted = [
	Bytes.fromHex("0xffff"),
	Bytes.fromHex("0x0001"),
	Bytes.fromHex("0x1234"),
	Bytes.fromHex("0xabcd"),
];

const sorted = [...unsorted].sort(Bytes.compare);
sorted.forEach((b) => console.log(Bytes.toHex(b)));

// Length affects comparison
const short = Bytes.fromHex("0xff");
const long = Bytes.fromHex("0xff00");
