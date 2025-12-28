import { Gas } from "voltaire";
const baseEstimate = 100000;

// Conservative 10%
const buffer10 = Math.floor(baseEstimate * 1.1);
const limit10 = Gas.gasLimitFrom(buffer10);

// Standard 20%
const buffer20 = Math.floor(baseEstimate * 1.2);
const limit20 = Gas.gasLimitFrom(buffer20);

// Safe 30%
const buffer30 = Math.floor(baseEstimate * 1.3);
const limit30 = Gas.gasLimitFrom(buffer30);

// Aggressive 50%
const buffer50 = Math.floor(baseEstimate * 1.5);
const limit50 = Gas.gasLimitFrom(buffer50);

// Simple transfers
const ethTransfer = 21000;
const ethBuffer = Math.floor(ethTransfer * 1.1); // 10% is safe

// ERC20 transfers
const erc20Transfer = 65000;
const erc20Buffer = Math.floor(erc20Transfer * 1.2); // 20% for contract calls

// Complex DeFi
const defiOp = 300000;
const defiBuffer = Math.floor(defiOp * 1.3); // 30% for complexity

// Unpredictable contracts
const unknownContract = 200000;
const unknownBuffer = Math.floor(unknownContract * 1.5); // 50% for unknown
function calculateGasLimit(estimate: number, bufferPercent: number): bigint {
	const multiplier = 1 + bufferPercent / 100;
	const withBuffer = Math.floor(estimate * multiplier);
	return Gas.gasLimitToBigInt(withBuffer);
}
