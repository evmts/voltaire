/**
 * Tests for Gas Constants Module
 */

import { describe, it, expect } from "vitest";
import { Gas } from "./GasConstants/index.js";
import {
  isWasmGasAvailable,
  getGasImplementationStatus,
} from "./gas-constants.wasm.js";

// ============================================================================
// Basic Opcode Constants
// ============================================================================

describe("Gas Basic Opcode Constants", () => {
  it("verifies QuickStep cost", () => {
    expect(Gas.QuickStep).toBe(2n);
  });

  it("verifies FastestStep cost", () => {
    expect(Gas.FastestStep).toBe(3n);
  });

  it("verifies FastStep cost", () => {
    expect(Gas.FastStep).toBe(5n);
  });

  it("verifies MidStep cost", () => {
    expect(Gas.MidStep).toBe(8n);
  });

  it("verifies SlowStep cost", () => {
    expect(Gas.SlowStep).toBe(10n);
  });

  it("verifies ExtStep cost", () => {
    expect(Gas.ExtStep).toBe(20n);
  });

  it("verifies Jumpdest cost", () => {
    expect(Gas.Jumpdest).toBe(1n);
  });
});

// ============================================================================
// Hashing Operations
// ============================================================================

describe("Gas.calculateKeccak256Cost", () => {
  it("calculates cost for empty data", () => {
    expect(Gas.calculateKeccak256Cost(0n)).toBe(30n);
  });

  it("calculates cost for 32 bytes", () => {
    expect(Gas.calculateKeccak256Cost(32n)).toBe(36n); // 30 + 1*6
  });

  it("calculates cost for 64 bytes", () => {
    expect(Gas.calculateKeccak256Cost(64n)).toBe(42n); // 30 + 2*6
  });

  it("calculates cost for 33 bytes (rounds up)", () => {
    expect(Gas.calculateKeccak256Cost(33n)).toBe(42n); // 30 + 2*6
  });

  it("calculates cost for large data", () => {
    expect(Gas.calculateKeccak256Cost(1000n)).toBe(222n); // 30 + 32*6
  });
});

describe("Gas.keccak256Cost (convenience form)", () => {
  it("calculates cost using this: pattern", () => {
    const result = Gas.keccak256Cost.call(64n);
    expect(result).toBe(42n);
  });
});

// ============================================================================
// Storage Operations
// ============================================================================

describe("Gas Storage Constants", () => {
  it("verifies Sload cost", () => {
    expect(Gas.Sload).toBe(100n);
  });

  it("verifies ColdSload cost", () => {
    expect(Gas.ColdSload).toBe(2100n);
  });

  it("verifies ColdAccountAccess cost", () => {
    expect(Gas.ColdAccountAccess).toBe(2600n);
  });

  it("verifies WarmStorageRead cost", () => {
    expect(Gas.WarmStorageRead).toBe(100n);
  });

  it("verifies SstoreSentry cost", () => {
    expect(Gas.SstoreSentry).toBe(2300n);
  });

  it("verifies SstoreSet cost", () => {
    expect(Gas.SstoreSet).toBe(20000n);
  });

  it("verifies SstoreReset cost", () => {
    expect(Gas.SstoreReset).toBe(5000n);
  });

  it("verifies SstoreClear cost", () => {
    expect(Gas.SstoreClear).toBe(5000n);
  });

  it("verifies SstoreRefund amount", () => {
    expect(Gas.SstoreRefund).toBe(4800n);
  });
});

describe("Gas.calculateSstoreCost", () => {
  it("calculates warm no-op (same value)", () => {
    const result = Gas.calculateSstoreCost(true, 100n, 100n);
    expect(result).toEqual({ cost: 100n, refund: 0n });
  });

  it("calculates cold no-op (same value)", () => {
    const result = Gas.calculateSstoreCost(false, 100n, 100n);
    expect(result).toEqual({ cost: 2200n, refund: 0n }); // 2100 + 100
  });

  it("calculates warm zero to non-zero", () => {
    const result = Gas.calculateSstoreCost(true, 0n, 100n);
    expect(result).toEqual({ cost: 20000n, refund: 0n });
  });

  it("calculates cold zero to non-zero", () => {
    const result = Gas.calculateSstoreCost(false, 0n, 100n);
    expect(result).toEqual({ cost: 22100n, refund: 0n }); // 2100 + 20000
  });

  it("calculates warm non-zero to zero", () => {
    const result = Gas.calculateSstoreCost(true, 100n, 0n);
    expect(result).toEqual({ cost: 5000n, refund: 4800n });
  });

  it("calculates cold non-zero to zero", () => {
    const result = Gas.calculateSstoreCost(false, 100n, 0n);
    expect(result).toEqual({ cost: 7100n, refund: 4800n }); // 2100 + 5000
  });

  it("calculates warm non-zero to different non-zero", () => {
    const result = Gas.calculateSstoreCost(true, 100n, 200n);
    expect(result).toEqual({ cost: 5000n, refund: 0n });
  });

  it("calculates cold non-zero to different non-zero", () => {
    const result = Gas.calculateSstoreCost(false, 100n, 200n);
    expect(result).toEqual({ cost: 7100n, refund: 0n }); // 2100 + 5000
  });
});

