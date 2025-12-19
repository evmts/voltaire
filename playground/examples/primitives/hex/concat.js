// Hex: Concatenate multiple hex strings
import * as Hex from "../../../../src/primitives/Hex/index.js";

const part1 = Hex.from("0x1234");
const part2 = Hex.from("0x5678");
const part3 = Hex.from("0x9abc");

const combined = Hex.concat(part1, part2, part3);

// Build complex data structures
const selector = Hex.from("0x70a08231");
const address = Hex.from(
	"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
const calldata = Hex.concat(selector, address);
