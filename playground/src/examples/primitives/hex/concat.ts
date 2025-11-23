import * as Hex from "../../../primitives/Hex/index.js";

// Concatenate multiple hex strings
const part1 = Hex.from("0x1234");
const part2 = Hex.from("0x5678");
const part3 = Hex.from("0x9abc");

const combined = part1.concat(part2, part3);
console.log("Part 1:", part1.toString());
console.log("Part 2:", part2.toString());
console.log("Part 3:", part3.toString());
console.log("Combined:", combined.toString());
console.log("Combined size:", combined.size(), "bytes");

// Concatenate with different formats
const withPrefix = Hex.from("0xdead");
const withoutPrefix = Hex.from("beef");
const mixed = withPrefix.concat(withoutPrefix);
console.log("\nMixed prefixes:", mixed.toString());

// Empty concatenation
const empty = Hex.concat();
console.log("\nEmpty concat:", empty.toString());

// Build complex data structures
const selector = Hex.from("0x70a08231"); // balanceOf(address)
const address = Hex.from(
	"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
const calldata = selector.concat(address);
console.log("\nFunction calldata:", calldata.toString());
console.log("Calldata size:", calldata.size(), "bytes");