describe("Gas.sstoreCost (convenience form)", () => {
  it("calculates cost using this: pattern", () => {
    const result = Gas.sstoreCost.call({
      isWarm: true,
      currentValue: 0n,
      newValue: 100n,
    });
    expect(result).toEqual({ cost: 20000n, refund: 0n });
  });
});

// ============================================================================
// Logging Operations
// ============================================================================

describe("Gas Logging Constants", () => {
  it("verifies LogBase cost", () => {
    expect(Gas.LogBase).toBe(375n);
  });

  it("verifies LogData cost", () => {
    expect(Gas.LogData).toBe(8n);
  });

  it("verifies LogTopic cost", () => {
    expect(Gas.LogTopic).toBe(375n);
  });
});

describe("Gas.calculateLogCost", () => {
  it("calculates LOG0 with no data", () => {
    expect(Gas.calculateLogCost(0n, 0n)).toBe(375n);
  });

  it("calculates LOG0 with data", () => {
    expect(Gas.calculateLogCost(0n, 64n)).toBe(887n); // 375 + 64*8
  });

  it("calculates LOG1 with data", () => {
    expect(Gas.calculateLogCost(1n, 64n)).toBe(1262n); // 375 + 375 + 64*8
  });

  it("calculates LOG2 with data", () => {
    expect(Gas.calculateLogCost(2n, 64n)).toBe(1637n); // 375 + 2*375 + 64*8
  });

  it("calculates LOG3 with data", () => {
    expect(Gas.calculateLogCost(3n, 64n)).toBe(2012n); // 375 + 3*375 + 64*8
  });

  it("calculates LOG4 with data", () => {
    expect(Gas.calculateLogCost(4n, 64n)).toBe(2387n); // 375 + 4*375 + 64*8
  });

  it("calculates LOG with large data", () => {
    expect(Gas.calculateLogCost(2n, 1000n)).toBe(9125n); // 375 + 2*375 + 1000*8
  });
});

describe("Gas.logCost (convenience form)", () => {
  it("calculates cost using this: pattern", () => {
    const result = Gas.logCost.call({ topicCount: 2n, dataSize: 64n });
    expect(result).toBe(1637n);
  });
});

// ============================================================================
// Contract Creation and Calls
// ============================================================================

describe("Gas Call Constants", () => {
  it("verifies Create cost", () => {
    expect(Gas.Create).toBe(32000n);
  });

  it("verifies Call cost", () => {
    expect(Gas.Call).toBe(40n);
  });

  it("verifies CallStipend amount", () => {
    expect(Gas.CallStipend).toBe(2300n);
  });

  it("verifies CallValueTransfer cost", () => {
    expect(Gas.CallValueTransfer).toBe(9000n);
  });

  it("verifies CallNewAccount cost", () => {
    expect(Gas.CallNewAccount).toBe(25000n);
  });

  it("verifies CallCode cost", () => {
    expect(Gas.CallCode).toBe(700n);
  });

  it("verifies DelegateCall cost", () => {
    expect(Gas.DelegateCall).toBe(700n);
  });

  it("verifies StaticCall cost", () => {
    expect(Gas.StaticCall).toBe(700n);
  });

  it("verifies Selfdestruct cost", () => {
    expect(Gas.Selfdestruct).toBe(5000n);
  });

  it("verifies SelfdestructRefund amount", () => {
    expect(Gas.SelfdestructRefund).toBe(24000n);
  });

  it("verifies CallGasRetentionDivisor", () => {
    expect(Gas.CallGasRetentionDivisor).toBe(64n);
  });
});

describe("Gas.calculateCallCost", () => {
  it("calculates warm call without value", () => {
    const result = Gas.calculateCallCost(true, false, false, 100000n);
    expect(result.base).toBe(100n);
    expect(result.dynamic).toBe(0n);
    expect(result.total).toBe(100n);
    expect(result.stipend).toBe(0n);
    expect(result.forwarded).toBe(98340n); // 99900 - 99900/64 (integer division)
  });

  it("calculates cold call without value", () => {
    const result = Gas.calculateCallCost(false, false, false, 100000n);
    expect(result.base).toBe(2600n);
    expect(result.dynamic).toBe(0n);
    expect(result.total).toBe(2600n);
    expect(result.stipend).toBe(0n);
    expect(result.forwarded).toBe(95879n); // 97400 - 97400/64 (integer division)
  });

  it("calculates warm call with value to existing account", () => {
    const result = Gas.calculateCallCost(true, true, false, 100000n);
    expect(result.base).toBe(100n);
    expect(result.dynamic).toBe(9000n);
    expect(result.total).toBe(9100n);
    expect(result.stipend).toBe(2300n);
    expect(result.forwarded).toBe(89480n); // 90900 - 90900/64 (integer division)
  });

  it("calculates warm call with value to new account", () => {
    const result = Gas.calculateCallCost(true, true, true, 100000n);
    expect(result.base).toBe(100n);
    expect(result.dynamic).toBe(34000n); // 9000 + 25000
    expect(result.total).toBe(34100n);
    expect(result.stipend).toBe(2300n);
    expect(result.forwarded).toBe(64871n); // 65900 - 1029
  });

  it("calculates cold call with value to new account", () => {
    const result = Gas.calculateCallCost(false, true, true, 100000n);
    expect(result.base).toBe(2600n);
    expect(result.dynamic).toBe(34000n);
    expect(result.total).toBe(36600n);
    expect(result.stipend).toBe(2300n);
    expect(result.forwarded).toBe(62410n); // 63400 - 63400/64 (integer division)
  });
});

