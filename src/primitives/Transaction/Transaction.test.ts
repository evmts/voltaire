/**
 * Tests for Transaction module
 */

import { describe, it, expect, expectTypeOf } from "vitest";
import { Transaction } from "../Transaction/index.js";
import type { Address } from "../Address/index.js";
import type { Hash } from "../Hash/index.js";

// ============================================================================
// Test Data Helpers
// ============================================================================

function createAddress(byte: number): Address {
  const addr = new Uint8Array(20);
  addr.fill(byte);
  return addr as Address;
}

function createHash(byte: number): Hash {
  const hash = new Uint8Array(32);
  hash.fill(byte);
  return hash as Hash;
}

function createBytes(length: number, fill: number = 0): Uint8Array {
  const bytes = new Uint8Array(length);
  bytes.fill(fill);
  return bytes;
}

const testAddress = createAddress(1);
const testHash = createHash(10);
const testSignature = {
  r: createBytes(32, 1),
  s: createBytes(32, 2),
};

// ============================================================================
// Type Tests
// ============================================================================

describe("Transaction.Type", () => {
  it("has correct enum values", () => {
    expect(Transaction.Type.Legacy).toBe(0x00);
    expect(Transaction.Type.EIP2930).toBe(0x01);
    expect(Transaction.Type.EIP1559).toBe(0x02);
    expect(Transaction.Type.EIP4844).toBe(0x03);
    expect(Transaction.Type.EIP7702).toBe(0x04);
  });
});

// ============================================================================
// Type Guard Tests
// ============================================================================

