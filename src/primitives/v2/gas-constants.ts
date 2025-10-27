/**
 * EVM Gas Cost Constants and Utilities
 *
 * Complete gas cost definitions for EVM execution according to the Ethereum
 * Yellow Paper and various EIPs. All constants namespaced under Gas for
 * intuitive access with both standard and convenience forms.
 *
 * @example
 * ```typescript
 * import { Gas } from './gas-constants.js';
 *
 * // Basic opcode costs
 * const cost = Gas.QuickStep; // 2 gas
 * const sloadCost = Gas.Sload; // 100 gas
 *
 * // Calculate costs
 * const keccakCost = Gas.calculateKeccak256Cost(data);
 * const memoryCost = Gas.calculateMemoryExpansionCost(oldSize, newSize);
 *
 * // Convenience form with this:
 * const config: Gas.Config = { hardfork: 'london' };
 * const callCost = Gas.calculateCallCost.call(config, isWarm, hasValue, isNewAccount);
 * ```
 */

// ============================================================================
// Main Gas Namespace
// ============================================================================

export namespace Gas {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  /**
   * Ethereum hardfork identifiers
   */
  export type Hardfork =
    | "homestead"
    | "byzantium"
    | "constantinople"
    | "istanbul"
    | "berlin"
    | "london"
    | "paris"
    | "shanghai"
    | "cancun";

  /**
   * Gas configuration for hardfork-specific calculations
   */
  export type Config = {
    hardfork: Hardfork;
  };

  /**
   * Gas cost calculation result
   */
  export type CostResult = {
    base: bigint;
    dynamic: bigint;
    total: bigint;
  };

  /**
   * Memory expansion details
   */
  export type MemoryExpansion = {
    oldCost: bigint;
    newCost: bigint;
    expansionCost: bigint;
    words: bigint;
  };

  /**
   * Call operation details
   */
  export type CallDetails = {
    isWarm: boolean;
    hasValue: boolean;
    isNewAccount: boolean;
    gas: bigint;
  };

  // ==========================================================================
  // Basic Opcode Costs
  // ==========================================================================

  /**
   * Very cheap operations (2 gas)
   * ADDRESS, ORIGIN, CALLER, CALLVALUE, CALLDATASIZE, CODESIZE,
   * GASPRICE, RETURNDATASIZE, PC, MSIZE, GAS, CHAINID, SELFBALANCE
   */
  export const QuickStep = 2n;

  /**
   * Simple arithmetic and logic (3 gas)
   * ADD, SUB, NOT, LT, GT, SLT, SGT, EQ, ISZERO, AND, OR, XOR,
   * CALLDATALOAD, MLOAD, MSTORE, MSTORE8, PUSH, DUP, SWAP
   */
  export const FastestStep = 3n;

  /**
   * Multiplication and division (5 gas)
   * MUL, DIV, SDIV, MOD, SMOD
   */
  export const FastStep = 5n;

  /**
   * Advanced arithmetic (8 gas)
   * ADDMOD, MULMOD, SIGNEXTEND
   */
  export const MidStep = 8n;

  /**
   * Moderate computation (10 gas)
   * JUMPI
   */
  export const SlowStep = 10n;

  /**
   * External account interaction (20 gas)
   * BALANCE, EXTCODESIZE, BLOCKHASH
   */
  export const ExtStep = 20n;

  // ==========================================================================
  // Hashing Operations
  // ==========================================================================

  /**
   * Base cost for KECCAK256 (30 gas)
   */
  export const Keccak256Base = 30n;

  /**
   * Per-word cost for KECCAK256 (6 gas per 32 bytes)
   */
  export const Keccak256Word = 6n;