describe("Gas.callCost (convenience form)", () => {
  it("calculates cost using this: pattern", () => {
    const result = Gas.callCost.call({
      isWarm: true,
      hasValue: false,
      isNewAccount: false,
      availableGas: 100000n,
    });
    expect(result.total).toBe(100n);
  });
});

// ============================================================================
// Memory Expansion
// ============================================================================

describe("Gas Memory Constants", () => {
  it("verifies Memory linear coefficient", () => {
    expect(Gas.Memory).toBe(3n);
  });

  it("verifies QuadCoeffDiv", () => {
    expect(Gas.QuadCoeffDiv).toBe(512n);
  });
});

describe("Gas.calculateMemoryExpansionCost", () => {
  it("calculates zero to zero expansion", () => {
    const result = Gas.calculateMemoryExpansionCost(0n, 0n);
    expect(result.oldCost).toBe(0n);
    expect(result.newCost).toBe(0n);
    expect(result.expansionCost).toBe(0n);
    expect(result.words).toBe(0n);
  });

  it("calculates zero to 32 bytes expansion", () => {
    const result = Gas.calculateMemoryExpansionCost(0n, 32n);
    expect(result.words).toBe(1n);
    expect(result.newCost).toBe(3n); // 3*1 + 1*1/512
    expect(result.expansionCost).toBe(3n);
  });

  it("calculates zero to 64 bytes expansion", () => {
    const result = Gas.calculateMemoryExpansionCost(0n, 64n);
    expect(result.words).toBe(2n);
    expect(result.newCost).toBe(6n); // 3*2 + 2*2/512
    expect(result.expansionCost).toBe(6n);
  });

  it("calculates 64 to 128 bytes expansion", () => {
    const result = Gas.calculateMemoryExpansionCost(64n, 128n);
    expect(result.words).toBe(4n);
    expect(result.oldCost).toBe(6n);
    expect(result.newCost).toBe(12n);
    expect(result.expansionCost).toBe(6n);
  });

  it("handles non-word-aligned sizes", () => {
    const result = Gas.calculateMemoryExpansionCost(0n, 33n);
    expect(result.words).toBe(2n); // Rounds up
    expect(result.newCost).toBe(6n);
  });

  it("calculates large memory expansion", () => {
    const result = Gas.calculateMemoryExpansionCost(0n, 10240n); // 320 words
    expect(result.words).toBe(320n);
    const expectedCost = 3n * 320n + (320n * 320n) / 512n;
    expect(result.newCost).toBe(expectedCost);
  });

  it("handles shrinking memory (no negative cost)", () => {
    const result = Gas.calculateMemoryExpansionCost(128n, 64n);
    expect(result.expansionCost).toBe(0n);
  });
});

describe("Gas.memoryExpansionCost (convenience form)", () => {
  it("calculates cost using this: pattern", () => {
    const result = Gas.memoryExpansionCost.call({ oldSize: 0n, newSize: 64n });
    expect(result.expansionCost).toBe(6n);
  });
});

// ============================================================================
// Contract Deployment
// ============================================================================

describe("Gas Contract Deployment Constants", () => {
  it("verifies CreateData cost", () => {
    expect(Gas.CreateData).toBe(200n);
  });

  it("verifies InitcodeWord cost", () => {
    expect(Gas.InitcodeWord).toBe(2n);
  });

  it("verifies MaxInitcodeSize limit", () => {
    expect(Gas.MaxInitcodeSize).toBe(49152n);
  });
});