describe("Transaction type guards", () => {
  const legacyTx: Transaction.Legacy = {
    type: Transaction.Type.Legacy,
    nonce: 0n,
    gasPrice: 20000000000n,
    gasLimit: 21000n,
    to: testAddress,
    value: 1000000000000000000n,
    data: new Uint8Array(),
    v: 27n,
    r: testSignature.r,
    s: testSignature.s,
  };

  const eip2930Tx: Transaction.EIP2930 = {
    type: Transaction.Type.EIP2930,
    chainId: 1n,
    nonce: 0n,
    gasPrice: 20000000000n,
    gasLimit: 21000n,
    to: testAddress,
    value: 1000000000000000000n,
    data: new Uint8Array(),
    accessList: [],
    yParity: 0,
    r: testSignature.r,
    s: testSignature.s,
  };

  const eip1559Tx: Transaction.EIP1559 = {
    type: Transaction.Type.EIP1559,
    chainId: 1n,
    nonce: 0n,
    maxPriorityFeePerGas: 1000000000n,
    maxFeePerGas: 20000000000n,
    gasLimit: 21000n,
    to: testAddress,
    value: 1000000000000000000n,
    data: new Uint8Array(),
    accessList: [],
    yParity: 0,
    r: testSignature.r,
    s: testSignature.s,
  };

  const eip4844Tx: Transaction.EIP4844 = {
    type: Transaction.Type.EIP4844,
    chainId: 1n,
    nonce: 0n,
    maxPriorityFeePerGas: 1000000000n,
    maxFeePerGas: 20000000000n,
    gasLimit: 21000n,
    to: testAddress,
    value: 0n,
    data: new Uint8Array(),
    accessList: [],
    maxFeePerBlobGas: 1000000000n,
    blobVersionedHashes: [testHash],
    yParity: 0,
    r: testSignature.r,
    s: testSignature.s,
  };

  const eip7702Tx: Transaction.EIP7702 = {
    type: Transaction.Type.EIP7702,
    chainId: 1n,
    nonce: 0n,
    maxPriorityFeePerGas: 1000000000n,
    maxFeePerGas: 20000000000n,
    gasLimit: 21000n,
    to: testAddress,
    value: 1000000000000000000n,
    data: new Uint8Array(),
    accessList: [],
    authorizationList: [],
    yParity: 0,
    r: testSignature.r,
    s: testSignature.s,
  };

  describe("Transaction.isLegacy", () => {
    it("returns true for legacy transaction", () => {
      expect(Transaction.isLegacy(legacyTx)).toBe(true);
    });

    it("returns false for non-legacy transactions", () => {
      expect(Transaction.isLegacy(eip2930Tx)).toBe(false);
      expect(Transaction.isLegacy(eip1559Tx)).toBe(false);
      expect(Transaction.isLegacy(eip4844Tx)).toBe(false);
      expect(Transaction.isLegacy(eip7702Tx)).toBe(false);
    });
  });

  describe("Transaction.isEIP2930", () => {
    it("returns true for EIP-2930 transaction", () => {
      expect(Transaction.isEIP2930(eip2930Tx)).toBe(true);
    });

    it("returns false for non-EIP-2930 transactions", () => {
      expect(Transaction.isEIP2930(legacyTx)).toBe(false);
      expect(Transaction.isEIP2930(eip1559Tx)).toBe(false);
      expect(Transaction.isEIP2930(eip4844Tx)).toBe(false);
      expect(Transaction.isEIP2930(eip7702Tx)).toBe(false);
    });
  });

  describe("Transaction.isEIP1559", () => {
    it("returns true for EIP-1559 transaction", () => {
      expect(Transaction.isEIP1559(eip1559Tx)).toBe(true);
    });

    it("returns false for non-EIP-1559 transactions", () => {
      expect(Transaction.isEIP1559(legacyTx)).toBe(false);
      expect(Transaction.isEIP1559(eip2930Tx)).toBe(false);
      expect(Transaction.isEIP1559(eip4844Tx)).toBe(false);
      expect(Transaction.isEIP1559(eip7702Tx)).toBe(false);
    });
  });

  describe("Transaction.isEIP4844", () => {
    it("returns true for EIP-4844 transaction", () => {
      expect(Transaction.isEIP4844(eip4844Tx)).toBe(true);
    });

    it("returns false for non-EIP-4844 transactions", () => {
      expect(Transaction.isEIP4844(legacyTx)).toBe(false);
      expect(Transaction.isEIP4844(eip2930Tx)).toBe(false);
      expect(Transaction.isEIP4844(eip1559Tx)).toBe(false);
      expect(Transaction.isEIP4844(eip7702Tx)).toBe(false);
    });
  });

  describe("Transaction.isEIP7702", () => {
    it("returns true for EIP-7702 transaction", () => {
      expect(Transaction.isEIP7702(eip7702Tx)).toBe(true);
    });

    it("returns false for non-EIP-7702 transactions", () => {
      expect(Transaction.isEIP7702(legacyTx)).toBe(false);
      expect(Transaction.isEIP7702(eip2930Tx)).toBe(false);
      expect(Transaction.isEIP7702(eip1559Tx)).toBe(false);
      expect(Transaction.isEIP7702(eip4844Tx)).toBe(false);
    });
  });
});

// ============================================================================
// Transaction Creation Tests
// ============================================================================

describe("Transaction creation", () => {
  it("creates valid legacy transaction", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 5n,
      gasPrice: 25000000000n,
      gasLimit: 50000n,
      to: testAddress,
      value: 100n,
      data: new Uint8Array([1, 2, 3]),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };

    expect(tx.type).toBe(Transaction.Type.Legacy);
    expect(tx.nonce).toBe(5n);
    expect(tx.gasPrice).toBe(25000000000n);
  });

  it("creates contract creation transaction (to: null)", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 1000000n,
      to: null,
      value: 0n,
      data: new Uint8Array([0x60, 0x80]),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };

    expect(tx.to).toBeNull();
  });

  it("creates valid EIP-1559 transaction", () => {
    const tx: Transaction.EIP1559 = {
      type: Transaction.Type.EIP1559,
      chainId: 1n,
      nonce: 0n,
      maxPriorityFeePerGas: 2000000000n,
      maxFeePerGas: 30000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 1000000000000000000n,
      data: new Uint8Array(),
      accessList: [],
      yParity: 1,
      r: testSignature.r,
      s: testSignature.s,
    };

    expect(tx.type).toBe(Transaction.Type.EIP1559);
    expect(tx.maxPriorityFeePerGas).toBe(2000000000n);
    expect(tx.maxFeePerGas).toBe(30000000000n);
  });

  it("creates valid EIP-4844 blob transaction", () => {
    const tx: Transaction.EIP4844 = {
      type: Transaction.Type.EIP4844,
      chainId: 1n,
      nonce: 0n,
      maxPriorityFeePerGas: 1000000000n,
      maxFeePerGas: 20000000000n,
      gasLimit: 100000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList: [],
      maxFeePerBlobGas: 2000000000n,
      blobVersionedHashes: [testHash, createHash(20)],
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };

    expect(tx.type).toBe(Transaction.Type.EIP4844);
    expect(tx.blobVersionedHashes.length).toBe(2);
  });

  it("creates valid EIP-7702 transaction with authorization", () => {
    const authorization: Transaction.Authorization = {
      chainId: 1n,
      address: testAddress,
      nonce: 0n,
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };

    const tx: Transaction.EIP7702 = {
      type: Transaction.Type.EIP7702,
      chainId: 1n,
      nonce: 0n,
      maxPriorityFeePerGas: 1000000000n,
      maxFeePerGas: 20000000000n,
      gasLimit: 100000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList: [],
      authorizationList: [authorization],
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };

    expect(tx.type).toBe(Transaction.Type.EIP7702);
    expect(tx.authorizationList.length).toBe(1);
  });
});

