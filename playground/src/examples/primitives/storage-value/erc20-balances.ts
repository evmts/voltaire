import * as StorageValue from "../../../primitives/StorageValue/index.js";

// Example: ERC20 token balance storage patterns

// ERC20 balances are typically stored as uint256 values
// Storage layout: mapping(address => uint256) balances at slot 0

// Sample balances for different accounts
const balance1 = StorageValue.from(1000n * 10n ** 18n); // 1000 tokens
const balance2 = StorageValue.from(500n * 10n ** 18n); // 500 tokens
const balance3 = StorageValue.from(250n * 10n ** 18n); // 250 tokens

console.log("Account balances (18 decimals):");
console.log("Balance 1:", StorageValue.toHex(balance1));
console.log("As tokens:", Number(StorageValue.toUint256(balance1)) / 1e18);

console.log("\nBalance 2:", StorageValue.toHex(balance2));
console.log("As tokens:", Number(StorageValue.toUint256(balance2)) / 1e18);

console.log("\nBalance 3:", StorageValue.toHex(balance3));
console.log("As tokens:", Number(StorageValue.toUint256(balance3)) / 1e18);

// Zero balance (uninitialized or spent)
const zeroBalance = StorageValue.from(0n);
console.log("\nZero balance:", StorageValue.toHex(zeroBalance));
console.log("Is empty:", StorageValue.toUint256(zeroBalance) === 0n);

// Maximum possible balance (max uint256)
const maxBalance = StorageValue.from(2n ** 256n - 1n);
console.log("\nMax balance:", StorageValue.toHex(maxBalance));

// Total supply storage (common at slot 2)
const totalSupply = StorageValue.from(1_000_000n * 10n ** 18n); // 1M tokens
console.log("\nTotal supply:", StorageValue.toHex(totalSupply));
console.log("As tokens:", Number(StorageValue.toUint256(totalSupply)) / 1e18);

// Allowance storage: mapping(address => mapping(address => uint256))
const allowance = StorageValue.from(100n * 10n ** 18n); // Approved 100 tokens
console.log("\nAllowance:", StorageValue.toHex(allowance));
console.log("As tokens:", Number(StorageValue.toUint256(allowance)) / 1e18);

// Unlimited allowance (common pattern: max uint256)
const unlimitedAllowance = StorageValue.from(2n ** 256n - 1n);
console.log("\nUnlimited allowance:", StorageValue.toHex(unlimitedAllowance));
console.log(
	"Is unlimited:",
	StorageValue.toUint256(unlimitedAllowance) === 2n ** 256n - 1n,
);

// Balance arithmetic (simulating transfers)
const senderBalance = StorageValue.from(1000n * 10n ** 18n);
const transferAmount = 250n * 10n ** 18n;

const newSenderBalance = StorageValue.from(
	StorageValue.toUint256(senderBalance) - transferAmount,
);
const receiverBalance = StorageValue.from(0n);
const newReceiverBalance = StorageValue.from(
	StorageValue.toUint256(receiverBalance) + transferAmount,
);

console.log("\nTransfer simulation:");
console.log(
	"Sender before:",
	Number(StorageValue.toUint256(senderBalance)) / 1e18,
);
console.log("Transfer amount:", Number(transferAmount) / 1e18);
console.log(
	"Sender after:",
	Number(StorageValue.toUint256(newSenderBalance)) / 1e18,
);
console.log(
	"Receiver after:",
	Number(StorageValue.toUint256(newReceiverBalance)) / 1e18,
);

// Different decimal precisions
const usdc6Decimals = StorageValue.from(1000n * 10n ** 6n); // USDC uses 6
const dai18Decimals = StorageValue.from(1000n * 10n ** 18n); // DAI uses 18

console.log("\nDifferent decimals:");
console.log("USDC (6 decimals):", StorageValue.toHex(usdc6Decimals));
console.log("Amount:", Number(StorageValue.toUint256(usdc6Decimals)) / 1e6);
console.log("DAI (18 decimals):", StorageValue.toHex(dai18Decimals));
console.log("Amount:", Number(StorageValue.toUint256(dai18Decimals)) / 1e18);

// Checking balance thresholds
const balance = StorageValue.from(750n * 10n ** 18n);
const threshold = 500n * 10n ** 18n;

console.log("\nBalance threshold check:");
console.log("Balance:", Number(StorageValue.toUint256(balance)) / 1e18);
console.log("Threshold:", Number(threshold) / 1e18);
console.log("Meets threshold:", StorageValue.toUint256(balance) >= threshold);

// Small balance (dust)
const dust = StorageValue.from(1n); // 1 wei
console.log("\nDust balance:", StorageValue.toHex(dust));
console.log("In wei:", StorageValue.toUint256(dust));
console.log("In tokens:", Number(StorageValue.toUint256(dust)) / 1e18);