  /**
   * Calculate KECCAK256 gas cost
   *
   * @param dataSize - Size of data in bytes
   * @returns Total gas cost
   *
   * @example
   * ```typescript
   * const cost = Gas.calculateKeccak256Cost(64n); // 30 + (2 * 6) = 42 gas
   * ```
   */
  export function calculateKeccak256Cost(dataSize: bigint): bigint {
    const words = (dataSize + 31n) / 32n;
    return Keccak256Base + words * Keccak256Word;
  }

  /**
   * Calculate KECCAK256 gas cost (convenience form with this:)
   */
  export function keccak256Cost(this: bigint): bigint {
    return calculateKeccak256Cost(this);
  }

  // ==========================================================================
  // Storage Operations (EIP-2929 & EIP-2200)
  // ==========================================================================

  /**
   * SLOAD on warm slot (100 gas)
   */
  export const Sload = 100n;

  /**
   * Cold SLOAD (2100 gas) - EIP-2929
   */
  export const ColdSload = 2100n;

  /**
   * Cold account access (2600 gas) - EIP-2929
   * BALANCE, EXTCODESIZE, EXTCODECOPY, EXTCODEHASH, CALL family
   */
  export const ColdAccountAccess = 2600n;

  /**
   * Warm storage read (100 gas) - EIP-2929
   */
  export const WarmStorageRead = 100n;

  /**
   * Minimum gas for SSTORE (2300 gas)
   */
  export const SstoreSentry = 2300n;

  /**
   * SSTORE zero to non-zero (20000 gas)
   */
  export const SstoreSet = 20000n;

  /**
   * SSTORE modify existing non-zero (5000 gas)
   */
  export const SstoreReset = 5000n;

  /**
   * SSTORE clear to zero (5000 gas)
   */
  export const SstoreClear = 5000n;

  /**
   * Gas refund for clearing storage (4800 gas) - EIP-3529
   */
  export const SstoreRefund = 4800n;

  /**
   * Calculate SSTORE gas cost
   *
   * @param isWarm - Whether slot is warm (previously accessed)
   * @param currentValue - Current storage value (0n if empty)
   * @param newValue - New storage value
   * @returns Gas cost and potential refund
   *
   * @example
   * ```typescript
   * const result = Gas.calculateSstoreCost(false, 0n, 100n);
   * // { cost: 22100n, refund: 0n } - cold + set
   * ```
   */
  export function calculateSstoreCost(
    isWarm: boolean,
    currentValue: bigint,
    newValue: bigint,
  ): { cost: bigint; refund: bigint } {
    let cost = isWarm ? 0n : ColdSload;
    let refund = 0n;

    if (currentValue === newValue) {
      cost += Sload;
    } else if (currentValue === 0n && newValue !== 0n) {
      cost += SstoreSet;
    } else if (currentValue !== 0n && newValue === 0n) {
      cost += SstoreClear;
      refund = SstoreRefund;
    } else {
      cost += SstoreReset;
    }

    return { cost, refund };
  }

  /**
   * Calculate SSTORE gas cost (convenience form with this:)
   */
  export function sstoreCost(
    this: { isWarm: boolean; currentValue: bigint; newValue: bigint },
  ): { cost: bigint; refund: bigint } {
    return calculateSstoreCost(this.isWarm, this.currentValue, this.newValue);
  }

  // ==========================================================================
  // Control Flow
  // ==========================================================================

  /**
   * JUMPDEST marker (1 gas)
   */
  export const Jumpdest = 1n;

  // ==========================================================================
  // Logging Operations
  // ==========================================================================

  /**
   * Base cost for LOG operations (375 gas)
   */
  export const LogBase = 375n;

  /**
   * Per-byte cost for LOG data (8 gas)
   */
  export const LogData = 8n;

  /**
   * Per-topic cost for LOG (375 gas)
   */
  export const LogTopic = 375n;