// ============================================================================
// Legacy Transaction Tests
// ============================================================================

describe("Transaction.Legacy", () => {
  const legacyTx: Transaction.Legacy = {
    type: Transaction.Type.Legacy,
    nonce: 0n,
    gasPrice: 20000000000n,
    gasLimit: 21000n,
    to: testAddress,
    value: 1000000000000000000n,
    data: new Uint8Array(),
    v: 27n,
    r: testSignature.r,
    s: testSignature.s,
  };

  it("serialize throws not implemented", () => {
    expect(() => Transaction.Legacy.serialize.call(legacyTx)).toThrow("Not implemented");
  });

  it("hash throws not implemented", () => {
    expect(() => Transaction.Legacy.hash.call(legacyTx)).toThrow("Not implemented");
  });

  it("getSigningHash throws not implemented", () => {
    expect(() => Transaction.Legacy.getSigningHash.call(legacyTx)).toThrow("Not implemented");
  });

  it("deserialize throws not implemented", () => {
    expect(() => Transaction.Legacy.deserialize(new Uint8Array())).toThrow("Not implemented");
  });

  describe("getChainId", () => {
    it("extracts chain ID from EIP-155 v value", () => {
      const tx: Transaction.Legacy = {
        ...legacyTx,
        v: 37n, // chainId = (37 - 35) / 2 = 1
      };
      expect(Transaction.Legacy.getChainId.call(tx)).toBe(1n);
    });

    it("extracts chain ID for different networks", () => {
      const tx: Transaction.Legacy = {
        ...legacyTx,
        v: 41n, // chainId = (41 - 35) / 2 = 3
      };
      expect(Transaction.Legacy.getChainId.call(tx)).toBe(3n);
    });

    it("returns null for pre-EIP-155 v value (27)", () => {
      const tx: Transaction.Legacy = {
        ...legacyTx,
        v: 27n,
      };
      expect(Transaction.Legacy.getChainId.call(tx)).toBeNull();
    });

    it("returns null for pre-EIP-155 v value (28)", () => {
      const tx: Transaction.Legacy = {
        ...legacyTx,
        v: 28n,
      };
      expect(Transaction.Legacy.getChainId.call(tx)).toBeNull();
    });

    it("handles large chain IDs", () => {
      const tx: Transaction.Legacy = {
        ...legacyTx,
        v: 999999999999n, // Large chain ID
      };
      expect(Transaction.Legacy.getChainId.call(tx)).toBe(499999999982n);
    });
  });

  it("getSender throws not implemented", () => {
    expect(() => Transaction.Legacy.getSender.call(legacyTx)).toThrow("Not implemented");
  });

  it("verifySignature throws not implemented", () => {
    expect(() => Transaction.Legacy.verifySignature.call(legacyTx)).toThrow("Not implemented");
  });
});

// ============================================================================
// EIP-1559 Transaction Tests
// ============================================================================

