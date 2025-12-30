/**
 * ERC-20 approve - Approval flow encoding
 *
 * The approve function allows a spender to withdraw tokens from your account,
 * up to the approved amount. This is commonly used with DEXes and other contracts.
 */

import { Address, Uint256, ERC20 } from "@tevm/voltaire";

// Setup approval parameters
const spender = Address("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"); // Uniswap V2 Router
const amount =
	Uint256(
		115792089237316195423570985008687907853269984665640564039457584007913129639935n,
	); // Max uint256

// Encode approve(address,uint256) calldata
const calldata = ERC20.encodeApprove(spender, amount);

console.log("=== ERC-20 approve Encoding ===");
console.log("Spender:", "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
console.log("Amount:", "MAX_UINT256 (unlimited approval)");
console.log("Selector:", ERC20.SELECTORS.approve);
console.log("\nEncoded calldata:", calldata);

// Breakdown of the calldata
console.log("\n=== Calldata Breakdown ===");
console.log("Selector (4 bytes):", calldata.slice(0, 10));
console.log("Spender (32 bytes):", "0x" + calldata.slice(10, 74));
console.log("Amount (32 bytes):", "0x" + calldata.slice(74));

// Common approval patterns
console.log("\n=== Common Approval Patterns ===");

// 1. Unlimited approval (common but risky)
const unlimited = Uint256(2n ** 256n - 1n);
console.log(
	"Unlimited approval:",
	ERC20.encodeApprove(spender, unlimited).slice(74),
);

// 2. Specific amount approval (safer)
const specific = Uint256(1000000000000000000000n); // 1000 tokens
console.log(
	"1000 token approval:",
	ERC20.encodeApprove(spender, specific).slice(74),
);

// 3. Zero approval (revoke)
const zero = Uint256(0n);
console.log(
	"Revoke approval (0):",
	ERC20.encodeApprove(spender, zero).slice(74),
);

// Decoding Approval event
console.log("\n=== Decoding Approval Event ===");
const mockApprovalLog = {
	topics: [
		ERC20.EVENTS.Approval,
		"0x000000000000000000000000abc0000000000000000000000000000000000001", // owner
		"0x0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d", // spender
	],
	data: "0x0000000000000000000000000000000000000000000000056bc75e2d63100000", // value
};

const decoded = ERC20.decodeApprovalEvent(mockApprovalLog);
console.log("Owner:", decoded.owner);
console.log("Spender:", decoded.spender);
console.log("Value:", decoded.value.toString());
