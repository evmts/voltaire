import { Selector } from "voltaire";
const transfer = Selector.fromSignature("transfer(address,uint256)");

const approve = Selector.fromSignature("approve(address,uint256)");

const mint = Selector.fromSignature("mint(address,uint256)");

const burn = Selector.fromSignature("burn(uint256)");

const burnFrom = Selector.fromSignature("burnFrom(address,uint256)");

const swap = Selector.fromSignature("swap(uint256,uint256,address,bytes)");

const swapExactTokensForTokens = Selector.fromSignature(
	"swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
);

const swapTokensForExactTokens = Selector.fromSignature(
	"swapTokensForExactTokens(uint256,uint256,address[],address,uint256)",
);

const swapExactETHForTokens = Selector.fromSignature(
	"swapExactETHForTokens(uint256,address[],address,uint256)",
);

const addLiquidity = Selector.fromSignature(
	"addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)",
);

const removeLiquidity = Selector.fromSignature(
	"removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)",
);

const deposit = Selector.fromSignature("deposit(uint256)");

const withdraw = Selector.fromSignature("withdraw(uint256)");

const borrow = Selector.fromSignature("borrow(uint256)");

const repay = Selector.fromSignature("repay(uint256)");

const liquidate = Selector.fromSignature("liquidate(address,uint256,address)");

const stake = Selector.fromSignature("stake(uint256)");

const unstake = Selector.fromSignature("unstake(uint256)");

const claim = Selector.fromSignature("claim()");

const claimRewards = Selector.fromSignature("claimRewards()");

const getReward = Selector.fromSignature("getReward()");

const propose = Selector.fromSignature(
	"propose(address[],uint256[],bytes[],string)",
);

const castVote = Selector.fromSignature("castVote(uint256,uint8)");

const execute = Selector.fromSignature("execute(uint256)");

const queue = Selector.fromSignature("queue(uint256)");

const cancel = Selector.fromSignature("cancel(uint256)");

const grantRole = Selector.fromSignature("grantRole(bytes32,address)");

const revokeRole = Selector.fromSignature("revokeRole(bytes32,address)");

const renounceRole = Selector.fromSignature("renounceRole(bytes32,address)");

const hasRole = Selector.fromSignature("hasRole(bytes32,address)");

const pause = Selector.fromSignature("pause()");

const unpause = Selector.fromSignature("unpause()");

const emergencyWithdraw = Selector.fromSignature("emergencyWithdraw()");

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
const testSel = Selector.fromHex("0xa9059cbb");