describe("Transaction.EIP1559", () => {
  const eip1559Tx: Transaction.EIP1559 = {
    type: Transaction.Type.EIP1559,
    chainId: 1n,
    nonce: 0n,
    maxPriorityFeePerGas: 2000000000n,
    maxFeePerGas: 30000000000n,
    gasLimit: 21000n,
    to: testAddress,
    value: 1000000000000000000n,
    data: new Uint8Array(),
    accessList: [],
    yParity: 0,
    r: testSignature.r,
    s: testSignature.s,
  };

  it("serialize throws not implemented", () => {
    expect(() => Transaction.EIP1559.serialize.call(eip1559Tx)).toThrow("Not implemented");
  });

  it("hash throws not implemented", () => {
    expect(() => Transaction.EIP1559.hash.call(eip1559Tx)).toThrow("Not implemented");
  });

  it("getSigningHash throws not implemented", () => {
    expect(() => Transaction.EIP1559.getSigningHash.call(eip1559Tx)).toThrow("Not implemented");
  });

  describe("getEffectiveGasPrice", () => {
    it("returns baseFee + maxPriorityFee when both fit", () => {
      const baseFee = 10000000000n;
      const result = Transaction.EIP1559.getEffectiveGasPrice.call(eip1559Tx, baseFee);
      // baseFee (10) + maxPriorityFee (2) = 12
      expect(result).toBe(12000000000n);
    });

    it("caps priority fee when maxFee is low", () => {
      const tx: Transaction.EIP1559 = {
        ...eip1559Tx,
        maxPriorityFeePerGas: 5000000000n,
        maxFeePerGas: 12000000000n,
      };
      const baseFee = 10000000000n;
      const result = Transaction.EIP1559.getEffectiveGasPrice.call(tx, baseFee);
      // baseFee (10) + effective priority (2, capped by maxFee - baseFee) = 12
      expect(result).toBe(12000000000n);
    });

    it("handles zero baseFee", () => {
      const baseFee = 0n;
      const result = Transaction.EIP1559.getEffectiveGasPrice.call(eip1559Tx, baseFee);
      expect(result).toBe(2000000000n);
    });

    it("handles maxFee equal to baseFee", () => {
      const tx: Transaction.EIP1559 = {
        ...eip1559Tx,
        maxFeePerGas: 10000000000n,
      };
      const baseFee = 10000000000n;
      const result = Transaction.EIP1559.getEffectiveGasPrice.call(tx, baseFee);
      expect(result).toBe(10000000000n);
    });
  });
});

// ============================================================================
// EIP-4844 Transaction Tests
// ============================================================================

describe("Transaction.EIP4844", () => {
  const eip4844Tx: Transaction.EIP4844 = {
    type: Transaction.Type.EIP4844,
    chainId: 1n,
    nonce: 0n,
    maxPriorityFeePerGas: 1000000000n,
    maxFeePerGas: 20000000000n,
    gasLimit: 100000n,
    to: testAddress,
    value: 0n,
    data: new Uint8Array(),
    accessList: [],
    maxFeePerBlobGas: 2000000000n,
    blobVersionedHashes: [testHash],
    yParity: 0,
    r: testSignature.r,
    s: testSignature.s,
  };

  describe("getBlobGasCost", () => {
    it("calculates cost for single blob", () => {
      const blobBaseFee = 1n;
      const cost = Transaction.EIP4844.getBlobGasCost.call(eip4844Tx, blobBaseFee);
      // 1 blob * 131072 gas/blob * 1 = 131072
      expect(cost).toBe(131072n);
    });

    it("calculates cost for multiple blobs", () => {
      const tx: Transaction.EIP4844 = {
        ...eip4844Tx,
        blobVersionedHashes: [testHash, createHash(20), createHash(30)],
      };
      const blobBaseFee = 10n;
      const cost = Transaction.EIP4844.getBlobGasCost.call(tx, blobBaseFee);
      // 3 blobs * 131072 gas/blob * 10 = 3932160
      expect(cost).toBe(3932160n);
    });

    it("handles zero blob base fee", () => {
      const blobBaseFee = 0n;
      const cost = Transaction.EIP4844.getBlobGasCost.call(eip4844Tx, blobBaseFee);
      expect(cost).toBe(0n);
    });

    it("handles high blob base fee", () => {
      const blobBaseFee = 1000000n;
      const cost = Transaction.EIP4844.getBlobGasCost.call(eip4844Tx, blobBaseFee);
      expect(cost).toBe(131072000000n);
    });
  });

  it("getEffectiveGasPrice works same as EIP-1559", () => {
    const baseFee = 10000000000n;
    const result = Transaction.EIP4844.getEffectiveGasPrice.call(eip4844Tx, baseFee);
    expect(result).toBe(11000000000n);
  });
});