describe("Gas.calculateCreateCost", () => {
  it("calculates minimal creation cost", () => {
    const result = Gas.calculateCreateCost(0n, 0n);
    expect(result.base).toBe(32000n);
    expect(result.dynamic).toBe(0n);
    expect(result.total).toBe(32000n);
  });

  it("calculates cost with initcode only", () => {
    const result = Gas.calculateCreateCost(100n, 0n);
    expect(result.base).toBe(32000n);
    expect(result.dynamic).toBe(8n); // 4 words * 2
    expect(result.total).toBe(32008n);
  });

  it("calculates cost with deployed code only", () => {
    const result = Gas.calculateCreateCost(0n, 100n);
    expect(result.base).toBe(32000n);
    expect(result.dynamic).toBe(20000n); // 100 * 200
    expect(result.total).toBe(52000n);
  });

  it("calculates cost with both initcode and deployed", () => {
    const result = Gas.calculateCreateCost(1000n, 500n);
    expect(result.base).toBe(32000n);
    const initcodeCost = 32n * 2n; // 32 words * 2
    const deployedCost = 500n * 200n;
    expect(result.dynamic).toBe(initcodeCost + deployedCost);
    expect(result.total).toBe(32000n + initcodeCost + deployedCost);
  });

  it("handles non-word-aligned initcode", () => {
    const result = Gas.calculateCreateCost(33n, 0n);
    expect(result.dynamic).toBe(4n); // 2 words * 2
  });

  it("throws on initcode exceeding maximum", () => {
    expect(() => Gas.calculateCreateCost(49153n, 0n)).toThrow(
      "Initcode size 49153 exceeds maximum 49152",
    );
  });

  it("allows maximum initcode size", () => {
    const result = Gas.calculateCreateCost(49152n, 0n);
    expect(result.base).toBe(32000n);
  });
});

describe("Gas.createCost (convenience form)", () => {
  it("calculates cost using this: pattern", () => {
    const result = Gas.createCost.call({ initcodeSize: 1000n, deployedSize: 500n });
    expect(result.base).toBe(32000n);
  });
});

// ============================================================================
// Transaction Costs
// ============================================================================

describe("Gas Transaction Constants", () => {
  it("verifies Tx base cost", () => {
    expect(Gas.Tx).toBe(21000n);
  });

  it("verifies TxContractCreation base cost", () => {
    expect(Gas.TxContractCreation).toBe(53000n);
  });

  it("verifies TxDataZero cost", () => {
    expect(Gas.TxDataZero).toBe(4n);
  });

  it("verifies TxDataNonZero cost", () => {
    expect(Gas.TxDataNonZero).toBe(16n);
  });

  it("verifies Copy cost", () => {
    expect(Gas.Copy).toBe(3n);
  });

  it("verifies MaxRefundQuotient", () => {
    expect(Gas.MaxRefundQuotient).toBe(5n);
  });
});

describe("Gas.calculateTxIntrinsicGas", () => {
  it("calculates cost for empty calldata transfer", () => {
    const data = new Uint8Array(0);
    expect(Gas.calculateTxIntrinsicGas(data, false)).toBe(21000n);
  });

  it("calculates cost for empty calldata contract creation", () => {
    const data = new Uint8Array(0);
    expect(Gas.calculateTxIntrinsicGas(data, true)).toBe(53000n);
  });

  it("calculates cost with all zero bytes", () => {
    const data = new Uint8Array([0, 0, 0, 0]);
    expect(Gas.calculateTxIntrinsicGas(data, false)).toBe(21016n); // 21000 + 4*4
  });

  it("calculates cost with all non-zero bytes", () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    expect(Gas.calculateTxIntrinsicGas(data, false)).toBe(21064n); // 21000 + 4*16
  });

  it("calculates cost with mixed zero and non-zero bytes", () => {
    const data = new Uint8Array([0, 1, 2, 0, 0]);
    expect(Gas.calculateTxIntrinsicGas(data, false)).toBe(21044n); // 21000 + 3*4 + 2*16
  });

  it("calculates cost for contract creation with calldata", () => {
    const data = new Uint8Array([0, 1, 2, 0, 0]);
    expect(Gas.calculateTxIntrinsicGas(data, true)).toBe(53044n); // 53000 + 3*4 + 2*16
  });

  it("calculates cost for large calldata", () => {
    const data = new Uint8Array(1000).fill(1);
    expect(Gas.calculateTxIntrinsicGas(data, false)).toBe(37000n); // 21000 + 1000*16
  });
});

describe("Gas.txIntrinsicGas (convenience form)", () => {
  it("calculates cost using this: pattern", () => {
    const data = new Uint8Array([0, 1, 2]);
    const result = Gas.txIntrinsicGas.call({ data, isCreate: false });
    expect(result).toBe(21036n); // 21000 + 1*4 + 2*16
  });
});

describe("Gas.calculateCopyCost", () => {
  it("calculates cost for zero bytes", () => {
    expect(Gas.calculateCopyCost(0n)).toBe(0n);
  });

  it("calculates cost for 32 bytes", () => {
    expect(Gas.calculateCopyCost(32n)).toBe(3n); // 1 word * 3
  });

  it("calculates cost for 64 bytes", () => {
    expect(Gas.calculateCopyCost(64n)).toBe(6n); // 2 words * 3
  });

  it("calculates cost for non-aligned size", () => {
    expect(Gas.calculateCopyCost(33n)).toBe(6n); // 2 words * 3
  });
});

