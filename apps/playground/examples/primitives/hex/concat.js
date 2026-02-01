// Hex: Concatenate multiple hex strings
import { Hex } from "@tevm/voltaire";

const part1 = Hex("0x1234");
const part2 = Hex("0x5678");
const part3 = Hex("0x9abc");

const combined = Hex.concat(part1, part2, part3);

// Build complex data structures
const selector = Hex("0x70a08231");
const address = Hex(
	"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
const calldata = Hex.concat(selector, address);
