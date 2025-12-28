import { Chain } from "voltaire";

// Example: Ethereum Mainnet chain configuration and properties

const eth = Chain.fromId(1)!; // Ethereum Mainnet
const hardforks = [
	"homestead",
	"byzantium",
	"constantinople",
	"istanbul",
	"berlin",
	"london",
	"paris",
	"shanghai",
	"cancun",
] as const;

for (const fork of hardforks) {
	const block = Chain.getHardforkBlock(eth, fork);
	if (block !== undefined) {
	}
}
