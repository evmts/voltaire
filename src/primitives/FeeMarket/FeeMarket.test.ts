/**
 * Tests for FeeMarket module
 */

import { describe, it, expect } from "vitest";
import { FeeMarket } from "./FeeMarket/index.js";
import {
  isWasmFeeMarketAvailable,
  getFeeMarketImplementationStatus,
} from "./fee-market.wasm.js";

// ============================================================================
// Constants Tests
// ============================================================================

describe("FeeMarket.Eip1559 Constants", () => {
  it("has correct MIN_BASE_FEE", () => {
    expect(FeeMarket.Eip1559.MIN_BASE_FEE).toBe(7n);
  });

  it("has correct BASE_FEE_CHANGE_DENOMINATOR", () => {
    expect(FeeMarket.Eip1559.BASE_FEE_CHANGE_DENOMINATOR).toBe(8n);
  });

  it("has correct ELASTICITY_MULTIPLIER", () => {
    expect(FeeMarket.Eip1559.ELASTICITY_MULTIPLIER).toBe(2n);
  });
});

describe("FeeMarket.Eip4844 Constants", () => {
  it("has correct MIN_BLOB_BASE_FEE", () => {
    expect(FeeMarket.Eip4844.MIN_BLOB_BASE_FEE).toBe(1n);
  });

  it("has correct BLOB_BASE_FEE_UPDATE_FRACTION", () => {
    expect(FeeMarket.Eip4844.BLOB_BASE_FEE_UPDATE_FRACTION).toBe(3338477n);
  });

  it("has correct TARGET_BLOB_GAS_PER_BLOCK", () => {
    expect(FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK).toBe(393216n);
  });

  it("has correct BLOB_GAS_PER_BLOB", () => {
    expect(FeeMarket.Eip4844.BLOB_GAS_PER_BLOB).toBe(131072n);
  });

  it("has correct MAX_BLOBS_PER_BLOCK", () => {
    expect(FeeMarket.Eip4844.MAX_BLOBS_PER_BLOCK).toBe(6n);
  });

  it("has correct MAX_BLOB_GAS_PER_BLOCK", () => {
    expect(FeeMarket.Eip4844.MAX_BLOB_GAS_PER_BLOCK).toBe(786432n);
    expect(FeeMarket.Eip4844.MAX_BLOB_GAS_PER_BLOCK).toBe(
      FeeMarket.Eip4844.MAX_BLOBS_PER_BLOCK * FeeMarket.Eip4844.BLOB_GAS_PER_BLOB,
    );
  });
});

// ============================================================================
// Base Fee Calculation Tests (EIP-1559)
// ============================================================================

describe("FeeMarket.calculateBaseFee", () => {
  it("keeps base fee unchanged at target", () => {
    const baseFee = FeeMarket.calculateBaseFee(
      15_000_000n, // 50% of limit (at target)
      30_000_000n,
      1_000_000_000n,
    );
    expect(baseFee).toBe(1_000_000_000n);
  });

  it("keeps base fee unchanged for empty block", () => {
    const baseFee = FeeMarket.calculateBaseFee(
      0n,
      30_000_000n,
      1_000_000_000n,
    );
    expect(baseFee).toBe(1_000_000_000n);
  });

  it("increases base fee for full block", () => {
    const baseFee = FeeMarket.calculateBaseFee(
      30_000_000n, // 100% full
      30_000_000n,
      1_000_000_000n,
    );
    // Should increase by 12.5% (1/8)
    expect(baseFee).toBe(1_125_000_000n);
  });

  it("increases base fee above target proportionally", () => {
    const baseFee = FeeMarket.calculateBaseFee(
      22_500_000n, // 75% full (50% above target)
      30_000_000n,
      1_000_000_000n,
    );
    // 50% above target = 6.25% increase
    expect(baseFee).toBe(1_062_500_000n);
  });

  it("decreases base fee below target", () => {
    const baseFee = FeeMarket.calculateBaseFee(
      7_500_000n, // 25% full (50% below target)
      30_000_000n,
      1_000_000_000n,
    );
    // 50% below target = 6.25% decrease
    expect(baseFee).toBe(937_500_000n);
  });

  it("enforces minimum base fee", () => {
    const baseFee = FeeMarket.calculateBaseFee(
      0n,
      30_000_000n,
      1n, // Below minimum
    );
    expect(baseFee).toBe(1n);
  });

  it("enforces minimum base fee on decrease", () => {
    const baseFee = FeeMarket.calculateBaseFee(
      0n,
      30_000_000n,
      FeeMarket.Eip1559.MIN_BASE_FEE,
    );
    expect(baseFee).toBe(FeeMarket.Eip1559.MIN_BASE_FEE);
  });

  it("handles very small base fee", () => {
    const baseFee = FeeMarket.calculateBaseFee(
      30_000_000n,
      30_000_000n,
      8n,
    );
    // Should still enforce minimum increase
    expect(baseFee).toBeGreaterThan(8n);
  });

  it("handles maximum gas usage", () => {
    const baseFee = FeeMarket.calculateBaseFee(
      30_000_000n,
      30_000_000n,
      100_000_000_000n,
    );
    expect(baseFee).toBe(112_500_000_000n);
  });
});

