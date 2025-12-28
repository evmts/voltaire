import { StorageValue } from "voltaire";

// Example: ERC20 token balance storage patterns

// ERC20 balances are typically stored as uint256 values
// Storage layout: mapping(address => uint256) balances at slot 0

// Sample balances for different accounts
const balance1 = StorageValue.from(1000n * 10n ** 18n); // 1000 tokens
const balance2 = StorageValue.from(500n * 10n ** 18n); // 500 tokens
const balance3 = StorageValue.from(250n * 10n ** 18n); // 250 tokens

// Zero balance (uninitialized or spent)
const zeroBalance = StorageValue.from(0n);

// Maximum possible balance (max uint256)
const maxBalance = StorageValue.from(2n ** 256n - 1n);

// Total supply storage (common at slot 2)
const totalSupply = StorageValue.from(1_000_000n * 10n ** 18n); // 1M tokens

// Allowance storage: mapping(address => mapping(address => uint256))
const allowance = StorageValue.from(100n * 10n ** 18n); // Approved 100 tokens

// Unlimited allowance (common pattern: max uint256)
const unlimitedAllowance = StorageValue.from(2n ** 256n - 1n);

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

// Different decimal precisions
const usdc6Decimals = StorageValue.from(1000n * 10n ** 6n); // USDC uses 6
const dai18Decimals = StorageValue.from(1000n * 10n ** 18n); // DAI uses 18

// Checking balance thresholds
const balance = StorageValue.from(750n * 10n ** 18n);
const threshold = 500n * 10n ** 18n;

// Small balance (dust)
const dust = StorageValue.from(1n); // 1 wei