describe("Gas.copyCost (convenience form)", () => {
  it("calculates cost using this: pattern", () => {
    const result = Gas.copyCost.call(64n);
    expect(result).toBe(6n);
  });
});

describe("Gas.calculateMaxRefund", () => {
  it("calculates max refund for small gas usage", () => {
    expect(Gas.calculateMaxRefund(100n)).toBe(20n); // 100/5
  });

  it("calculates max refund for typical gas usage", () => {
    expect(Gas.calculateMaxRefund(100000n)).toBe(20000n); // 100000/5
  });

  it("calculates max refund for large gas usage", () => {
    expect(Gas.calculateMaxRefund(1000000n)).toBe(200000n); // 1000000/5
  });
});

describe("Gas.maxRefund (convenience form)", () => {
  it("calculates refund using this: pattern", () => {
    const result = Gas.maxRefund.call(100000n);
    expect(result).toBe(20000n);
  });
});

// ============================================================================
// EIP-4844 and EIP-1153
// ============================================================================

describe("Gas EIP-4844 Constants", () => {
  it("verifies BlobHash cost", () => {
    expect(Gas.BlobHash).toBe(3n);
  });

  it("verifies BlobBaseFee cost", () => {
    expect(Gas.BlobBaseFee).toBe(2n);
  });
});

describe("Gas EIP-1153 Constants", () => {
  it("verifies TLoad cost", () => {
    expect(Gas.TLoad).toBe(100n);
  });

  it("verifies TStore cost", () => {
    expect(Gas.TStore).toBe(100n);
  });
});

// ============================================================================
// Precompile Costs
// ============================================================================

describe("Gas.Precompile Constants", () => {
  it("verifies EcRecover cost", () => {
    expect(Gas.Precompile.EcRecover).toBe(3000n);
  });

  it("verifies Sha256 constants", () => {
    expect(Gas.Precompile.Sha256Base).toBe(60n);
    expect(Gas.Precompile.Sha256Word).toBe(12n);
  });

  it("verifies Ripemd160 constants", () => {
    expect(Gas.Precompile.Ripemd160Base).toBe(600n);
    expect(Gas.Precompile.Ripemd160Word).toBe(120n);
  });

  it("verifies Identity constants", () => {
    expect(Gas.Precompile.IdentityBase).toBe(15n);
    expect(Gas.Precompile.IdentityWord).toBe(3n);
  });

  it("verifies ModExp constants", () => {
    expect(Gas.Precompile.ModExpMin).toBe(200n);
    expect(Gas.Precompile.ModExpQuadraticThreshold).toBe(64n);
    expect(Gas.Precompile.ModExpLinearThreshold).toBe(1024n);
  });

  it("verifies BN254 Istanbul constants", () => {
    expect(Gas.Precompile.EcAddIstanbul).toBe(150n);
    expect(Gas.Precompile.EcMulIstanbul).toBe(6000n);
    expect(Gas.Precompile.EcPairingBaseIstanbul).toBe(45000n);
    expect(Gas.Precompile.EcPairingPerPairIstanbul).toBe(34000n);
  });

  it("verifies BN254 Byzantium constants", () => {
    expect(Gas.Precompile.EcAddByzantium).toBe(500n);
    expect(Gas.Precompile.EcMulByzantium).toBe(40000n);
    expect(Gas.Precompile.EcPairingBaseByzantium).toBe(100000n);
    expect(Gas.Precompile.EcPairingPerPairByzantium).toBe(80000n);
  });
});

describe("Gas.Precompile.calculateSha256Cost", () => {
  it("calculates cost for empty data", () => {
    expect(Gas.Precompile.calculateSha256Cost(0n)).toBe(60n);
  });

  it("calculates cost for 32 bytes", () => {
    expect(Gas.Precompile.calculateSha256Cost(32n)).toBe(72n); // 60 + 1*12
  });

  it("calculates cost for 64 bytes", () => {
    expect(Gas.Precompile.calculateSha256Cost(64n)).toBe(84n); // 60 + 2*12
  });
});

describe("Gas.Precompile.calculateRipemd160Cost", () => {
  it("calculates cost for empty data", () => {
    expect(Gas.Precompile.calculateRipemd160Cost(0n)).toBe(600n);
  });

  it("calculates cost for 32 bytes", () => {
    expect(Gas.Precompile.calculateRipemd160Cost(32n)).toBe(720n); // 600 + 1*120
  });

  it("calculates cost for 64 bytes", () => {
    expect(Gas.Precompile.calculateRipemd160Cost(64n)).toBe(840n); // 600 + 2*120
  });
});

describe("Gas.Precompile.calculateIdentityCost", () => {
  it("calculates cost for empty data", () => {
    expect(Gas.Precompile.calculateIdentityCost(0n)).toBe(15n);
  });

  it("calculates cost for 32 bytes", () => {
    expect(Gas.Precompile.calculateIdentityCost(32n)).toBe(18n); // 15 + 1*3
  });

  it("calculates cost for 64 bytes", () => {
    expect(Gas.Precompile.calculateIdentityCost(64n)).toBe(21n); // 15 + 2*3
  });
});

