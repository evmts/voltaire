import { Gas } from "voltaire";
// Use constants for well-known operations
const ethTransfer = Gas.gasLimitFrom(Gas.SIMPLE_TRANSFER);

const erc20Transfer = Gas.gasLimitFrom(Gas.ERC20_TRANSFER);

const historicalAverage = 120000;
const historicalWithBuffer = Math.floor(historicalAverage * 1.2);

const simulatedEstimate = 145000;
const simulatedWithBuffer = Math.floor(simulatedEstimate * 1.2);

const conservativeLimit = Gas.gasLimitFrom(500000);

// Example: Multi-step transaction
const baseTransaction = 21000;
const storageWrites = 2 * 20000; // Two new storage slots
const externalCall = 50000; // Call to another contract
const computation = 5000; // Various operations

const totalEstimate =
	baseTransaction + storageWrites + externalCall + computation;
const finalLimit = Math.floor(totalEstimate * 1.25); // 25% buffer

const gasLimit = Gas.gasLimitFrom(finalLimit);