// ============================================================================
// Blob Fee Calculation Tests (EIP-4844)
// ============================================================================

describe("FeeMarket.calculateBlobBaseFee", () => {
  it("returns minimum fee with no excess", () => {
    const fee = FeeMarket.calculateBlobBaseFee(0n);
    expect(fee).toBe(FeeMarket.Eip4844.MIN_BLOB_BASE_FEE);
  });

  it("increases fee with excess blob gas", () => {
    const fee = FeeMarket.calculateBlobBaseFee(393216n); // 1 target worth
    expect(fee).toBeGreaterThanOrEqual(FeeMarket.Eip4844.MIN_BLOB_BASE_FEE);
  });

  it("increases exponentially with high excess", () => {
    const fee1 = FeeMarket.calculateBlobBaseFee(10_000_000n);
    const fee2 = FeeMarket.calculateBlobBaseFee(20_000_000n); // 2x excess
    const fee3 = FeeMarket.calculateBlobBaseFee(30_000_000n); // 3x excess

    expect(fee2).toBeGreaterThan(fee1);
    expect(fee3).toBeGreaterThan(fee2);
    // Exponential growth
    expect(fee3 - fee2).toBeGreaterThan(fee2 - fee1);
  });

  it("handles very small excess", () => {
    const fee = FeeMarket.calculateBlobBaseFee(1n);
    expect(fee).toBeGreaterThanOrEqual(FeeMarket.Eip4844.MIN_BLOB_BASE_FEE);
  });

  it("handles large excess gas values", () => {
    const fee = FeeMarket.calculateBlobBaseFee(10_000_000n);
    expect(fee).toBeGreaterThan(0n);
  });
});

describe("FeeMarket.calculateExcessBlobGas", () => {
  it("returns 0 below target", () => {
    const excess = FeeMarket.calculateExcessBlobGas(
      0n,
      131072n, // 1 blob (below 3 blob target)
    );
    expect(excess).toBe(0n);
  });

  it("returns 0 at target", () => {
    const excess = FeeMarket.calculateExcessBlobGas(
      0n,
      393216n, // 3 blobs (at target)
    );
    expect(excess).toBe(0n);
  });

  it("accumulates excess above target", () => {
    const excess = FeeMarket.calculateExcessBlobGas(
      0n,
      786432n, // 6 blobs (3 above target)
    );
    expect(excess).toBe(393216n); // 3 blobs worth
  });

  it("carries forward previous excess", () => {
    const excess = FeeMarket.calculateExcessBlobGas(
      393216n, // Previous excess
      393216n, // Current usage at target
    );
    expect(excess).toBe(393216n); // Maintains excess
  });

  it("combines previous excess with new excess", () => {
    const excess = FeeMarket.calculateExcessBlobGas(
      393216n, // Previous excess (3 blobs)
      786432n, // 6 blobs usage (3 above target)
    );
    expect(excess).toBe(786432n); // 6 blobs worth total
  });

  it("reduces excess below target usage", () => {
    const excess = FeeMarket.calculateExcessBlobGas(
      393216n, // Previous excess (3 blobs)
      262144n, // 2 blobs (1 below target)
    );
    expect(excess).toBe(262144n); // Reduced by 1 blob
  });

  it("clears excess with low usage", () => {
    const excess = FeeMarket.calculateExcessBlobGas(
      131072n, // 1 blob excess
      0n, // No usage
    );
    expect(excess).toBe(0n);
  });

  it("handles no usage and no excess", () => {
    const excess = FeeMarket.calculateExcessBlobGas(0n, 0n);
    expect(excess).toBe(0n);
  });
});

