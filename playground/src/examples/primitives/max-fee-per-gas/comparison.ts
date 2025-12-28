import { MaxFeePerGas } from "@tevm/voltaire";

// Create different fee levels
const lowFee = MaxFeePerGas.fromGwei(30n);
const mediumFee = MaxFeePerGas.fromGwei(50n);
const highFee = MaxFeePerGas.fromGwei(100n);
const ultraHighFee = MaxFeePerGas.fromGwei(200n);
const anotherMedium = MaxFeePerGas.fromGwei(50n);

// Check if user fee meets minimum
const minRequired = MaxFeePerGas.fromGwei(45n);
const userFee = MaxFeePerGas.fromGwei(50n);
const meetsMinimum = MaxFeePerGas.compare(userFee, minRequired) >= 0;
const fees = [lowFee, mediumFee, highFee, ultraHighFee];
let maxFee = fees[0];
for (const fee of fees) {
	if (MaxFeePerGas.compare(fee, maxFee) > 0) {
		maxFee = fee;
	}
}
let minFee = fees[0];
for (const fee of fees) {
	if (MaxFeePerGas.compare(fee, minFee) < 0) {
		minFee = fee;
	}
}
const sortedFees = [...fees].sort((a, b) => MaxFeePerGas.compare(a, b));
for (const fee of sortedFees) {
}
const minAllowed = MaxFeePerGas.fromGwei(1n);
const maxAllowed = MaxFeePerGas.fromGwei(1000n);
const testFee = MaxFeePerGas.fromGwei(150n);

const isAboveMin = MaxFeePerGas.compare(testFee, minAllowed) >= 0;
const isBelowMax = MaxFeePerGas.compare(testFee, maxAllowed) <= 0;
const isInRange = isAboveMin && isBelowMax;
