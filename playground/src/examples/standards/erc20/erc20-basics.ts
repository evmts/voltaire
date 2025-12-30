/**
 * ERC-20 Basics - Overview of the ERC-20 fungible token interface
 *
 * ERC-20 defines a standard interface for fungible tokens on Ethereum.
 * All tokens of the same type are identical and interchangeable.
 */

import { ERC20 } from "@tevm/voltaire";

// === Function Selectors ===
// First 4 bytes of keccak256 hash of function signature
console.log("=== ERC-20 Function Selectors ===");
console.log("totalSupply():", ERC20.SELECTORS.totalSupply);
console.log("balanceOf(address):", ERC20.SELECTORS.balanceOf);
console.log("transfer(address,uint256):", ERC20.SELECTORS.transfer);
console.log(
	"transferFrom(address,address,uint256):",
	ERC20.SELECTORS.transferFrom,
);
console.log("approve(address,uint256):", ERC20.SELECTORS.approve);
console.log("allowance(address,address):", ERC20.SELECTORS.allowance);
console.log("name():", ERC20.SELECTORS.name);
console.log("symbol():", ERC20.SELECTORS.symbol);
console.log("decimals():", ERC20.SELECTORS.decimals);

// EIP-2612 Permit extension selectors
console.log("\n=== EIP-2612 Permit Extension ===");
console.log("permit(...):", ERC20.SELECTORS.permit);
console.log("nonces(address):", ERC20.SELECTORS.nonces);
console.log("DOMAIN_SEPARATOR():", ERC20.SELECTORS.DOMAIN_SEPARATOR);

// === Event Signatures ===
// keccak256 hash of event signature
console.log("\n=== ERC-20 Event Signatures ===");
console.log("Transfer(address,address,uint256):", ERC20.EVENTS.Transfer);
console.log("Approval(address,address,uint256):", ERC20.EVENTS.Approval);

// === Available Encoding Functions ===
console.log("\n=== Available Encoding Functions ===");
console.log("encodeTransfer(to, amount) - Encode transfer calldata");
console.log("encodeApprove(spender, amount) - Encode approve calldata");
console.log(
	"encodeTransferFrom(from, to, amount) - Encode transferFrom calldata",
);
console.log("encodeBalanceOf(account) - Encode balanceOf calldata");
console.log("encodeAllowance(owner, spender) - Encode allowance calldata");

// === Available Decoding Functions ===
console.log("\n=== Available Decoding Functions ===");
console.log("decodeTransferEvent(log) - Decode Transfer event");
console.log("decodeApprovalEvent(log) - Decode Approval event");
console.log("decodeUint256(data) - Decode uint256 return value");
console.log("decodeAddress(data) - Decode address return value");
console.log("decodeBool(data) - Decode bool return value");
console.log("decodeString(data) - Decode string return value");