// ============================================================================
// Transaction Fee Calculation Tests
// ============================================================================

describe("FeeMarket.calculateTxFee", () => {
  it("calculates full priority fee when below max", () => {
    const fee = FeeMarket.calculateTxFee({
      maxFeePerGas: 2_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      baseFee: 800_000_000n,
    });

    expect(fee.effectiveGasPrice).toBe(1_800_000_000n);
    expect(fee.priorityFee).toBe(1_000_000_000n);
    expect(fee.baseFee).toBe(800_000_000n);
  });

  it("caps at maxFeePerGas", () => {
    const fee = FeeMarket.calculateTxFee({
      maxFeePerGas: 1_500_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      baseFee: 800_000_000n,
    });

    expect(fee.effectiveGasPrice).toBe(1_500_000_000n);
    expect(fee.priorityFee).toBe(700_000_000n); // Reduced tip
    expect(fee.baseFee).toBe(800_000_000n);
  });

  it("handles zero priority fee", () => {
    const fee = FeeMarket.calculateTxFee({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 0n,
      baseFee: 1_000_000_000n,
    });

    expect(fee.effectiveGasPrice).toBe(1_000_000_000n);
    expect(fee.priorityFee).toBe(0n);
    expect(fee.baseFee).toBe(1_000_000_000n);
  });

  it("handles maxFee equal to baseFee", () => {
    const fee = FeeMarket.calculateTxFee({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 1_000_000_000n,
    });

    expect(fee.effectiveGasPrice).toBe(1_000_000_000n);
    expect(fee.priorityFee).toBe(0n);
    expect(fee.baseFee).toBe(1_000_000_000n);
  });

  it("handles very low base fee", () => {
    const fee = FeeMarket.calculateTxFee({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 10n,
    });

    expect(fee.effectiveGasPrice).toBe(100_000_010n); // baseFee + priority
    expect(fee.priorityFee).toBe(100_000_000n);
    expect(fee.baseFee).toBe(10n);
  });
});

describe("FeeMarket.calculateBlobTxFee", () => {
  it("calculates blob fee with regular tx fee", () => {
    const fee = FeeMarket.calculateBlobTxFee({
      maxFeePerGas: 2_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      baseFee: 800_000_000n,
      maxFeePerBlobGas: 10_000_000n,
      blobBaseFee: 5_000_000n,
      blobCount: 3n,
    });

    expect(fee.effectiveGasPrice).toBe(1_800_000_000n);
    expect(fee.priorityFee).toBe(1_000_000_000n);
    expect(fee.baseFee).toBe(800_000_000n);
    expect(fee.blobGasPrice).toBe(5_000_000n);
    expect(fee.totalBlobFee).toBe(1_966_080_000_000n); // 3 * 131072 * 5_000_000
  });

  it("caps blob fee at maxFeePerBlobGas", () => {
    const fee = FeeMarket.calculateBlobTxFee({
      maxFeePerGas: 2_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      baseFee: 800_000_000n,
      maxFeePerBlobGas: 3_000_000n,
      blobBaseFee: 5_000_000n,
      blobCount: 3n,
    });

    expect(fee.blobGasPrice).toBe(3_000_000n); // Capped
    expect(fee.totalBlobFee).toBe(1_179_648_000_000n); // 3 * 131072 * 3_000_000
  });

  it("handles single blob", () => {
    const fee = FeeMarket.calculateBlobTxFee({
      maxFeePerGas: 2_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      baseFee: 800_000_000n,
      maxFeePerBlobGas: 10_000_000n,
      blobBaseFee: 5_000_000n,
      blobCount: 1n,
    });

    expect(fee.totalBlobFee).toBe(655_360_000_000n); // 1 * 131072 * 5_000_000
  });

  it("handles maximum blobs", () => {
    const fee = FeeMarket.calculateBlobTxFee({
      maxFeePerGas: 2_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      baseFee: 800_000_000n,
      maxFeePerBlobGas: 10_000_000n,
      blobBaseFee: 5_000_000n,
      blobCount: 6n,
    });

    expect(fee.totalBlobFee).toBe(3_932_160_000_000n); // 6 * 131072 * 5_000_000
  });

  it("handles minimum blob base fee", () => {
    const fee = FeeMarket.calculateBlobTxFee({
      maxFeePerGas: 2_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      baseFee: 800_000_000n,
      maxFeePerBlobGas: 10_000_000n,
      blobBaseFee: 1n,
      blobCount: 3n,
    });

    expect(fee.blobGasPrice).toBe(1n);
    expect(fee.totalBlobFee).toBe(393216n); // 3 * 131072 * 1
  });
});

