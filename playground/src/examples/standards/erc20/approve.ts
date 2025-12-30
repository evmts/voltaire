/**
 * ERC-20 approve - Approval flow encoding
 *
 * The approve function allows a spender to withdraw tokens from your account,
 * up to the approved amount. This is commonly used with DEXes and other contracts.
 */

import { Address, ERC20, Uint256 } from "@tevm/voltaire";

// Setup approval parameters
const spender = Address("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"); // Uniswap V2 Router
const amount =
	Uint256(
		115792089237316195423570985008687907853269984665640564039457584007913129639935n,
	); // Max uint256

// Encode approve(address,uint256) calldata
const calldata = ERC20.encodeApprove(spender, amount);

// 1. Unlimited approval (common but risky)
const unlimited = Uint256(2n ** 256n - 1n);

// 2. Specific amount approval (safer)
const specific = Uint256(1000000000000000000000n); // 1000 tokens

// 3. Zero approval (revoke)
const zero = Uint256(0n);
const mockApprovalLog = {
	topics: [
		ERC20.EVENTS.Approval,
		"0x000000000000000000000000abc0000000000000000000000000000000000001", // owner
		"0x0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d", // spender
	],
	data: "0x0000000000000000000000000000000000000000000000056bc75e2d63100000", // value
};

const decoded = ERC20.decodeApprovalEvent(mockApprovalLog);