describe("Gas.Precompile.calculateModExpCost", () => {
  it("returns minimum cost for small inputs", () => {
    const cost = Gas.Precompile.calculateModExpCost(1n, 1n, 1n, 0n);
    expect(cost).toBeGreaterThanOrEqual(200n);
  });

  it("calculates cost for typical RSA-2048", () => {
    const cost = Gas.Precompile.calculateModExpCost(256n, 256n, 256n, 65537n);
    expect(cost).toBeGreaterThan(200n);
  });

  it("handles zero exponent head", () => {
    const cost = Gas.Precompile.calculateModExpCost(32n, 32n, 32n, 0n);
    expect(cost).toBeGreaterThanOrEqual(200n);
  });

  it("calculates cost for large modulus (quadratic region)", () => {
    const cost = Gas.Precompile.calculateModExpCost(64n, 32n, 64n, 1n);
    expect(cost).toBeGreaterThanOrEqual(200n);
  });

  it("calculates cost for medium modulus (linear region)", () => {
    const cost = Gas.Precompile.calculateModExpCost(512n, 32n, 512n, 1n);
    expect(cost).toBeGreaterThanOrEqual(200n);
  });

  it("calculates cost for very large modulus", () => {
    const cost = Gas.Precompile.calculateModExpCost(2048n, 32n, 2048n, 1n);
    expect(cost).toBeGreaterThanOrEqual(200n);
  });
});

describe("Gas.Precompile.calculateEcPairingCost", () => {
  it("calculates cost for single pair in Istanbul", () => {
    expect(Gas.Precompile.calculateEcPairingCost(1n, "istanbul")).toBe(79000n); // 45000 + 1*34000
  });

  it("calculates cost for multiple pairs in Istanbul", () => {
    expect(Gas.Precompile.calculateEcPairingCost(3n, "istanbul")).toBe(147000n); // 45000 + 3*34000
  });

  it("calculates cost for single pair in Byzantium", () => {
    expect(Gas.Precompile.calculateEcPairingCost(1n, "byzantium")).toBe(180000n); // 100000 + 1*80000
  });

  it("calculates cost for multiple pairs in Byzantium", () => {
    expect(Gas.Precompile.calculateEcPairingCost(3n, "byzantium")).toBe(340000n); // 100000 + 3*80000
  });

  it("calculates cost for zero pairs", () => {
    expect(Gas.Precompile.calculateEcPairingCost(0n, "istanbul")).toBe(45000n);
  });

  it("uses Istanbul pricing for Berlin", () => {
    expect(Gas.Precompile.calculateEcPairingCost(1n, "berlin")).toBe(79000n);
  });

  it("uses Istanbul pricing for London", () => {
    expect(Gas.Precompile.calculateEcPairingCost(1n, "london")).toBe(79000n);
  });

  it("uses Istanbul pricing for Cancun", () => {
    expect(Gas.Precompile.calculateEcPairingCost(1n, "cancun")).toBe(79000n);
  });
});

describe("Gas.Precompile.ecPairingCost (convenience form)", () => {
  it("calculates cost using this: pattern", () => {
    const result = Gas.Precompile.ecPairingCost.call({ pairCount: 2n, hardfork: "istanbul" });
    expect(result).toBe(113000n);
  });
});

describe("Gas.Precompile.getEcAddCost", () => {
  it("returns Istanbul cost for Istanbul", () => {
    expect(Gas.Precompile.getEcAddCost("istanbul")).toBe(150n);
  });

  it("returns Byzantium cost for Byzantium", () => {
    expect(Gas.Precompile.getEcAddCost("byzantium")).toBe(500n);
  });

  it("returns Istanbul cost for later forks", () => {
    expect(Gas.Precompile.getEcAddCost("berlin")).toBe(150n);
    expect(Gas.Precompile.getEcAddCost("london")).toBe(150n);
    expect(Gas.Precompile.getEcAddCost("cancun")).toBe(150n);
  });
});

describe("Gas.Precompile.getEcMulCost", () => {
  it("returns Istanbul cost for Istanbul", () => {
    expect(Gas.Precompile.getEcMulCost("istanbul")).toBe(6000n);
  });

  it("returns Byzantium cost for Byzantium", () => {
    expect(Gas.Precompile.getEcMulCost("byzantium")).toBe(40000n);
  });

  it("returns Istanbul cost for later forks", () => {
    expect(Gas.Precompile.getEcMulCost("berlin")).toBe(6000n);
    expect(Gas.Precompile.getEcMulCost("london")).toBe(6000n);
    expect(Gas.Precompile.getEcMulCost("cancun")).toBe(6000n);
  });
});

// ============================================================================
// Hardfork Utility Functions
// ============================================================================

