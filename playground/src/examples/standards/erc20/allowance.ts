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

// Zero allowance
const zeroAllowance =
	"0x0000000000000000000000000000000000000000000000000000000000000000";

// Specific allowance (100 tokens)
const specificAllowance =
	"0x0000000000000000000000000000000000000000000000056bc75e2d63100000";

// Unlimited allowance (max uint256)
const unlimitedAllowance =
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
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
}