// ============================================================================
// Transaction-Level Operations
// ============================================================================

describe("Transaction.detectType", () => {
  it("detects legacy transaction from RLP marker", () => {
    const data = new Uint8Array([0xc0]); // RLP list marker
    expect(Transaction.detectType(data)).toBe(Transaction.Type.Legacy);
  });

  it("detects EIP-2930 transaction", () => {
    const data = new Uint8Array([0x01]);
    expect(Transaction.detectType(data)).toBe(Transaction.Type.EIP2930);
  });

  it("detects EIP-1559 transaction", () => {
    const data = new Uint8Array([0x02]);
    expect(Transaction.detectType(data)).toBe(Transaction.Type.EIP1559);
  });

  it("detects EIP-4844 transaction", () => {
    const data = new Uint8Array([0x03]);
    expect(Transaction.detectType(data)).toBe(Transaction.Type.EIP4844);
  });

  it("detects EIP-7702 transaction", () => {
    const data = new Uint8Array([0x04]);
    expect(Transaction.detectType(data)).toBe(Transaction.Type.EIP7702);
  });

  it("throws for empty data", () => {
    expect(() => Transaction.detectType(new Uint8Array())).toThrow("Empty transaction data");
  });

  it("throws for unknown type", () => {
    const data = new Uint8Array([0x05]);
    expect(() => Transaction.detectType(data)).toThrow("Unknown transaction type: 0x5");
  });
});

describe("Transaction.serialize", () => {
  const legacyTx: Transaction.Legacy = {
    type: Transaction.Type.Legacy,
    nonce: 0n,
    gasPrice: 20000000000n,
    gasLimit: 21000n,
    to: testAddress,
    value: 1000000000000000000n,
    data: new Uint8Array(),
    v: 27n,
    r: testSignature.r,
    s: testSignature.s,
  };

  it("throws not implemented for legacy", () => {
    expect(() => Transaction.serialize(legacyTx)).toThrow("Not implemented");
  });

  it("throws not implemented for EIP-1559", () => {
    const tx: Transaction.EIP1559 = {
      type: Transaction.Type.EIP1559,
      chainId: 1n,
      nonce: 0n,
      maxPriorityFeePerGas: 1000000000n,
      maxFeePerGas: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList: [],
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(() => Transaction.serialize(tx)).toThrow("Not implemented");
  });
});

describe("Transaction.hash", () => {
  it("throws not implemented", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 1000000000000000000n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(() => Transaction.hash(tx)).toThrow("Not implemented");
  });
});

describe("Transaction.getSigningHash", () => {
  it("throws not implemented", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 1000000000000000000n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(() => Transaction.getSigningHash(tx)).toThrow("Not implemented");
  });
});

describe("Transaction.deserialize", () => {
  it("throws not implemented", () => {
    const data = new Uint8Array([0x02, 0xc0]);
    expect(() => Transaction.deserialize(data)).toThrow("Not implemented");
  });
});

// ============================================================================
// Utility Functions
// ============================================================================

describe("Transaction.format", () => {
  it("formats legacy transaction", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 5n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 1500000000000000000n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    const formatted = Transaction.format(tx);
    expect(formatted).toContain("Legacy tx");
    expect(formatted).toContain("1.5 ETH");
    expect(formatted).toContain("nonce: 5");
  });

  it("formats EIP-1559 transaction", () => {
    const tx: Transaction.EIP1559 = {
      type: Transaction.Type.EIP1559,
      chainId: 1n,
      nonce: 10n,
      maxPriorityFeePerGas: 1000000000n,
      maxFeePerGas: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 2000000000000000000n,
      data: new Uint8Array(),
      accessList: [],
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };
    const formatted = Transaction.format(tx);
    expect(formatted).toContain("EIP-1559 tx");
    expect(formatted).toContain("2 ETH");
    expect(formatted).toContain("nonce: 10");
  });

  it("formats contract creation", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 1000000n,
      to: null,
      value: 0n,
      data: new Uint8Array([0x60, 0x80]),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    const formatted = Transaction.format(tx);
    expect(formatted).toContain("contract creation");
  });
});