describe("FeeMarket.canIncludeTx", () => {
  it("returns true when maxFee covers baseFee", () => {
    const canInclude = FeeMarket.canIncludeTx({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 900_000_000n,
    });
    expect(canInclude).toBe(true);
  });

  it("returns false when maxFee below baseFee", () => {
    const canInclude = FeeMarket.canIncludeTx({
      maxFeePerGas: 800_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 900_000_000n,
    });
    expect(canInclude).toBe(false);
  });

  it("returns true when maxFee equals baseFee", () => {
    const canInclude = FeeMarket.canIncludeTx({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 1_000_000_000n,
    });
    expect(canInclude).toBe(true);
  });

  it("returns true for blob tx with sufficient fees", () => {
    const canInclude = FeeMarket.canIncludeTx({
      maxFeePerGas: 2_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      baseFee: 1_500_000_000n,
      maxFeePerBlobGas: 10_000_000n,
      blobBaseFee: 5_000_000n,
      blobCount: 3n,
    });
    expect(canInclude).toBe(true);
  });

  it("returns false for blob tx with insufficient blob fee", () => {
    const canInclude = FeeMarket.canIncludeTx({
      maxFeePerGas: 2_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      baseFee: 1_500_000_000n,
      maxFeePerBlobGas: 3_000_000n,
      blobBaseFee: 5_000_000n,
      blobCount: 3n,
    });
    expect(canInclude).toBe(false);
  });

  it("returns false for blob tx with insufficient gas fee", () => {
    const canInclude = FeeMarket.canIncludeTx({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 1_500_000_000n,
      maxFeePerBlobGas: 10_000_000n,
      blobBaseFee: 5_000_000n,
      blobCount: 3n,
    });
    expect(canInclude).toBe(false);
  });
});

// ============================================================================
// State Operation Tests
// ============================================================================

describe("FeeMarket.nextState", () => {
  it("calculates next state with gas above target", () => {
    const state: FeeMarket.State = {
      gasUsed: 20_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 262144n,
    };

    const next = FeeMarket.nextState(state);

    expect(next.gasUsed).toBe(0n); // Reset
    expect(next.gasLimit).toBe(30_000_000n);
    expect(next.baseFee).toBeGreaterThan(state.baseFee); // Above target
    expect(next.excessBlobGas).toBe(0n); // Below blob target
    expect(next.blobGasUsed).toBe(0n); // Reset
  });

  it("calculates next state with gas below target", () => {
    const state: FeeMarket.State = {
      gasUsed: 10_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    };

    const next = FeeMarket.nextState(state);

    expect(next.baseFee).toBeLessThan(state.baseFee); // Below target
  });

  it("calculates next state with blobs above target", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 786432n, // 6 blobs (above target)
    };

    const next = FeeMarket.nextState(state);

    expect(next.excessBlobGas).toBe(393216n); // Accumulated excess
  });

  it("maintains state at target", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 393216n, // At target
    };

    const next = FeeMarket.nextState(state);

    expect(next.baseFee).toBe(state.baseFee);
    expect(next.excessBlobGas).toBe(0n);
  });
});

