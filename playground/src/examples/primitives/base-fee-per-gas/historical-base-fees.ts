import { BaseFeePerGas } from "voltaire";

const eip1559Launch = BaseFeePerGas.fromGwei(50n); // Initial base fee
const preMerge = BaseFeePerGas.fromGwei(25n);
const postMerge = BaseFeePerGas.fromGwei(13n);
const otherside = BaseFeePerGas.fromGwei(8000n); // Otherside land sale (May 2022)
const boredApes = BaseFeePerGas.fromGwei(1000n); // Bored Apes peak
const uniswapV3 = BaseFeePerGas.fromGwei(600n); // Uniswap V3 launch
const defiPanic = BaseFeePerGas.fromGwei(500n); // Terra collapse (May 2022)
const nightTime = BaseFeePerGas.fromGwei(8n); // 2-6 AM UTC
const morning = BaseFeePerGas.fromGwei(12n); // 6-12 PM UTC
const afternoon = BaseFeePerGas.fromGwei(20n); // 12-6 PM UTC
const evening = BaseFeePerGas.fromGwei(15n); // 6 PM-2 AM UTC
const weekday = BaseFeePerGas.fromGwei(18n);
const weekend = BaseFeePerGas.fromGwei(10n);
const recordLow = BaseFeePerGas.fromGwei(1n); // Quiet periods
const recordHigh = BaseFeePerGas.fromGwei(8000n); // Otherside

const range =
	BaseFeePerGas.toBigInt(recordHigh) / BaseFeePerGas.toBigInt(recordLow);
const lowPriority = BaseFeePerGas.fromGwei(10n);
const mediumPriority = BaseFeePerGas.fromGwei(20n);
const highPriority = BaseFeePerGas.fromGwei(50n);