describe("Transaction.getGasPrice", () => {
  it("returns gasPrice for legacy transaction", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 25000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(Transaction.getGasPrice(tx)).toBe(25000000000n);
  });

  it("returns gasPrice for EIP-2930 transaction", () => {
    const tx: Transaction.EIP2930 = {
      type: Transaction.Type.EIP2930,
      chainId: 1n,
      nonce: 0n,
      gasPrice: 30000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList: [],
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(Transaction.getGasPrice(tx)).toBe(30000000000n);
  });

  it("calculates effective gas price for EIP-1559", () => {
    const tx: Transaction.EIP1559 = {
      type: Transaction.Type.EIP1559,
      chainId: 1n,
      nonce: 0n,
      maxPriorityFeePerGas: 2000000000n,
      maxFeePerGas: 30000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList: [],
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };
    const baseFee = 10000000000n;
    expect(Transaction.getGasPrice(tx, baseFee)).toBe(12000000000n);
  });

  it("throws when baseFee missing for EIP-1559", () => {
    const tx: Transaction.EIP1559 = {
      type: Transaction.Type.EIP1559,
      chainId: 1n,
      nonce: 0n,
      maxPriorityFeePerGas: 2000000000n,
      maxFeePerGas: 30000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList: [],
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(() => Transaction.getGasPrice(tx)).toThrow("baseFee required");
  });
});

describe("Transaction.hasAccessList", () => {
  it("returns false for legacy transaction", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(Transaction.hasAccessList(tx)).toBe(false);
  });

  it("returns true for EIP-2930 transaction", () => {
    const tx: Transaction.EIP2930 = {
      type: Transaction.Type.EIP2930,
      chainId: 1n,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList: [],
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(Transaction.hasAccessList(tx)).toBe(true);
  });

  it("returns true for EIP-1559 transaction", () => {
    const tx: Transaction.EIP1559 = {
      type: Transaction.Type.EIP1559,
      chainId: 1n,
      nonce: 0n,
      maxPriorityFeePerGas: 1000000000n,
      maxFeePerGas: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList: [],
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(Transaction.hasAccessList(tx)).toBe(true);
  });
});

describe("Transaction.getAccessList", () => {
  it("returns empty array for legacy transaction", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(Transaction.getAccessList(tx)).toEqual([]);
  });

  it("returns access list for EIP-1559 transaction", () => {
    const accessList: Transaction.AccessList = [
      { address: testAddress, storageKeys: [testHash] },
    ];
    const tx: Transaction.EIP1559 = {
      type: Transaction.Type.EIP1559,
      chainId: 1n,
      nonce: 0n,
      maxPriorityFeePerGas: 1000000000n,
      maxFeePerGas: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList,
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(Transaction.getAccessList(tx)).toBe(accessList);
  });
});

describe("Transaction.getChainId", () => {
  it("extracts chain ID from legacy transaction", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 37n, // chain ID 1
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(Transaction.getChainId(tx)).toBe(1n);
  });

  it("returns null for pre-EIP-155 legacy transaction", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(Transaction.getChainId(tx)).toBeNull();
  });

  it("returns chain ID for EIP-1559 transaction", () => {
    const tx: Transaction.EIP1559 = {
      type: Transaction.Type.EIP1559,
      chainId: 137n,
      nonce: 0n,
      maxPriorityFeePerGas: 1000000000n,
      maxFeePerGas: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList: [],
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(Transaction.getChainId(tx)).toBe(137n);
  });
});

describe("Transaction.isSigned", () => {
  it("returns true for transaction with signature", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(Transaction.isSigned(tx)).toBe(true);
  });

  it("returns false for transaction with zero r", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: new Uint8Array(32),
      s: testSignature.s,
    };
    expect(Transaction.isSigned(tx)).toBe(false);
  });

  it("returns false for transaction with zero s", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: new Uint8Array(32),
    };
    expect(Transaction.isSigned(tx)).toBe(false);
  });
});

