/**
 * ERC-20 allowance - Check token allowances
 *
 * The allowance function returns the remaining number of tokens that a spender
 * is allowed to spend on behalf of an owner.
 */

import { Address, ERC20 } from "@tevm/voltaire";

// Setup allowance check parameters
const owner = Address("0xABc0000000000000000000000000000000000001");
const spender = Address("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"); // Uniswap V2 Router

// Encode allowance(address,address) calldata
const calldata = ERC20.encodeAllowance(owner, spender);

console.log("=== ERC-20 allowance Encoding ===");
console.log("Owner:", "0xABc0000000000000000000000000000000000001");
console.log("Spender:", "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
console.log("Selector:", ERC20.SELECTORS.allowance);
console.log("\nEncoded calldata:", calldata);

// Breakdown of the calldata
console.log("\n=== Calldata Breakdown ===");
console.log("Selector (4 bytes):", calldata.slice(0, 10));
console.log("Owner (32 bytes):", "0x" + calldata.slice(10, 74));
console.log("Spender (32 bytes):", "0x" + calldata.slice(74));

// Decoding various allowance return values
console.log("\n=== Decoding Allowance Return Values ===");

// Zero allowance
const zeroAllowance =
	"0x0000000000000000000000000000000000000000000000000000000000000000";
console.log("Zero allowance:", ERC20.decodeUint256(zeroAllowance).toString());

// Specific allowance (100 tokens)
const specificAllowance =
	"0x0000000000000000000000000000000000000000000000056bc75e2d63100000";
console.log(
	"100 token allowance:",
	ERC20.decodeUint256(specificAllowance).toString(),
);
console.log(
	"  In token units:",
	Number(ERC20.decodeUint256(specificAllowance)) / 1e18,
);

// Unlimited allowance (max uint256)
const unlimitedAllowance =
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
console.log(
	"Unlimited allowance:",
	ERC20.decodeUint256(unlimitedAllowance).toString(),
);

// Checking multiple spenders for same owner
console.log("\n=== Checking Multiple Spenders ===");
const spenders = [
	{
		name: "Uniswap V2",
		address: Address("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"),
	},
	{
		name: "Uniswap V3",
		address: Address("0xE592427A0AEce92De3Edee1F18E0157C05861564"),
	},
	{
		name: "1inch",
		address: Address("0x1111111254fb6c44bAC0beD2854e76F90643097d"),
	},
];

for (const { name, address } of spenders) {
	const data = ERC20.encodeAllowance(owner, address);
	console.log(`${name}: ${data}`);
}