  /**
   * Calculate LOG gas cost
   *
   * @param topicCount - Number of topics (0-4)
   * @param dataSize - Size of log data in bytes
   * @returns Total gas cost
   *
   * @example
   * ```typescript
   * const cost = Gas.calculateLogCost(2n, 64n); // LOG2 with 64 bytes
   * // 375 + (2 * 375) + (64 * 8) = 1637 gas
   * ```
   */
  export function calculateLogCost(topicCount: bigint, dataSize: bigint): bigint {
    return LogBase + topicCount * LogTopic + dataSize * LogData;
  }

  /**
   * Calculate LOG gas cost (convenience form with this:)
   */
  export function logCost(this: { topicCount: bigint; dataSize: bigint }): bigint {
    return calculateLogCost(this.topicCount, this.dataSize);
  }

  // ==========================================================================
  // Contract Creation and Calls
  // ==========================================================================

  /**
   * Base CREATE cost (32000 gas)
   */
  export const Create = 32000n;

  /**
   * Base CALL cost (40 gas)
   */
  export const Call = 40n;

  /**
   * Gas stipend for value transfer (2300 gas)
   */
  export const CallStipend = 2300n;

  /**
   * Additional cost for value transfer (9000 gas)
   */
  export const CallValueTransfer = 9000n;

  /**
   * Additional cost for new account creation (25000 gas)
   */
  export const CallNewAccount = 25000n;

  /**
   * CALLCODE cost (700 gas) - EIP-150
   */
  export const CallCode = 700n;

  /**
   * DELEGATECALL cost (700 gas) - EIP-150
   */
  export const DelegateCall = 700n;

  /**
   * STATICCALL cost (700 gas) - EIP-214
   */
  export const StaticCall = 700n;

  /**
   * SELFDESTRUCT base cost (5000 gas) - EIP-150
   */
  export const Selfdestruct = 5000n;

  /**
   * SELFDESTRUCT refund (24000 gas) - Removed in EIP-3529
   */
  export const SelfdestructRefund = 24000n;

  /**
   * 63/64 rule divisor for gas forwarding
   */
  export const CallGasRetentionDivisor = 64n;

  /**
   * Calculate CALL operation gas cost
   *
   * @param isWarm - Whether target account is warm
   * @param hasValue - Whether call transfers value
   * @param isNewAccount - Whether target account doesn't exist
   * @param availableGas - Gas available for the call
   * @returns Gas cost breakdown
   *
   * @example
   * ```typescript
   * const result = Gas.calculateCallCost(true, true, false, 100000n);
   * // { base, dynamic, stipend, forwarded, total }
   * ```
   */
  export function calculateCallCost(
    isWarm: boolean,
    hasValue: boolean,
    isNewAccount: boolean,
    availableGas: bigint,
  ): {
    base: bigint;
    dynamic: bigint;
    stipend: bigint;
    forwarded: bigint;
    total: bigint;
  } {
    let base = isWarm ? WarmStorageRead : ColdAccountAccess;
    let dynamic = 0n;

    if (hasValue) {
      dynamic += CallValueTransfer;
      if (isNewAccount) {
        dynamic += CallNewAccount;
      }
    }

    const total = base + dynamic;
    const forwardedGas = availableGas - total;
    const forwarded = forwardedGas - forwardedGas / CallGasRetentionDivisor;
    const stipend = hasValue ? CallStipend : 0n;

    return { base, dynamic, stipend, forwarded, total };
  }

  /**
   * Calculate CALL operation gas cost (convenience form with this:)
   */
  export function callCost(
    this: {
      isWarm: boolean;
      hasValue: boolean;
      isNewAccount: boolean;
      availableGas: bigint;
    },
  ): {
    base: bigint;
    dynamic: bigint;
    stipend: bigint;
    forwarded: bigint;
    total: bigint;
  } {
    return calculateCallCost(this.isWarm, this.hasValue, this.isNewAccount, this.availableGas);
  }

  // ==========================================================================
  // Memory Expansion
  // ==========================================================================

  /**
   * Linear coefficient for memory (3 gas)
   */
  export const Memory = 3n;

