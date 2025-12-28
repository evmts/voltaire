/**
 * Example 4: Gas Types and Constants
 *
 * Demonstrates:
 * - Gas limit and gas price types
 * - Gas constants for various operations
 * - Working with gas values
 */

import { Bytes } from "../../src/primitives/Bytes/index.js";
import * as Gas from "../../src/primitives/Gas/index.js";
import * as GasConstants from "../../src/primitives/GasConstants/index.js";

// Gas limit examples
const simpleTransferLimit = Gas.GasLimit.from(21000); // Standard ETH transfer
const erc20TransferLimit = Gas.GasLimit.from(65000); // Typical ERC20 transfer

// Gas price examples (in wei)
const gasPriceWei = Gas.GasPrice.from(20000000000n); // 20 gwei
const gasPriceFromGwei = Gas.GasPrice.fromGwei(50); // 50 gwei

// Convert gas price to gwei for display
const gweiValue = Gas.GasPrice.toGwei(gasPriceWei);

// Gas constants - opcode costs
const addCost = GasConstants.FastestStep; // 3 gas for ADD
const mulCost = GasConstants.FastStep; // 5 gas for MUL
const keccak256Base = GasConstants.Keccak256Base; // 30 gas base cost
const sloadCost = GasConstants.Sload; // 100 gas for warm SLOAD
const coldSloadCost = GasConstants.ColdSload; // 2100 gas for cold SLOAD

// Calculate transaction intrinsic gas
const emptyTxData = Bytes.from([]);
const intrinsicGas = GasConstants.calculateTxIntrinsGas(emptyTxData, false);

// Memory expansion cost
const memSize = 1024n; // bytes
const prevSize = 0n;
const memCost = GasConstants.calculateMemoryExpansionCost(memSize, prevSize);

// Note: For EIP-1559 base fee calculations and other advanced gas calculations,
// see the BaseFeePerGas, EffectiveGasPrice, and other gas-related modules.
