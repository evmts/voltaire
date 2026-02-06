import { Hardfork } from "@tevm/voltaire";
const forkDetails = [
	{
		name: "Frontier",
		date: "July 2015",
		description: "Original Ethereum launch with base EVM",
	},
	{
		name: "Homestead",
		date: "March 2016",
		description: "Added DELEGATECALL, fixed critical issues",
	},
	{
		name: "DAO",
		date: "July 2016",
		description: "Emergency fork for DAO hack recovery",
	},
	{
		name: "Tangerine Whistle",
		date: "October 2016",
		description: "EIP-150: Gas repricing for IO operations",
	},
	{
		name: "Spurious Dragon",
		date: "November 2016",
		description: "EIP-161: State cleaning, removed empty accounts",
	},
	{
		name: "Byzantium",
		date: "October 2017",
		description: "Added REVERT, STATICCALL, return data opcodes",
	},
	{
		name: "Constantinople",
		date: "February 2019",
		description: "Added CREATE2, shift opcodes, EXTCODEHASH",
	},
	{
		name: "Petersburg",
		date: "February 2019",
		description: "Removed EIP-1283 due to reentrancy concerns",
	},
	{
		name: "Istanbul",
		date: "December 2019",
		description: "Added CHAINID, SELFBALANCE, rebalanced SSTORE",
	},
	{
		name: "Muir Glacier",
		date: "January 2020",
		description: "Difficulty bomb delay, no EVM changes",
	},
	{
		name: "Berlin",
		date: "April 2021",
		description: "EIP-2929: Cold/warm access pricing",
	},
	{
		name: "London",
		date: "August 2021",
		description: "EIP-1559: Fee market reform, BASEFEE opcode",
	},
	{
		name: "Arrow Glacier",
		date: "December 2021",
		description: "Difficulty bomb delay",
	},
	{
		name: "Gray Glacier",
		date: "June 2022",
		description: "Final difficulty bomb delay before merge",
	},
	{
		name: "Merge (Paris)",
		date: "September 2022",
		description: "Proof of Stake transition, PREVRANDAO",
	},
	{
		name: "Shanghai",
		date: "April 2023",
		description: "Withdrawals enabled, EIP-3855: PUSH0",
	},
	{
		name: "Cancun",
		date: "March 2024",
		description: "EIP-4844: Blobs, EIP-1153: Transient storage",
	},
	{
		name: "Prague",
		date: "May 2025",
		description: "EIP-2537: BLS precompiles, EIP-7702: EOA code",
	},
	{
		name: "Osaka",
		date: "TBD",
		description: "Future upgrades",
	},
];

// Display all forks
forkDetails.forEach((fork, index) => {});

// Programmatic access
const allForks = Hardfork.allNames();
const allIds = Hardfork.allIds();