  /**
   * Quadratic coefficient divisor (512)
   */
  export const QuadCoeffDiv = 512n;

  /**
   * Calculate memory expansion cost
   *
   * @param oldSize - Previous memory size in bytes
   * @param newSize - New memory size in bytes
   * @returns Memory expansion cost
   *
   * @example
   * ```typescript
   * const expansion = Gas.calculateMemoryExpansionCost(64n, 128n);
   * // { oldCost, newCost, expansionCost, words }
   * ```
   */
  export function calculateMemoryExpansionCost(
    oldSize: bigint,
    newSize: bigint,
  ): MemoryExpansion {
    const oldWords = (oldSize + 31n) / 32n;
    const newWords = (newSize + 31n) / 32n;

    const oldCost = Memory * oldWords + (oldWords * oldWords) / QuadCoeffDiv;
    const newCost = Memory * newWords + (newWords * newWords) / QuadCoeffDiv;
    const expansionCost = newCost > oldCost ? newCost - oldCost : 0n;

    return { oldCost, newCost, expansionCost, words: newWords };
  }

  /**
   * Calculate memory expansion cost (convenience form with this:)
   */
  export function memoryExpansionCost(
    this: { oldSize: bigint; newSize: bigint },
  ): MemoryExpansion {
    return calculateMemoryExpansionCost(this.oldSize, this.newSize);
  }

  // ==========================================================================
  // Contract Deployment
  // ==========================================================================

  /**
   * Per-byte cost for deployed code (200 gas)
   */
  export const CreateData = 200n;

  /**
   * Per-word cost for initcode (2 gas) - EIP-3860
   */
  export const InitcodeWord = 2n;

  /**
   * Maximum initcode size (49152 bytes) - EIP-3860
   */
  export const MaxInitcodeSize = 49152n;

  /**
   * Calculate contract creation gas cost
   *
   * @param initcodeSize - Size of initcode in bytes
   * @param deployedSize - Size of deployed bytecode in bytes
   * @returns Gas cost breakdown
   *
   * @example
   * ```typescript
   * const result = Gas.calculateCreateCost(1000n, 500n);
   * // { base: 32000n, initcode: ..., deployed: ..., total: ... }
   * ```
   */
  export function calculateCreateCost(
    initcodeSize: bigint,
    deployedSize: bigint,
  ): CostResult {
    if (initcodeSize > MaxInitcodeSize) {
      throw new Error(`Initcode size ${initcodeSize} exceeds maximum ${MaxInitcodeSize}`);
    }

    const initcodeWords = (initcodeSize + 31n) / 32n;
    const initcodeCost = initcodeWords * InitcodeWord;
    const deployedCost = deployedSize * CreateData;

    return {
      base: Create,
      dynamic: initcodeCost + deployedCost,
      total: Create + initcodeCost + deployedCost,
    };
  }

  /**
   * Calculate contract creation gas cost (convenience form with this:)
   */
  export function createCost(
    this: { initcodeSize: bigint; deployedSize: bigint },
  ): CostResult {
    return calculateCreateCost(this.initcodeSize, this.deployedSize);
  }

  // ==========================================================================
  // Transaction Costs
  // ==========================================================================

  /**
   * Base transaction cost (21000 gas)
   */
  export const Tx = 21000n;

  /**
   * Contract creation transaction base cost (53000 gas)
   */
  export const TxContractCreation = 53000n;

  /**
   * Per zero byte in calldata (4 gas)
   */
  export const TxDataZero = 4n;

  /**
   * Per non-zero byte in calldata (16 gas)
   */
  export const TxDataNonZero = 16n;

  /**
   * Per word for copy operations (3 gas)
   */
  export const Copy = 3n;

  /**
   * Maximum refund quotient (1/5) - EIP-3529
   */
  export const MaxRefundQuotient = 5n;