describe("Gas.hasEIP2929", () => {
  it("returns false for pre-Berlin forks", () => {
    expect(Gas.hasEIP2929("homestead")).toBe(false);
    expect(Gas.hasEIP2929("byzantium")).toBe(false);
    expect(Gas.hasEIP2929("constantinople")).toBe(false);
    expect(Gas.hasEIP2929("istanbul")).toBe(false);
  });

  it("returns true for Berlin and later", () => {
    expect(Gas.hasEIP2929("berlin")).toBe(true);
    expect(Gas.hasEIP2929("london")).toBe(true);
    expect(Gas.hasEIP2929("paris")).toBe(true);
    expect(Gas.hasEIP2929("shanghai")).toBe(true);
    expect(Gas.hasEIP2929("cancun")).toBe(true);
  });
});

describe("Gas.hasEIP3529", () => {
  it("returns false for pre-London forks", () => {
    expect(Gas.hasEIP3529("homestead")).toBe(false);
    expect(Gas.hasEIP3529("byzantium")).toBe(false);
    expect(Gas.hasEIP3529("constantinople")).toBe(false);
    expect(Gas.hasEIP3529("istanbul")).toBe(false);
    expect(Gas.hasEIP3529("berlin")).toBe(false);
  });

  it("returns true for London and later", () => {
    expect(Gas.hasEIP3529("london")).toBe(true);
    expect(Gas.hasEIP3529("paris")).toBe(true);
    expect(Gas.hasEIP3529("shanghai")).toBe(true);
    expect(Gas.hasEIP3529("cancun")).toBe(true);
  });
});

describe("Gas.hasEIP3860", () => {
  it("returns false for pre-Shanghai forks", () => {
    expect(Gas.hasEIP3860("homestead")).toBe(false);
    expect(Gas.hasEIP3860("byzantium")).toBe(false);
    expect(Gas.hasEIP3860("istanbul")).toBe(false);
    expect(Gas.hasEIP3860("berlin")).toBe(false);
    expect(Gas.hasEIP3860("london")).toBe(false);
    expect(Gas.hasEIP3860("paris")).toBe(false);
  });

  it("returns true for Shanghai and later", () => {
    expect(Gas.hasEIP3860("shanghai")).toBe(true);
    expect(Gas.hasEIP3860("cancun")).toBe(true);
  });
});

describe("Gas.hasEIP1153", () => {
  it("returns false for pre-Cancun forks", () => {
    expect(Gas.hasEIP1153("homestead")).toBe(false);
    expect(Gas.hasEIP1153("byzantium")).toBe(false);
    expect(Gas.hasEIP1153("istanbul")).toBe(false);
    expect(Gas.hasEIP1153("berlin")).toBe(false);
    expect(Gas.hasEIP1153("london")).toBe(false);
    expect(Gas.hasEIP1153("paris")).toBe(false);
    expect(Gas.hasEIP1153("shanghai")).toBe(false);
  });

  it("returns true for Cancun", () => {
    expect(Gas.hasEIP1153("cancun")).toBe(true);
  });
});

describe("Gas.hasEIP4844", () => {
  it("returns false for pre-Cancun forks", () => {
    expect(Gas.hasEIP4844("homestead")).toBe(false);
    expect(Gas.hasEIP4844("byzantium")).toBe(false);
    expect(Gas.hasEIP4844("istanbul")).toBe(false);
    expect(Gas.hasEIP4844("berlin")).toBe(false);
    expect(Gas.hasEIP4844("london")).toBe(false);
    expect(Gas.hasEIP4844("paris")).toBe(false);
    expect(Gas.hasEIP4844("shanghai")).toBe(false);
  });

  it("returns true for Cancun", () => {
    expect(Gas.hasEIP4844("cancun")).toBe(true);
  });
});

describe("Gas.getColdSloadCost", () => {
  it("returns warm cost for pre-Berlin forks", () => {
    expect(Gas.getColdSloadCost("homestead")).toBe(100n);
    expect(Gas.getColdSloadCost("byzantium")).toBe(100n);
    expect(Gas.getColdSloadCost("istanbul")).toBe(100n);
  });

  it("returns cold cost for Berlin and later", () => {
    expect(Gas.getColdSloadCost("berlin")).toBe(2100n);
    expect(Gas.getColdSloadCost("london")).toBe(2100n);
    expect(Gas.getColdSloadCost("cancun")).toBe(2100n);
  });
});

describe("Gas.getColdAccountAccessCost", () => {
  it("returns ExtStep for pre-Berlin forks", () => {
    expect(Gas.getColdAccountAccessCost("homestead")).toBe(20n);
    expect(Gas.getColdAccountAccessCost("byzantium")).toBe(20n);
    expect(Gas.getColdAccountAccessCost("istanbul")).toBe(20n);
  });

  it("returns ColdAccountAccess for Berlin and later", () => {
    expect(Gas.getColdAccountAccessCost("berlin")).toBe(2600n);
    expect(Gas.getColdAccountAccessCost("london")).toBe(2600n);
    expect(Gas.getColdAccountAccessCost("cancun")).toBe(2600n);
  });
});

