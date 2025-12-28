import { BaseFeePerGas } from "voltaire";

// Example: BaseFeePerGas basics - EIP-1559 base fee mechanism

// Create base fees from various units
const fee1 = BaseFeePerGas.from(25000000000n); // Wei
const fee2 = BaseFeePerGas.fromWei(30000000000n); // Wei
const fee3 = BaseFeePerGas.fromGwei(15n); // Gwei (common unit)
const fee4 = BaseFeePerGas.from("0x5d21dba00"); // Hex
const mainnetFee = BaseFeePerGas.fromGwei(25n);
const lowCongestion = BaseFeePerGas.fromGwei(15n);
const mediumCongestion = BaseFeePerGas.fromGwei(30n);
const highCongestion = BaseFeePerGas.fromGwei(100n);
const extremeCongestion = BaseFeePerGas.fromGwei(500n); // NFT drops, etc.
const currentBase = BaseFeePerGas.fromGwei(100n);
const gasTarget = 15_000_000n; // 15M gas (50% of 30M gas limit)

// Full block (30M gas used) - increase by 12.5%
const gasUsedFull = 30_000_000n;
const deltaFull = (gasUsedFull - gasTarget) * currentBase;
const nextBaseFull = currentBase + deltaFull / gasTarget / 8n;

// Empty block (0 gas used) - decrease by 12.5%
const gasUsedEmpty = 0n;
const deltaEmpty = (gasUsedEmpty - gasTarget) * currentBase;
const nextBaseEmpty = currentBase + deltaEmpty / gasTarget / 8n;