  /**
   * Calculate transaction intrinsic gas cost
   *
   * @param data - Transaction calldata
   * @param isCreate - Whether transaction creates a contract
   * @returns Intrinsic gas cost
   *
   * @example
   * ```typescript
   * const data = new Uint8Array([0, 1, 2, 0, 0]);
   * const cost = Gas.calculateTxIntrinsicGas(data, false);
   * // 21000 + (3 * 4) + (2 * 16) = 21044 gas
   * ```
   */
  export function calculateTxIntrinsicGas(data: Uint8Array, isCreate: boolean): bigint {
    const base = isCreate ? TxContractCreation : Tx;
    let dataCost = 0n;

    for (let i = 0; i < data.length; i++) {
      dataCost += data[i] === 0 ? TxDataZero : TxDataNonZero;
    }

    return base + dataCost;
  }

  /**
   * Calculate transaction intrinsic gas cost (convenience form with this:)
   */
  export function txIntrinsicGas(this: { data: Uint8Array; isCreate: boolean }): bigint {
    return calculateTxIntrinsicGas(this.data, this.isCreate);
  }

  /**
   * Calculate copy operation gas cost
   *
   * @param size - Size of data to copy in bytes
   * @returns Gas cost
   */
  export function calculateCopyCost(size: bigint): bigint {
    const words = (size + 31n) / 32n;
    return words * Copy;
  }

  /**
   * Calculate copy operation gas cost (convenience form with this:)
   */
  export function copyCost(this: bigint): bigint {
    return calculateCopyCost(this);
  }

  /**
   * Calculate maximum gas refund
   *
   * @param gasUsed - Total gas used in transaction
   * @returns Maximum refundable gas
   */
  export function calculateMaxRefund(gasUsed: bigint): bigint {
    return gasUsed / MaxRefundQuotient;
  }

  /**
   * Calculate maximum gas refund (convenience form with this:)
   */
  export function maxRefund(this: bigint): bigint {
    return calculateMaxRefund(this);
  }

  // ==========================================================================
  // EIP-4844: Blob Transactions
  // ==========================================================================

  /**
   * BLOBHASH opcode cost (3 gas)
   */
  export const BlobHash = 3n;

  /**
   * BLOBBASEFEE opcode cost (2 gas)
   */
  export const BlobBaseFee = 2n;

  // ==========================================================================
  // EIP-1153: Transient Storage
  // ==========================================================================

  /**
   * TLOAD cost (100 gas)
   */
  export const TLoad = 100n;

  /**
   * TSTORE cost (100 gas)
   */
  export const TStore = 100n;

  // ==========================================================================
  // Precompile Costs
  // ==========================================================================

  export namespace Precompile {
    /**
     * ECRECOVER (address 0x01) - Fixed cost
     */
    export const EcRecover = 3000n;

    /**
     * SHA256 (address 0x02) - Base cost
     */
    export const Sha256Base = 60n;

    /**
     * SHA256 - Per-word cost
     */
    export const Sha256Word = 12n;

    /**
     * Calculate SHA256 precompile cost
     */
    export function calculateSha256Cost(dataSize: bigint): bigint {
      const words = (dataSize + 31n) / 32n;
      return Sha256Base + words * Sha256Word;
    }

    /**
     * RIPEMD160 (address 0x03) - Base cost
     */
    export const Ripemd160Base = 600n;

    /**
     * RIPEMD160 - Per-word cost
     */
    export const Ripemd160Word = 120n;

    /**
     * Calculate RIPEMD160 precompile cost
     */
    export function calculateRipemd160Cost(dataSize: bigint): bigint {
      const words = (dataSize + 31n) / 32n;
      return Ripemd160Base + words * Ripemd160Word;
    }

    /**
     * IDENTITY (address 0x04) - Base cost
     */
    export const IdentityBase = 15n;

    /**
     * IDENTITY - Per-word cost
     */
    export const IdentityWord = 3n;