describe("Transaction.assertSigned", () => {
  it("does not throw for signed transaction", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(() => Transaction.assertSigned(tx)).not.toThrow();
  });

  it("throws for unsigned transaction", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: new Uint8Array(32),
      s: new Uint8Array(32),
    };
    expect(() => Transaction.assertSigned(tx)).toThrow("Transaction is not signed");
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Transaction edge cases", () => {
  it("handles max uint256 values", () => {
    const maxUint256 = 2n ** 256n - 1n;
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: maxUint256,
      gasPrice: maxUint256,
      gasLimit: maxUint256,
      to: testAddress,
      value: maxUint256,
      data: new Uint8Array(),
      v: maxUint256,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(tx.nonce).toBe(maxUint256);
    expect(tx.value).toBe(maxUint256);
  });

  it("handles empty data field", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(tx.data.length).toBe(0);
  });

  it("handles large data field", () => {
    const largeData = new Uint8Array(10000);
    largeData.fill(0xff);
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 5000000n,
      to: testAddress,
      value: 0n,
      data: largeData,
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(tx.data.length).toBe(10000);
  });

  it("handles empty access list", () => {
    const tx: Transaction.EIP1559 = {
      type: Transaction.Type.EIP1559,
      chainId: 1n,
      nonce: 0n,
      maxPriorityFeePerGas: 1000000000n,
      maxFeePerGas: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList: [],
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(tx.accessList.length).toBe(0);
  });

  it("handles multiple blob hashes", () => {
    const hashes: Transaction.VersionedHash[] = Array.from({ length: 6 }, (_, i) =>
      createHash(i),
    );
    const tx: Transaction.EIP4844 = {
      type: Transaction.Type.EIP4844,
      chainId: 1n,
      nonce: 0n,
      maxPriorityFeePerGas: 1000000000n,
      maxFeePerGas: 20000000000n,
      gasLimit: 1000000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList: [],
      maxFeePerBlobGas: 1000000000n,
      blobVersionedHashes: hashes,
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(tx.blobVersionedHashes.length).toBe(6);
    const cost = Transaction.EIP4844.getBlobGasCost.call(tx, 1n);
    expect(cost).toBe(786432n); // 6 * 131072
  });

  it("handles zero value transfers", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };
    expect(tx.value).toBe(0n);
  });
});

// ============================================================================
// Type Inference Tests
// ============================================================================

describe("Transaction type inference", () => {
  it("infers Legacy type correctly", () => {
    const tx: Transaction.Legacy = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };

    expectTypeOf(tx).toMatchTypeOf<Transaction.Legacy>();
    expectTypeOf(tx.gasPrice).toEqualTypeOf<bigint>();
  });

  it("infers EIP1559 type correctly", () => {
    const tx: Transaction.EIP1559 = {
      type: Transaction.Type.EIP1559,
      chainId: 1n,
      nonce: 0n,
      maxPriorityFeePerGas: 1000000000n,
      maxFeePerGas: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      accessList: [],
      yParity: 0,
      r: testSignature.r,
      s: testSignature.s,
    };

    expectTypeOf(tx).toMatchTypeOf<Transaction.EIP1559>();
    expectTypeOf(tx.maxPriorityFeePerGas).toEqualTypeOf<bigint>();
    expectTypeOf(tx.maxFeePerGas).toEqualTypeOf<bigint>();
  });

  it("infers union type correctly", () => {
    const tx: Transaction.Any = {
      type: Transaction.Type.Legacy,
      nonce: 0n,
      gasPrice: 20000000000n,
      gasLimit: 21000n,
      to: testAddress,
      value: 0n,
      data: new Uint8Array(),
      v: 27n,
      r: testSignature.r,
      s: testSignature.s,
    };

    expectTypeOf(tx).toMatchTypeOf<Transaction.Any>();

    if (Transaction.isEIP1559(tx)) {
    // @ts-expect-error - Testing type inference
      expectTypeOf(tx).toEqualTypeOf<Transaction.EIP1559>();
    }
  });
});
