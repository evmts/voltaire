/**
 * ERC-20 balanceOf - Check token balances
 *
 * The balanceOf function returns the token balance of an account.
 */

import { Address, ERC20 } from "@tevm/voltaire";

// Create an address to check balance for
const account = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f5bEb2");

// Encode balanceOf(address) calldata
const calldata = ERC20.encodeBalanceOf(account);

console.log("=== ERC-20 balanceOf Encoding ===");
console.log("Account:", "0x742d35Cc6634C0532925a3b844Bc9e7595f5bEb2");
console.log("Selector:", ERC20.SELECTORS.balanceOf);
console.log("Encoded calldata:", calldata);

// Breakdown of the calldata:
// - First 4 bytes: function selector (0x70a08231)
// - Next 32 bytes: address padded to 32 bytes
console.log("\n=== Calldata Breakdown ===");
console.log("Selector (4 bytes):", calldata.slice(0, 10));
console.log("Address (32 bytes):", "0x" + calldata.slice(10));

// Simulating decoding a return value
// In practice, this would come from an eth_call response
const mockReturnData = "0x0000000000000000000000000000000000000000000000056bc75e2d63100000";
const balance = ERC20.decodeUint256(mockReturnData);

console.log("\n=== Decoding Return Value ===");
console.log("Raw return data:", mockReturnData);
console.log("Decoded balance:", balance.toString());
console.log("Balance in ether units (18 decimals):", Number(balance) / 1e18);