    /**
     * Calculate IDENTITY precompile cost
     */
    export function calculateIdentityCost(dataSize: bigint): bigint {
      const words = (dataSize + 31n) / 32n;
      return IdentityBase + words * IdentityWord;
    }

    /**
     * MODEXP (address 0x05) - Minimum cost (EIP-2565)
     */
    export const ModExpMin = 200n;

    /**
     * MODEXP - Quadratic threshold (64 bytes)
     */
    export const ModExpQuadraticThreshold = 64n;

    /**
     * MODEXP - Linear threshold (1024 bytes)
     */
    export const ModExpLinearThreshold = 1024n;

    /**
     * Calculate MODEXP precompile cost
     *
     * @param baseLength - Length of base in bytes
     * @param expLength - Length of exponent in bytes
     * @param modLength - Length of modulus in bytes
     * @param expHead - First 32 bytes of exponent
     * @returns Gas cost
     */
    export function calculateModExpCost(
      baseLength: bigint,
      expLength: bigint,
      modLength: bigint,
      expHead: bigint,
    ): bigint {
      // Complexity calculation per EIP-2565
      const maxLength = baseLength > modLength ? baseLength : modLength;
      const adjExpLen = calculateAdjustedExponentLength(expLength, expHead);

      let complexity: bigint;
      if (maxLength <= ModExpQuadraticThreshold) {
        complexity = (maxLength * maxLength) / 4n;
      } else if (maxLength <= ModExpLinearThreshold) {
        complexity = (maxLength * maxLength) / 16n + (96n * maxLength) - 3072n;
      } else {
        complexity = (maxLength * maxLength) / 64n + (480n * maxLength) - 199680n;
      }

      const gas = (complexity * adjExpLen) / 20n;
      return gas > ModExpMin ? gas : ModExpMin;
    }

    /**
     * Calculate adjusted exponent length for MODEXP
     */
    function calculateAdjustedExponentLength(expLength: bigint, expHead: bigint): bigint {
      if (expLength <= 32n) {
        if (expHead === 0n) return 0n;
        return BigInt(Math.floor(Math.log2(Number(expHead))));
      }
      const headBits = expHead === 0n ? 0n : BigInt(Math.floor(Math.log2(Number(expHead))));
      return 8n * (expLength - 32n) + headBits;
    }

    /**
     * BN254 ECADD (address 0x06) - Istanbul onwards
     */
    export const EcAddIstanbul = 150n;

    /**
     * BN254 ECADD - Byzantium to Berlin
     */
    export const EcAddByzantium = 500n;

    /**
     * BN254 ECMUL (address 0x07) - Istanbul onwards
     */
    export const EcMulIstanbul = 6000n;

    /**
     * BN254 ECMUL - Byzantium to Berlin
     */
    export const EcMulByzantium = 40000n;

    /**
     * BN254 ECPAIRING (address 0x08) - Base cost (Istanbul onwards)
     */
    export const EcPairingBaseIstanbul = 45000n;

    /**
     * BN254 ECPAIRING - Per-pair cost (Istanbul onwards)
     */
    export const EcPairingPerPairIstanbul = 34000n;

    /**
     * BN254 ECPAIRING - Base cost (Byzantium to Berlin)
     */
    export const EcPairingBaseByzantium = 100000n;

    /**
     * BN254 ECPAIRING - Per-pair cost (Byzantium to Berlin)
     */
    export const EcPairingPerPairByzantium = 80000n;

    /**
     * Calculate ECPAIRING precompile cost
     *
     * @param pairCount - Number of point pairs
     * @param hardfork - EVM hardfork
     * @returns Gas cost
     *
     * @example
     * ```typescript
     * const cost = Gas.Precompile.calculateEcPairingCost(2n, 'istanbul');
     * // 45000 + (2 * 34000) = 113000 gas
     * ```
     */
    export function calculateEcPairingCost(pairCount: bigint, hardfork: Hardfork): bigint {
      const isIstanbulOrLater =
        hardfork === "istanbul" ||
        hardfork === "berlin" ||
        hardfork === "london" ||
        hardfork === "paris" ||
        hardfork === "shanghai" ||
        hardfork === "cancun";

      if (isIstanbulOrLater) {
        return EcPairingBaseIstanbul + pairCount * EcPairingPerPairIstanbul;
      } else {
        return EcPairingBaseByzantium + pairCount * EcPairingPerPairByzantium;
      }
    }

