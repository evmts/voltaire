import * as Hex from "../../../primitives/Hex/index.js";

// Concatenate multiple hex strings
const part1 = "0x1234";
const part2 = "0x5678";
const part3 = "0x9abc";

const combined = Hex.concat(part1, part2, part3);
console.log("Part 1:", part1);
console.log("Part 2:", part2);
console.log("Part 3:", part3);
console.log("Combined:", combined);
console.log("Combined size:", Hex.size(combined), "bytes");

// Concatenate with different formats
const withPrefix = "0xdead";
const withoutPrefix = "beef";
const mixed = Hex.concat(withPrefix, withoutPrefix);
console.log("\nMixed prefixes:", mixed);

// Empty concatenation
const empty = Hex.concat();
console.log("\nEmpty concat:", empty);

// Build complex data structures
const selector = "0x70a08231"; // balanceOf(address)
const address =
	"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e";
const calldata = Hex.concat(selector, address);
console.log("\nFunction calldata:", calldata);
console.log("Calldata size:", Hex.size(calldata), "bytes");
