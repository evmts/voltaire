import { Hardfork } from "voltaire";
interface ForkBlock {
	name: string;
	block: number | string;
	date: string;
	constant: string;
}

const mainnetBlocks: ForkBlock[] = [
	{
		name: "Frontier",
		block: 0,
		date: "July 30, 2015",
		constant: "FRONTIER",
	},
	{
		name: "Homestead",
		block: 1150000,
		date: "March 14, 2016",
		constant: "HOMESTEAD",
	},
	{
		name: "DAO",
		block: 1920000,
		date: "July 20, 2016",
		constant: "DAO",
	},
	{
		name: "Tangerine Whistle",
		block: 2463000,
		date: "October 18, 2016",
		constant: "TANGERINE_WHISTLE",
	},
	{
		name: "Spurious Dragon",
		block: 2675000,
		date: "November 22, 2016",
		constant: "SPURIOUS_DRAGON",
	},
	{
		name: "Byzantium",
		block: 4370000,
		date: "October 16, 2017",
		constant: "BYZANTIUM",
	},
	{
		name: "Constantinople",
		block: 7280000,
		date: "February 28, 2019",
		constant: "CONSTANTINOPLE",
	},
	{
		name: "Petersburg",
		block: 7280000,
		date: "February 28, 2019",
		constant: "PETERSBURG",
	},
	{
		name: "Istanbul",
		block: 9069000,
		date: "December 8, 2019",
		constant: "ISTANBUL",
	},
	{
		name: "Muir Glacier",
		block: 9200000,
		date: "January 2, 2020",
		constant: "MUIR_GLACIER",
	},
	{
		name: "Berlin",
		block: 12244000,
		date: "April 15, 2021",
		constant: "BERLIN",
	},
	{
		name: "London",
		block: 12965000,
		date: "August 5, 2021",
		constant: "LONDON",
	},
	{
		name: "Arrow Glacier",
		block: 13773000,
		date: "December 9, 2021",
		constant: "ARROW_GLACIER",
	},
	{
		name: "Gray Glacier",
		block: 15050000,
		date: "June 30, 2022",
		constant: "GRAY_GLACIER",
	},
	{
		name: "Merge (Paris)",
		block: 15537394,
		date: "September 15, 2022",
		constant: "MERGE",
	},
	{
		name: "Shanghai",
		block: 17034870,
		date: "April 12, 2023",
		constant: "SHANGHAI",
	},
	{
		name: "Cancun",
		block: 19426587,
		date: "March 13, 2024",
		constant: "CANCUN",
	},
	{
		name: "Prague",
		block: "TBD",
		date: "May 2025 (estimated)",
		constant: "PRAGUE",
	},
	{
		name: "Osaka",
		block: "TBD",
		date: "TBD",
		constant: "OSAKA",
	},
];

// Display all fork blocks
mainnetBlocks.forEach((fork, index) => {
	const blockNum =
		typeof fork.block === "number" ? fork.block.toLocaleString() : fork.block;
});

// Helper function to determine hardfork from block number
function hardforkAtBlock(blockNum: number): string {
	for (let i = mainnetBlocks.length - 1; i >= 0; i--) {
		const fork = mainnetBlocks[i];
		if (typeof fork.block === "number" && blockNum >= fork.block) {
			return fork.name;
		}
	}
	return "Unknown";
}

const exampleBlocks = [
	{ block: 0, description: "Genesis" },
	{ block: 1000000, description: "Early Homestead" },
	{ block: 4000000, description: "Pre-Byzantium" },
	{ block: 10000000, description: "Between Istanbul and Berlin" },
	{ block: 15000000, description: "Pre-merge" },
	{ block: 18000000, description: "Post-Shanghai" },
	{ block: 20000000, description: "Post-Cancun" },
];

exampleBlocks.forEach(({ block, description }) => {
	const fork = hardforkAtBlock(block);
});

const ranges = [
	{ start: "London", end: "Merge" },
	{ start: "Merge", end: "Shanghai" },
	{ start: "Shanghai", end: "Cancun" },
];

ranges.forEach(({ start, end }) => {
	const startFork = mainnetBlocks.find(
		(f) => f.name.toLowerCase() === start.toLowerCase(),
	);
	const endFork = mainnetBlocks.find(
		(f) => f.name.toLowerCase() === end.toLowerCase(),
	);

	if (startFork && endFork) {
		const startBlock =
			typeof startFork.block === "number" ? startFork.block : "TBD";
		const endBlock = typeof endFork.block === "number" ? endFork.block : "TBD";
		const range =
			typeof startBlock === "number" && typeof endBlock === "number"
				? (endBlock - startBlock).toLocaleString()
				: "TBD";
	}
});