    /**
     * Calculate ECPAIRING precompile cost (convenience form with this:)
     */
    export function ecPairingCost(this: { pairCount: bigint; hardfork: Hardfork }): bigint {
      return calculateEcPairingCost(this.pairCount, this.hardfork);
    }

    /**
     * Get ECADD cost for hardfork
     */
    export function getEcAddCost(hardfork: Hardfork): bigint {
      const isIstanbulOrLater =
        hardfork === "istanbul" ||
        hardfork === "berlin" ||
        hardfork === "london" ||
        hardfork === "paris" ||
        hardfork === "shanghai" ||
        hardfork === "cancun";
      return isIstanbulOrLater ? EcAddIstanbul : EcAddByzantium;
    }

    /**
     * Get ECMUL cost for hardfork
     */
    export function getEcMulCost(hardfork: Hardfork): bigint {
      const isIstanbulOrLater =
        hardfork === "istanbul" ||
        hardfork === "berlin" ||
        hardfork === "london" ||
        hardfork === "paris" ||
        hardfork === "shanghai" ||
        hardfork === "cancun";
      return isIstanbulOrLater ? EcMulIstanbul : EcMulByzantium;
    }
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Check if a hardfork includes EIP-2929 (cold/warm access costs)
   */
  export function hasEIP2929(hardfork: Hardfork): boolean {
    return (
      hardfork === "berlin" ||
      hardfork === "london" ||
      hardfork === "paris" ||
      hardfork === "shanghai" ||
      hardfork === "cancun"
    );
  }

  /**
   * Check if a hardfork includes EIP-3529 (reduced refunds)
   */
  export function hasEIP3529(hardfork: Hardfork): boolean {
    return (
      hardfork === "london" ||
      hardfork === "paris" ||
      hardfork === "shanghai" ||
      hardfork === "cancun"
    );
  }

  /**
   * Check if a hardfork includes EIP-3860 (initcode size limit)
   */
  export function hasEIP3860(hardfork: Hardfork): boolean {
    return hardfork === "shanghai" || hardfork === "cancun";
  }

  /**
   * Check if a hardfork includes EIP-1153 (transient storage)
   */
  export function hasEIP1153(hardfork: Hardfork): boolean {
    return hardfork === "cancun";
  }

  /**
   * Check if a hardfork includes EIP-4844 (blob transactions)
   */
  export function hasEIP4844(hardfork: Hardfork): boolean {
    return hardfork === "cancun";
  }

  /**
   * Get cold storage cost for hardfork
   */
  export function getColdSloadCost(hardfork: Hardfork): bigint {
    return hasEIP2929(hardfork) ? ColdSload : Sload;
  }

  /**
   * Get cold account access cost for hardfork
   */
  export function getColdAccountAccessCost(hardfork: Hardfork): bigint {
    return hasEIP2929(hardfork) ? ColdAccountAccess : ExtStep;
  }

  /**
   * Get storage refund for hardfork
   */
  export function getSstoreRefund(hardfork: Hardfork): bigint {
    return hasEIP3529(hardfork) ? SstoreRefund : 15000n;
  }

  /**
   * Get selfdestruct refund for hardfork
   */
  export function getSelfdestructRefund(hardfork: Hardfork): bigint {
    return hasEIP3529(hardfork) ? 0n : SelfdestructRefund;
  }
}

/**
 * Gas cost type (namespace as type via declaration merging pattern)
 */
export type Gas = bigint;

// Re-export namespace as default
export default Gas;
