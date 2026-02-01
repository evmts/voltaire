import { Hex } from "@tevm/voltaire";
// Concatenate multiple hex strings
const part1 = Hex("0x1234");
const part2 = Hex("0x5678");
const part3 = Hex("0x9abc");

const combined = part1.concat(part2, part3);

// Concatenate with different formats
const withPrefix = Hex("0xdead");
const withoutPrefix = Hex("beef");
const mixed = withPrefix.concat(withoutPrefix);

// Empty concatenation
const empty = Hex.concat();

// Build complex data structures
const selector = Hex("0x70a08231"); // balanceOf(address)
const address = Hex(
	"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
const calldata = selector.concat(address);