describe("FeeMarket.State.next", () => {
  it("calculates next state using convenience form", () => {
    const state: FeeMarket.State = {
      gasUsed: 20_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 262144n,
    };

    const next = FeeMarket.State.next.call(state);

    expect(next.gasUsed).toBe(0n);
    expect(next.gasLimit).toBe(30_000_000n);
    expect(next.baseFee).toBeGreaterThan(state.baseFee);
  });
});

describe("FeeMarket.State.getBlobBaseFee", () => {
  it("gets blob base fee from state", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 10_000_000n, // Use higher excess to ensure fee > MIN
      blobGasUsed: 0n,
    };

    const blobBaseFee = FeeMarket.State.getBlobBaseFee.call(state);
    expect(blobBaseFee).toBeGreaterThan(FeeMarket.Eip4844.MIN_BLOB_BASE_FEE);
  });

  it("returns minimum with no excess", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    };

    const blobBaseFee = FeeMarket.State.getBlobBaseFee.call(state);
    expect(blobBaseFee).toBe(FeeMarket.Eip4844.MIN_BLOB_BASE_FEE);
  });
});

describe("FeeMarket.State.getGasTarget", () => {
  it("calculates gas target as half of limit", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    };

    const target = FeeMarket.State.getGasTarget.call(state);
    expect(target).toBe(15_000_000n);
  });
});

describe("FeeMarket.State.isAboveGasTarget", () => {
  it("returns true when above target", () => {
    const state: FeeMarket.State = {
      gasUsed: 20_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    };

    expect(FeeMarket.State.isAboveGasTarget.call(state)).toBe(true);
  });

  it("returns false when at target", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    };

    expect(FeeMarket.State.isAboveGasTarget.call(state)).toBe(false);
  });

  it("returns false when below target", () => {
    const state: FeeMarket.State = {
      gasUsed: 10_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    };

    expect(FeeMarket.State.isAboveGasTarget.call(state)).toBe(false);
  });
});

describe("FeeMarket.State.isAboveBlobGasTarget", () => {
  it("returns true when above blob target", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 524288n, // 4 blobs (above 3 blob target)
    };

    expect(FeeMarket.State.isAboveBlobGasTarget.call(state)).toBe(true);
  });

  it("returns false when at blob target", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 393216n, // 3 blobs (at target)
    };

    expect(FeeMarket.State.isAboveBlobGasTarget.call(state)).toBe(false);
  });

  it("returns false when below blob target", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 262144n, // 2 blobs (below target)
    };

    expect(FeeMarket.State.isAboveBlobGasTarget.call(state)).toBe(false);
  });
});

// ============================================================================
// Projection Tests
// ============================================================================

