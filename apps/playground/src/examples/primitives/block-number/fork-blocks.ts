import { BlockNumber } from "@tevm/voltaire";
// Early forks
const frontier = BlockNumber(0); // Genesis
const homestead = BlockNumber(1150000); // March 2016
const daoFork = BlockNumber(1920000); // July 2016

// Metropolis era
const byzantium = BlockNumber(4370000); // October 2017
const constantinople = BlockNumber(7280000); // February 2019
const petersburg = BlockNumber(7280000); // February 2019 (same block)
const istanbul = BlockNumber(9069000); // December 2019

// Pre-merge
const muirGlacier = BlockNumber(9200000); // January 2020
const berlin = BlockNumber(12244000); // April 2021
const london = BlockNumber(12965000); // August 2021 - EIP-1559
const arrowGlacier = BlockNumber(13773000); // December 2021
const grayGlacier = BlockNumber(15050000); // June 2022

// The Merge and beyond
const paris = BlockNumber(15537394); // September 2022 - The Merge
const shanghai = BlockNumber(17034870); // April 2023 - Withdrawals
const cancun = BlockNumber(19426587); // March 2024 - Dencun (EIP-4844)

// Check what features are available at a given block
function checkFeatures(block: BlockNumber.BlockNumberType, label: string) {
	const blockNum = BlockNumber.toBigInt(block);
	const londonNum = BlockNumber.toBigInt(london);
	const parisNum = BlockNumber.toBigInt(paris);
	const shanghaiNum = BlockNumber.toBigInt(shanghai);
	const cancunNum = BlockNumber.toBigInt(cancun);
}

const testBlocks = [
	{ block: BlockNumber(12000000), label: "Pre-London" },
	{ block: BlockNumber(13000000), label: "Post-London" },
	{ block: BlockNumber(16000000), label: "Post-Merge" },
	{ block: BlockNumber(18000000), label: "Post-Shanghai" },
	{ block: BlockNumber(20000000), label: "Post-Cancun" },
];

testBlocks.forEach(({ block, label }) => checkFeatures(block, label));

const BLOCKS_PER_DAY = 7200n; // ~12 seconds per block

function blockDiff(
	newer: BlockNumber.BlockNumberType,
	older: BlockNumber.BlockNumberType,
): bigint {
	return BlockNumber.toBigInt(newer) - BlockNumber.toBigInt(older);
}
