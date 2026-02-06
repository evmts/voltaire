// Export all constants
export * from "./constants.js";
// Import Precompile namespace
import * as Precompile from "./Precompile.js";
export { Precompile };
// Calculate functions with typed imports
export { calculateCallCost } from "./calculateCallCost.js";
export { calculateCopyCost } from "./calculateCopyCost.js";
export { calculateCreateCost } from "./calculateCreateCost.js";
export { calculateKeccak256Cost } from "./calculateKeccak256Cost.js";
export { calculateLogCost } from "./calculateLogCost.js";
export { calculateMaxRefund } from "./calculateMaxRefund.js";
export { calculateMemoryExpansionCost } from "./calculateMemoryExpansionCost.js";
export { calculateSstoreCost } from "./calculateSstoreCost.js";
export { calculateTxIntrinsicGas } from "./calculateTxIntrinsicGas.js";
// Convenience functions
export { callCost } from "./callCost.js";
export { copyCost } from "./copyCost.js";
export { createCost } from "./createCost.js";
// Get functions
export { getColdAccountAccessCost } from "./getColdAccountAccessCost.js";
export { getColdSloadCost } from "./getColdSloadCost.js";
export { getSelfdestructRefund } from "./getSelfdestructRefund.js";
export { getSstoreRefund } from "./getSstoreRefund.js";
// EIP check functions
export { hasEIP1153 } from "./hasEIP1153.js";
export { hasEIP2929 } from "./hasEIP2929.js";
export { hasEIP3529 } from "./hasEIP3529.js";
export { hasEIP3860 } from "./hasEIP3860.js";
export { hasEIP4844 } from "./hasEIP4844.js";
export { keccak256Cost } from "./keccak256Cost.js";
export { logCost } from "./logCost.js";
export { maxRefund } from "./maxRefund.js";
export { memoryExpansionCost } from "./memoryExpansionCost.js";
export { sstoreCost } from "./sstoreCost.js";
export { txIntrinsicGas } from "./txIntrinsicGas.js";
// Re-import for namespace export
import { calculateCallCost } from "./calculateCallCost.js";
import { calculateCopyCost } from "./calculateCopyCost.js";
import { calculateCreateCost } from "./calculateCreateCost.js";
import { calculateKeccak256Cost } from "./calculateKeccak256Cost.js";
import { calculateLogCost } from "./calculateLogCost.js";
import { calculateMaxRefund } from "./calculateMaxRefund.js";
import { calculateMemoryExpansionCost } from "./calculateMemoryExpansionCost.js";
import { calculateSstoreCost } from "./calculateSstoreCost.js";
import { calculateTxIntrinsicGas } from "./calculateTxIntrinsicGas.js";
import { callCost } from "./callCost.js";
import { copyCost } from "./copyCost.js";
import { createCost } from "./createCost.js";
import { getColdAccountAccessCost } from "./getColdAccountAccessCost.js";
import { getColdSloadCost } from "./getColdSloadCost.js";
import { getSelfdestructRefund } from "./getSelfdestructRefund.js";
import { getSstoreRefund } from "./getSstoreRefund.js";
import { hasEIP1153 } from "./hasEIP1153.js";
import { hasEIP2929 } from "./hasEIP2929.js";
import { hasEIP3529 } from "./hasEIP3529.js";
import { hasEIP3860 } from "./hasEIP3860.js";
import { hasEIP4844 } from "./hasEIP4844.js";
import { keccak256Cost } from "./keccak256Cost.js";
import { logCost } from "./logCost.js";
import { maxRefund } from "./maxRefund.js";
import { memoryExpansionCost } from "./memoryExpansionCost.js";
import { sstoreCost } from "./sstoreCost.js";
import { txIntrinsicGas } from "./txIntrinsicGas.js";
// Namespace export
export const BrandedGasConstants = {
    calculateCallCost,
    calculateCopyCost,
    calculateCreateCost,
    calculateKeccak256Cost,
    calculateLogCost,
    calculateMaxRefund,
    calculateMemoryExpansionCost,
    calculateSstoreCost,
    calculateTxIntrinsicGas,
    callCost,
    copyCost,
    createCost,
    getColdAccountAccessCost,
    getColdSloadCost,
    getSelfdestructRefund,
    getSstoreRefund,
    hasEIP1153,
    hasEIP2929,
    hasEIP3529,
    hasEIP3860,
    hasEIP4844,
    keccak256Cost,
    logCost,
    maxRefund,
    memoryExpansionCost,
    Precompile,
    sstoreCost,
    txIntrinsicGas,
};