describe("Gas.getSstoreRefund", () => {
  it("returns old refund for pre-London forks", () => {
    expect(Gas.getSstoreRefund("homestead")).toBe(15000n);
    expect(Gas.getSstoreRefund("byzantium")).toBe(15000n);
    expect(Gas.getSstoreRefund("istanbul")).toBe(15000n);
    expect(Gas.getSstoreRefund("berlin")).toBe(15000n);
  });

  it("returns EIP-3529 refund for London and later", () => {
    expect(Gas.getSstoreRefund("london")).toBe(4800n);
    expect(Gas.getSstoreRefund("paris")).toBe(4800n);
    expect(Gas.getSstoreRefund("cancun")).toBe(4800n);
  });
});

describe("Gas.getSelfdestructRefund", () => {
  it("returns refund for pre-London forks", () => {
    expect(Gas.getSelfdestructRefund("homestead")).toBe(24000n);
    expect(Gas.getSelfdestructRefund("byzantium")).toBe(24000n);
    expect(Gas.getSelfdestructRefund("istanbul")).toBe(24000n);
    expect(Gas.getSelfdestructRefund("berlin")).toBe(24000n);
  });

  it("returns zero refund for London and later", () => {
    expect(Gas.getSelfdestructRefund("london")).toBe(0n);
    expect(Gas.getSelfdestructRefund("paris")).toBe(0n);
    expect(Gas.getSelfdestructRefund("cancun")).toBe(0n);
  });
});

// ============================================================================
// Edge Cases and Integration Tests
// ============================================================================

describe("Gas Edge Cases", () => {
  it("handles maximum word calculations", () => {
    const maxBytes = 1000000n;
    const cost = Gas.calculateKeccak256Cost(maxBytes);
    expect(cost).toBeGreaterThan(0n);
  });

  it("handles zero values consistently", () => {
    expect(Gas.calculateLogCost(0n, 0n)).toBe(Gas.LogBase);
    expect(Gas.calculateCopyCost(0n)).toBe(0n);
    expect(Gas.calculateKeccak256Cost(0n)).toBe(Gas.Keccak256Base);
  });

  it("calculates realistic transaction costs", () => {
    // Simple transfer
    const transferData = new Uint8Array(0);
    const transferCost = Gas.calculateTxIntrinsicGas(transferData, false);
    expect(transferCost).toBe(21000n);

    // Contract interaction with calldata
    const callData = new Uint8Array(100).fill(1);
    const callCost = Gas.calculateTxIntrinsicGas(callData, false);
    expect(callCost).toBe(21000n + 100n * 16n);

    // Contract creation
    const createData = new Uint8Array(1000);
    const createCost = Gas.calculateTxIntrinsicGas(createData, true);
    expect(createCost).toBeGreaterThan(53000n);
  });

  it("calculates realistic contract deployment costs", () => {
    const initcode = 5000n;
    const deployed = 2000n;
    const result = Gas.calculateCreateCost(initcode, deployed);

    expect(result.base).toBe(32000n);
    expect(result.dynamic).toBeGreaterThan(0n);
    expect(result.total).toBeGreaterThan(32000n);
  });

  it("handles hardfork-specific cost variations", () => {
    // SLOAD cost varies by hardfork
    expect(Gas.getColdSloadCost("istanbul")).toBe(100n);
    expect(Gas.getColdSloadCost("berlin")).toBe(2100n);

    // SSTORE refund varies by hardfork
    expect(Gas.getSstoreRefund("berlin")).toBe(15000n);
    expect(Gas.getSstoreRefund("london")).toBe(4800n);

    // Precompile costs vary by hardfork
    expect(Gas.Precompile.getEcAddCost("byzantium")).toBe(500n);
    expect(Gas.Precompile.getEcAddCost("istanbul")).toBe(150n);
  });
});

// ============================================================================
// WASM Implementation Status Tests
// ============================================================================

describe("Gas WASM Implementation Status", () => {
  it("reports WASM is not available", () => {
    expect(isWasmGasAvailable()).toBe(false);
  });

  it("provides implementation status details", () => {
    const status = getGasImplementationStatus();

    expect(status.available).toBe(false);
    expect(status.reason).toBe("Pure TS optimal - constants and simple math");
    expect(status.recommendation).toContain("pure TypeScript");
    expect(status.performance.typescriptAvg).toBe(
      "5-200ns per operation (constant access to simple calculation)",
    );
    expect(status.performance.wasmOverhead).toBe("1-2μs per WASM call");
    expect(status.performance.verdict).toBe(
      "TypeScript 10-400x faster for these operations",
    );
    expect(status.notes).toContain("EVM interpreter");
  });

  it("status explains WASM makes sense at interpreter level", () => {
    const status = getGasImplementationStatus();

    // WASM makes sense for EVM execution, not constants
    expect(status.notes).toContain("interpreter level");
    expect(status.notes).toContain("using these constants");
  });
});
