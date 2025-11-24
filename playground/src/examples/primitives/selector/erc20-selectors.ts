import * as Selector from "../../../primitives/Selector/index.js";

// Example: ERC20 function selectors

console.log("=== ERC20 Token Standard Selectors ===\n");

console.log("--- Core Transfer Functions ---\n");

const transfer = Selector.fromSignature("transfer(address,uint256)");
console.log(`transfer(address,uint256)`);
console.log(`  Selector: ${Selector.toHex(transfer)}`);
console.log(`  Usage: Transfer tokens to another address\n`);

const transferFrom = Selector.fromSignature(
	"transferFrom(address,address,uint256)",
);
console.log(`transferFrom(address,address,uint256)`);
console.log(`  Selector: ${Selector.toHex(transferFrom)}`);
console.log(`  Usage: Transfer tokens on behalf of owner\n`);

console.log("--- Approval Functions ---\n");

const approve = Selector.fromSignature("approve(address,uint256)");
console.log(`approve(address,uint256)`);
console.log(`  Selector: ${Selector.toHex(approve)}`);
console.log(`  Usage: Approve spender to transfer tokens\n`);

const increaseAllowance = Selector.fromSignature(
	"increaseAllowance(address,uint256)",
);
console.log(`increaseAllowance(address,uint256)`);
console.log(`  Selector: ${Selector.toHex(increaseAllowance)}`);
console.log(`  Usage: Increase approved amount (ERC20 extension)\n`);

const decreaseAllowance = Selector.fromSignature(
	"decreaseAllowance(address,uint256)",
);
console.log(`decreaseAllowance(address,uint256)`);
console.log(`  Selector: ${Selector.toHex(decreaseAllowance)}`);
console.log(`  Usage: Decrease approved amount (ERC20 extension)\n`);

console.log("--- View Functions ---\n");

const balanceOf = Selector.fromSignature("balanceOf(address)");
console.log(`balanceOf(address)`);
console.log(`  Selector: ${Selector.toHex(balanceOf)}`);
console.log(`  Usage: Get token balance of address\n`);

const allowance = Selector.fromSignature("allowance(address,address)");
console.log(`allowance(address,address)`);
console.log(`  Selector: ${Selector.toHex(allowance)}`);
console.log(`  Usage: Get approved amount for spender\n`);

const totalSupply = Selector.fromSignature("totalSupply()");
console.log(`totalSupply()`);
console.log(`  Selector: ${Selector.toHex(totalSupply)}`);
console.log(`  Usage: Get total token supply\n`);

console.log("--- Metadata Functions ---\n");

const name = Selector.fromSignature("name()");
console.log(`name()`);
console.log(`  Selector: ${Selector.toHex(name)}`);
console.log(`  Usage: Get token name\n`);

const symbol = Selector.fromSignature("symbol()");
console.log(`symbol()`);
console.log(`  Selector: ${Selector.toHex(symbol)}`);
console.log(`  Usage: Get token symbol\n`);

const decimals = Selector.fromSignature("decimals()");
console.log(`decimals()`);
console.log(`  Selector: ${Selector.toHex(decimals)}`);
console.log(`  Usage: Get token decimals\n`);

console.log("=== Selector Lookup ===\n");

const selectorMap = new Map([
	[Selector.toHex(transfer), "transfer(address,uint256)"],
	[Selector.toHex(transferFrom), "transferFrom(address,address,uint256)"],
	[Selector.toHex(approve), "approve(address,uint256)"],
	[Selector.toHex(balanceOf), "balanceOf(address)"],
	[Selector.toHex(allowance), "allowance(address,address)"],
]);

const unknownSel = Selector.fromHex("0xa9059cbb");
const signature = selectorMap.get(Selector.toHex(unknownSel));
console.log(`Selector ${Selector.toHex(unknownSel)} -> ${signature}`);
