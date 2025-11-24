import * as Selector from "../../../primitives/Selector/index.js";

// Example: Common DeFi and protocol function selectors

console.log("=== Common DeFi Function Selectors ===\n");

console.log("--- Token Operations ---\n");

const transfer = Selector.fromSignature("transfer(address,uint256)");
console.log(`transfer:      ${Selector.toHex(transfer)}`);

const approve = Selector.fromSignature("approve(address,uint256)");
console.log(`approve:       ${Selector.toHex(approve)}`);

const mint = Selector.fromSignature("mint(address,uint256)");
console.log(`mint:          ${Selector.toHex(mint)}`);

const burn = Selector.fromSignature("burn(uint256)");
console.log(`burn:          ${Selector.toHex(burn)}`);

const burnFrom = Selector.fromSignature("burnFrom(address,uint256)");
console.log(`burnFrom:      ${Selector.toHex(burnFrom)}\n`);

console.log("--- DEX / Swap Operations ---\n");

const swap = Selector.fromSignature("swap(uint256,uint256,address,bytes)");
console.log(`swap (Uniswap V2):           ${Selector.toHex(swap)}`);

const swapExactTokensForTokens = Selector.fromSignature(
	"swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
);
console.log(
	`swapExactTokensForTokens:    ${Selector.toHex(swapExactTokensForTokens)}`,
);

const swapTokensForExactTokens = Selector.fromSignature(
	"swapTokensForExactTokens(uint256,uint256,address[],address,uint256)",
);
console.log(
	`swapTokensForExactTokens:    ${Selector.toHex(swapTokensForExactTokens)}`,
);

const swapExactETHForTokens = Selector.fromSignature(
	"swapExactETHForTokens(uint256,address[],address,uint256)",
);
console.log(
	`swapExactETHForTokens:       ${Selector.toHex(swapExactETHForTokens)}`,
);

const addLiquidity = Selector.fromSignature(
	"addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
);
console.log(`addLiquidity:                ${Selector.toHex(addLiquidity)}`);

const removeLiquidity = Selector.fromSignature(
	"removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)",
);
console.log(
	`removeLiquidity:             ${Selector.toHex(removeLiquidity)}\n`,
);

console.log("--- Lending / Borrowing ---\n");

const deposit = Selector.fromSignature("deposit(uint256)");
console.log(`deposit:       ${Selector.toHex(deposit)}`);

const withdraw = Selector.fromSignature("withdraw(uint256)");
console.log(`withdraw:      ${Selector.toHex(withdraw)}`);

const borrow = Selector.fromSignature("borrow(uint256)");
console.log(`borrow:        ${Selector.toHex(borrow)}`);

const repay = Selector.fromSignature("repay(uint256)");
console.log(`repay:         ${Selector.toHex(repay)}`);

const liquidate = Selector.fromSignature("liquidate(address,uint256,address)");
console.log(`liquidate:     ${Selector.toHex(liquidate)}\n`);

console.log("--- Staking ---\n");

const stake = Selector.fromSignature("stake(uint256)");
console.log(`stake:         ${Selector.toHex(stake)}`);

const unstake = Selector.fromSignature("unstake(uint256)");
console.log(`unstake:       ${Selector.toHex(unstake)}`);

const claim = Selector.fromSignature("claim()");
console.log(`claim:         ${Selector.toHex(claim)}`);

const claimRewards = Selector.fromSignature("claimRewards()");
console.log(`claimRewards:  ${Selector.toHex(claimRewards)}`);

const getReward = Selector.fromSignature("getReward()");
console.log(`getReward:     ${Selector.toHex(getReward)}\n`);

console.log("--- Governance ---\n");

const propose = Selector.fromSignature(
	"propose(address[],uint256[],bytes[],string)",
);
console.log(`propose:       ${Selector.toHex(propose)}`);

const castVote = Selector.fromSignature("castVote(uint256,uint8)");
console.log(`castVote:      ${Selector.toHex(castVote)}`);

const execute = Selector.fromSignature("execute(uint256)");
console.log(`execute:       ${Selector.toHex(execute)}`);

const queue = Selector.fromSignature("queue(uint256)");
console.log(`queue:         ${Selector.toHex(queue)}`);

const cancel = Selector.fromSignature("cancel(uint256)");
console.log(`cancel:        ${Selector.toHex(cancel)}\n`);

console.log("--- Access Control ---\n");

const grantRole = Selector.fromSignature("grantRole(bytes32,address)");
console.log(`grantRole:     ${Selector.toHex(grantRole)}`);

const revokeRole = Selector.fromSignature("revokeRole(bytes32,address)");
console.log(`revokeRole:    ${Selector.toHex(revokeRole)}`);

const renounceRole = Selector.fromSignature("renounceRole(bytes32,address)");
console.log(`renounceRole:  ${Selector.toHex(renounceRole)}`);

const hasRole = Selector.fromSignature("hasRole(bytes32,address)");
console.log(`hasRole:       ${Selector.toHex(hasRole)}\n`);

console.log("--- Emergency Functions ---\n");

const pause = Selector.fromSignature("pause()");
console.log(`pause:         ${Selector.toHex(pause)}`);

const unpause = Selector.fromSignature("unpause()");
console.log(`unpause:       ${Selector.toHex(unpause)}`);

const emergencyWithdraw = Selector.fromSignature("emergencyWithdraw()");
console.log(`emergencyWithdraw: ${Selector.toHex(emergencyWithdraw)}\n`);

console.log("=== Building Selector Registry ===\n");

const registry = new Map<string, string>([
	[Selector.toHex(transfer), "transfer(address,uint256)"],
	[Selector.toHex(approve), "approve(address,uint256)"],
	[Selector.toHex(mint), "mint(address,uint256)"],
	[Selector.toHex(burn), "burn(uint256)"],
	[Selector.toHex(swap), "swap(uint256,uint256,address,bytes)"],
	[Selector.toHex(stake), "stake(uint256)"],
	[Selector.toHex(claim), "claim()"],
	[Selector.toHex(pause), "pause()"],
]);

console.log("Registry lookup:");
const testSel = Selector.fromHex("0xa9059cbb");
console.log(
	`  ${Selector.toHex(testSel)} -> ${registry.get(Selector.toHex(testSel))}`,
);