describe("FeeMarket.projectBaseFees", () => {
  it("projects increasing fees above target", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    };

    const fees = FeeMarket.projectBaseFees(state, 5, 25_000_000n, 0n);

    expect(fees.length).toBe(5);
    // Each fee should be higher than previous (above target)
    for (let i = 1; i < fees.length; i++) {
      expect(fees[i]!).toBeGreaterThan(fees[i - 1]!);
    }
  });

  it("projects decreasing fees below target", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    };

    const fees = FeeMarket.projectBaseFees(state, 5, 10_000_000n, 0n);

    expect(fees.length).toBe(5);
    // Each fee should be lower than previous (below target)
    for (let i = 1; i < fees.length; i++) {
      expect(fees[i]!).toBeLessThan(fees[i - 1]!);
    }
  });

  it("projects stable fees at target", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    };

    const fees = FeeMarket.projectBaseFees(state, 5, 15_000_000n, 0n);

    expect(fees.length).toBe(5);
    // All fees should be equal (at target)
    for (let i = 0; i < fees.length; i++) {
      expect(fees[i]).toBe(1_000_000_000n);
    }
  });

  it("projects many blocks ahead", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    };

    const fees = FeeMarket.projectBaseFees(state, 100, 25_000_000n, 0n);

    expect(fees.length).toBe(100);
    expect(fees[99]).toBeGreaterThan(state.baseFee);
  });

  it("includes blob gas in projections", () => {
    const state: FeeMarket.State = {
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    };

    const fees = FeeMarket.projectBaseFees(
      state,
      5,
      15_000_000n,
      786432n, // 6 blobs per block
    );

    expect(fees.length).toBe(5);
    // Base fee shouldn't change much (at gas target)
    // But blob excess should accumulate
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe("FeeMarket.validateTxFeeParams", () => {
  it("validates correct params", () => {
    const errors = FeeMarket.validateTxFeeParams({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 900_000_000n,
    });
    expect(errors).toHaveLength(0);
  });

  it("detects negative maxFeePerGas", () => {
    const errors = FeeMarket.validateTxFeeParams({
      maxFeePerGas: -1n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 900_000_000n,
    });
    expect(errors).toContain("maxFeePerGas must be non-negative");
  });

  it("detects negative maxPriorityFeePerGas", () => {
    const errors = FeeMarket.validateTxFeeParams({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: -1n,
      baseFee: 900_000_000n,
    });
    expect(errors).toContain("maxPriorityFeePerGas must be non-negative");
  });

  it("detects priority fee exceeding max fee", () => {
    const errors = FeeMarket.validateTxFeeParams({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 2_000_000_000n,
      baseFee: 900_000_000n,
    });
    expect(errors).toContain("maxPriorityFeePerGas cannot exceed maxFeePerGas");
  });

  it("detects negative baseFee", () => {
    const errors = FeeMarket.validateTxFeeParams({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: -1n,
    });
    expect(errors).toContain("baseFee must be non-negative");
  });

  it("validates correct blob tx params", () => {
    const errors = FeeMarket.validateTxFeeParams({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 900_000_000n,
      maxFeePerBlobGas: 10_000_000n,
      blobBaseFee: 5_000_000n,
      blobCount: 3n,
    });
    expect(errors).toHaveLength(0);
  });

  it("detects negative maxFeePerBlobGas", () => {
    const errors = FeeMarket.validateTxFeeParams({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 900_000_000n,
      maxFeePerBlobGas: -1n,
      blobBaseFee: 5_000_000n,
      blobCount: 3n,
    });
    expect(errors).toContain("maxFeePerBlobGas must be non-negative");
  });

  it("detects negative blobBaseFee", () => {
    const errors = FeeMarket.validateTxFeeParams({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 900_000_000n,
      maxFeePerBlobGas: 10_000_000n,
      blobBaseFee: -1n,
      blobCount: 3n,
    });
    expect(errors).toContain("blobBaseFee must be non-negative");
  });

  it("detects invalid blob count (zero)", () => {
    const errors = FeeMarket.validateTxFeeParams({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 900_000_000n,
      maxFeePerBlobGas: 10_000_000n,
      blobBaseFee: 5_000_000n,
      blobCount: 0n,
    });
    expect(errors).toContain("blobCount must be between 1 and 6");
  });

  it("detects invalid blob count (too many)", () => {
    const errors = FeeMarket.validateTxFeeParams({
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 100_000_000n,
      baseFee: 900_000_000n,
      maxFeePerBlobGas: 10_000_000n,
      blobBaseFee: 5_000_000n,
      blobCount: 7n,
    });
    expect(errors).toContain("blobCount must be between 1 and 6");
  });

  it("detects multiple errors", () => {
    const errors = FeeMarket.validateTxFeeParams({
      maxFeePerGas: -1n,
      maxPriorityFeePerGas: -1n,
      baseFee: -1n,
    });
    expect(errors.length).toBeGreaterThan(1);
  });
});

describe("FeeMarket.validateState", () => {
  it("validates correct state", () => {
    const errors = FeeMarket.validateState({
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    });
    expect(errors).toHaveLength(0);
  });

  it("detects negative gasUsed", () => {
    const errors = FeeMarket.validateState({
      gasUsed: -1n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    });
    expect(errors).toContain("gasUsed must be non-negative");
  });

  it("detects non-positive gasLimit", () => {
    const errors = FeeMarket.validateState({
      gasUsed: 0n,
      gasLimit: 0n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    });
    expect(errors).toContain("gasLimit must be positive");
  });

  it("detects gasUsed exceeding gasLimit", () => {
    const errors = FeeMarket.validateState({
      gasUsed: 40_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    });
    expect(errors).toContain("gasUsed cannot exceed gasLimit");
  });

  it("detects baseFee below minimum", () => {
    const errors = FeeMarket.validateState({
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1n,
      excessBlobGas: 0n,
      blobGasUsed: 0n,
    });
    expect(errors).toContain("baseFee must be at least 7");
  });

  it("detects negative excessBlobGas", () => {
    const errors = FeeMarket.validateState({
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: -1n,
      blobGasUsed: 0n,
    });
    expect(errors).toContain("excessBlobGas must be non-negative");
  });

  it("detects negative blobGasUsed", () => {
    const errors = FeeMarket.validateState({
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: -1n,
    });
    expect(errors).toContain("blobGasUsed must be non-negative");
  });

  it("detects blobGasUsed exceeding maximum", () => {
    const errors = FeeMarket.validateState({
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 1_000_000n,
    });
    expect(errors).toContain("blobGasUsed cannot exceed 786432");
  });

  it("accepts maximum valid blob gas", () => {
    const errors = FeeMarket.validateState({
      gasUsed: 15_000_000n,
      gasLimit: 30_000_000n,
      baseFee: 1_000_000_000n,
      excessBlobGas: 0n,
      blobGasUsed: 786432n, // Max: 6 blobs
    });
    expect(errors).toHaveLength(0);
  });

  it("detects multiple errors", () => {
    const errors = FeeMarket.validateState({
      gasUsed: -1n,
      gasLimit: 0n,
      baseFee: 1n,
      excessBlobGas: -1n,
      blobGasUsed: -1n,
    });
    expect(errors.length).toBeGreaterThan(1);
  });
});

// ============================================================================
// Utility Tests
// ============================================================================

describe("FeeMarket.weiToGwei", () => {
  it("converts 1 gwei", () => {
    const gwei = FeeMarket.weiToGwei(1_000_000_000n);
    expect(gwei).toBe("1.000000000");
  });

  it("converts fractional gwei", () => {
    const gwei = FeeMarket.weiToGwei(1_234_567_890n);
    expect(gwei).toBe("1.234567890");
  });

  it("converts zero", () => {
    const gwei = FeeMarket.weiToGwei(0n);
    expect(gwei).toBe("0.000000000");
  });

  it("converts large values", () => {
    const gwei = FeeMarket.weiToGwei(100_000_000_000n);
    expect(gwei).toBe("100.000000000");
  });

  it("converts small values", () => {
    const gwei = FeeMarket.weiToGwei(7n);
    expect(gwei).toBe("0.000000007");
  });
});

describe("FeeMarket.gweiToWei", () => {
  it("converts 1 gwei", () => {
    const wei = FeeMarket.gweiToWei(1);
    expect(wei).toBe(1_000_000_000n);
  });

  it("converts fractional gwei", () => {
    const wei = FeeMarket.gweiToWei(1.5);
    expect(wei).toBe(1_500_000_000n);
  });

  it("converts zero", () => {
    const wei = FeeMarket.gweiToWei(0);
    expect(wei).toBe(0n);
  });

  it("converts large values", () => {
    const wei = FeeMarket.gweiToWei(100);
    expect(wei).toBe(100_000_000_000n);
  });

  it("truncates sub-wei precision", () => {
    const wei = FeeMarket.gweiToWei(1.0000000001);
    expect(wei).toBe(1_000_000_000n);
  });
});

// ============================================================================
// WASM Implementation Status Tests
// ============================================================================

describe("FeeMarket WASM Implementation Status", () => {
  it("reports WASM is not available", () => {
    expect(isWasmFeeMarketAvailable()).toBe(false);
  });

  it("provides implementation status details", () => {
    const status = getFeeMarketImplementationStatus();

    expect(status.available).toBe(false);
    expect(status.reason).toBe("Pure TS optimal - WASM overhead exceeds benefit");
    expect(status.recommendation).toContain("pure TypeScript");
    expect(status.performance.typescriptAvg).toBe("100-800ns per operation");
    expect(status.performance.wasmOverhead).toBe("1-2μs per WASM call");
    expect(status.performance.verdict).toBe(
      "TypeScript 10-20x faster for these operations",
    );
  });

  it("status explains why WASM is not needed", () => {
    const status = getFeeMarketImplementationStatus();

    // WASM not needed for lightweight calculations
    expect(status.reason).toContain("optimal");
    expect(status.performance.verdict).toContain("faster");
  });
});
