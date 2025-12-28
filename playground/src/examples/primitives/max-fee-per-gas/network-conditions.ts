import { MaxFeePerGas } from "voltaire";

const lowCongestionBase = 12n; // Gwei
const lowCongestionPriority = 1n; // Gwei
const lowCongestionMax = MaxFeePerGas.fromGwei(
	lowCongestionBase + lowCongestionPriority + 3n,
);
const normalBase = 25n; // Gwei
const normalPriority = 2n; // Gwei
const normalMax = MaxFeePerGas.fromGwei(normalBase + normalPriority + 8n);
const highBase = 150n; // Gwei
const highPriority = 10n; // Gwei
const highMax = MaxFeePerGas.fromGwei(highBase + highPriority + 40n);
const extremeBase = 500n; // Gwei
const extremePriority = 50n; // Gwei
const extremeMax = MaxFeePerGas.fromGwei(extremeBase + extremePriority + 100n);
const weekendBase = 18n;
const weekdayBase = 35n;
const standardPriority = 2n;

const weekendMax = MaxFeePerGas.fromGwei(weekendBase + standardPriority + 5n);
const weekdayMax = MaxFeePerGas.fromGwei(weekdayBase + standardPriority + 10n);

// Urgent: willing to pay premium
const urgentMax = MaxFeePerGas.fromGwei(normalBase * 3n + 10n);

// Standard: normal timeframe
const standardMax = MaxFeePerGas.fromGwei(normalBase + 2n + 8n);

// Patient: can wait for better prices
const patientMax = MaxFeePerGas.fromGwei(normalBase / 2n + 1n);
const currentBase = 40n;
const targetBlocks = 3; // Want inclusion within 3 blocks

// Calculate with 12.5% per block increase buffer
let projectedBase = currentBase;
for (let i = 0; i < targetBlocks; i++) {
	projectedBase = (projectedBase * 1125n) / 1000n;
}
const dynamicMax = MaxFeePerGas.fromGwei(projectedBase + 2n);
