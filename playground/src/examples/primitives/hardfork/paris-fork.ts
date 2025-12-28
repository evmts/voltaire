import { Hardfork } from "@tevm/voltaire";
const merge = Hardfork.MERGE;
const paris = Hardfork.fromString("paris"); // Alias for merge
const prePost = [
	{ name: "Berlin", date: "April 2021" },
	{ name: "London", date: "August 2021" },
	{ name: "Arrow Glacier", date: "December 2021" },
	{ name: "Gray Glacier", date: "June 2022" },
	{ name: "Merge", date: "September 2022" },
	{ name: "Shanghai", date: "April 2023" },
	{ name: "Cancun", date: "March 2024" },
];

prePost.forEach(({ name, date }) => {
	const fork = Hardfork.fromString(name.toLowerCase().replace(" ", ""));
	const status = fork && Hardfork.isPostMerge(fork) ? "[PoS]" : "[PoW]";
});
