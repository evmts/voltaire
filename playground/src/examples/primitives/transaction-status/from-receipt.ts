import { type Uint256Type } from "@tevm/voltaire";
import { TransactionStatus } from "@tevm/voltaire";

// Simulated receipt data structures
interface Receipt {
	status?: "0x0" | "0x1";
	gasUsed: string;
	revertReason?: string;
}

const successReceipt: Receipt = {
	status: "0x1",
	gasUsed: "0x5208", // 21000 in hex
};

function statusFromReceipt(receipt: Receipt) {
	// Pre-Byzantium (no status field)
	if (receipt.status === undefined) {
		return null; // Cannot determine from receipt alone
	}

	// Post-Byzantium
	if (receipt.status === "0x1") {
		const gasUsed = BigInt(receipt.gasUsed) as Uint256Type;
		return TransactionStatus.success(gasUsed);
	}

	// Failed
	return TransactionStatus.failed(receipt.revertReason);
}

const status1 = statusFromReceipt(successReceipt);

const failedReceipt: Receipt = {
	status: "0x0",
	gasUsed: "0xc350", // 50000 in hex
	revertReason: "execution reverted: insufficient balance",
};

const status2 = statusFromReceipt(failedReceipt);

const preByzantiumReceipt: Receipt = {
	// No status field before Byzantium fork
	gasUsed: "0x5208",
};

const status3 = statusFromReceipt(preByzantiumReceipt);

// ERC20 transfer success
const erc20Success: Receipt = {
	status: "0x1",
	gasUsed: "0xfde8", // ~65000
};

// Out of gas failure
const outOfGasReceipt: Receipt = {
	status: "0x0",
	gasUsed: "0x3d090", // All gas consumed
	revertReason: "out of gas",
};

// Contract revert
const contractRevert: Receipt = {
	status: "0x0",
	gasUsed: "0x7530", // 30000
	revertReason: "execution reverted: ERC20: transfer amount exceeds allowance",
};

const examples = [
	{ name: "ERC20 Success", receipt: erc20Success },
	{ name: "Out of Gas", receipt: outOfGasReceipt },
	{ name: "Contract Revert", receipt: contractRevert },
];

for (const { name, receipt } of examples) {
	const status = statusFromReceipt(receipt);
	if (status && TransactionStatus.isSuccess(status)) {
	} else if (status && TransactionStatus.isFailed(status)) {
	}
}
