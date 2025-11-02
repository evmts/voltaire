/**
 * Tests for Bytecode module
 */

import { describe, it, expect } from "vitest";
import * as Bytecode from "./Bytecode.js";

// ============================================================================
// Opcode Utility Tests
// ============================================================================

describe("Bytecode.isPush", () => {
  it("identifies PUSH1 opcode", () => {
    expect(Bytecode.isPush(0x60)).toBe(true);
  });

  it("identifies PUSH32 opcode", () => {
    expect(Bytecode.isPush(0x7f)).toBe(true);
  });

  it("identifies all PUSH opcodes", () => {
    for (let i = 0x60; i <= 0x7f; i++) {
      expect(Bytecode.isPush(i)).toBe(true);
    }
  });

  it("rejects non-PUSH opcodes", () => {
    expect(Bytecode.isPush(0x00)).toBe(false);
    expect(Bytecode.isPush(0x5b)).toBe(false);
    expect(Bytecode.isPush(0x5f)).toBe(false);
    expect(Bytecode.isPush(0x80)).toBe(false);
    expect(Bytecode.isPush(0xff)).toBe(false);
  });
});

describe("Bytecode.getPushSize", () => {
  it("returns correct size for PUSH1", () => {
    expect(Bytecode.getPushSize(0x60)).toBe(1);
  });

  it("returns correct size for PUSH32", () => {
    expect(Bytecode.getPushSize(0x7f)).toBe(32);
  });

  it("returns correct sizes for all PUSH opcodes", () => {
    for (let i = 0x60; i <= 0x7f; i++) {
      expect(Bytecode.getPushSize(i)).toBe(i - 0x5f);
    }
  });

  it("returns 0 for non-PUSH opcodes", () => {
    expect(Bytecode.getPushSize(0x00)).toBe(0);
    expect(Bytecode.getPushSize(0x5b)).toBe(0);
    expect(Bytecode.getPushSize(0xff)).toBe(0);
  });
});

describe("Bytecode.isTerminator", () => {
  it("identifies STOP", () => {
    expect(Bytecode.isTerminator(0x00)).toBe(true);
  });

  it("identifies RETURN", () => {
    expect(Bytecode.isTerminator(0xf3)).toBe(true);
  });

  it("identifies REVERT", () => {
    expect(Bytecode.isTerminator(0xfd)).toBe(true);
  });

  it("identifies INVALID", () => {
    expect(Bytecode.isTerminator(0xfe)).toBe(true);
  });

  it("rejects non-terminator opcodes", () => {
    expect(Bytecode.isTerminator(0x60)).toBe(false);
    expect(Bytecode.isTerminator(0x5b)).toBe(false);
    expect(Bytecode.isTerminator(0x01)).toBe(false);
  });
});

// ============================================================================
// Jump Destination Analysis Tests
// ============================================================================

describe("Bytecode.analyzeJumpDestinations", () => {
  it("finds JUMPDEST at start", () => {
    const code = new Uint8Array([0x5b]);
    const jumpdests = Bytecode.analyzeJumpDestinations(code);
    expect(jumpdests.has(0)).toBe(true);
    expect(jumpdests.size).toBe(1);
  });

  it("finds multiple JUMPDESTs", () => {
    const code = new Uint8Array([0x5b, 0x00, 0x5b]);
    const jumpdests = Bytecode.analyzeJumpDestinations(code);
    expect(jumpdests.has(0)).toBe(true);
    expect(jumpdests.has(2)).toBe(true);
    expect(jumpdests.size).toBe(2);
  });

  it("skips JUMPDEST in PUSH data", () => {
    const code = new Uint8Array([0x60, 0x5b, 0x5b]); // PUSH1 0x5b, JUMPDEST
    const jumpdests = Bytecode.analyzeJumpDestinations(code);
    expect(jumpdests.has(1)).toBe(false); // Inside PUSH data
    expect(jumpdests.has(2)).toBe(true); // Actual JUMPDEST
    expect(jumpdests.size).toBe(1);
  });

  it("handles PUSH32 skipping correctly", () => {
    const pushData = new Array(32).fill(0x5b);
    const code = new Uint8Array([0x7f, ...pushData, 0x5b]);
    const jumpdests = Bytecode.analyzeJumpDestinations(code);
    expect(jumpdests.has(33)).toBe(true); // After PUSH32
    expect(jumpdests.size).toBe(1);
  });

  it("handles empty bytecode", () => {
    const code = new Uint8Array([]);
    const jumpdests = Bytecode.analyzeJumpDestinations(code);
    expect(jumpdests.size).toBe(0);
  });

  it("handles incomplete PUSH", () => {
    const code = new Uint8Array([0x60]); // PUSH1 with no data
    const jumpdests = Bytecode.analyzeJumpDestinations(code);
    expect(jumpdests.size).toBe(0);
  });

  it("works with direct call", () => {
    const code = new Uint8Array([0x5b, 0x00, 0x5b]);
    const jumpdests = Bytecode.analyzeJumpDestinations(code);
    expect(jumpdests.has(0)).toBe(true);
    expect(jumpdests.has(2)).toBe(true);
  });
});

describe("Bytecode.isValidJumpDest", () => {
  it("validates correct JUMPDEST", () => {
    const code = new Uint8Array([0x5b]);
    expect(Bytecode.isValidJumpDest(code, 0)).toBe(true);
  });

  it("rejects JUMPDEST in PUSH data", () => {
    const code = new Uint8Array([0x60, 0x5b]);
    expect(Bytecode.isValidJumpDest(code, 1)).toBe(false);
  });

  it("rejects non-JUMPDEST position", () => {
    const code = new Uint8Array([0x00]);
    expect(Bytecode.isValidJumpDest(code, 0)).toBe(false);
  });

  it("rejects out-of-bounds position", () => {
    const code = new Uint8Array([0x5b]);
    expect(Bytecode.isValidJumpDest(code, 10)).toBe(false);
  });

  it("works with direct call", () => {
    const code = new Uint8Array([0x5b]);
    expect(Bytecode.isValidJumpDest(code, 0)).toBe(true);
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe("Bytecode.validate", () => {
  it("validates empty bytecode", () => {
    const code = new Uint8Array([]);
    expect(Bytecode.validate(code)).toBe(true);
  });

  it("validates simple bytecode", () => {
    const code = new Uint8Array([0x60, 0x01, 0x00]);
    expect(Bytecode.validate(code)).toBe(true);
  });

  it("validates PUSH32", () => {
    const code = new Uint8Array([0x7f, ...new Array(32).fill(0xff)]);
    expect(Bytecode.validate(code)).toBe(true);
  });

  it("rejects incomplete PUSH1", () => {
    const code = new Uint8Array([0x60]); // PUSH1 with no data
    expect(Bytecode.validate(code)).toBe(false);
  });

  it("rejects incomplete PUSH32", () => {
    const code = new Uint8Array([0x7f, ...new Array(31).fill(0xff)]);
    expect(Bytecode.validate(code)).toBe(false);
  });

  it("validates PUSH at exact boundary", () => {
    const code = new Uint8Array([0x60, 0x01]); // Exactly enough bytes
    expect(Bytecode.validate(code)).toBe(true);
  });

  it("validates bytecode with multiple instructions", () => {
    const code = new Uint8Array([
      0x60, 0x00, // PUSH1 0x00
      0x60, 0x01, // PUSH1 0x01
      0x01, // ADD
      0x5b, // JUMPDEST
    ]);
    expect(Bytecode.validate(code)).toBe(true);
  });

  it("works with direct call", () => {
    const code = new Uint8Array([0x60, 0x01]);
    expect(Bytecode.validate(code)).toBe(true);
  });
});

// ============================================================================
// Instruction Parsing Tests
// ============================================================================

describe("Bytecode.parseInstructions", () => {
  it("parses single instruction", () => {
    const code = new Uint8Array([0x00]);
    const instructions = Bytecode.parseInstructions(code);
    expect(instructions).toHaveLength(1);
    expect(instructions[0]).toEqual({
      opcode: 0x00,
      position: 0,
    });
  });

  it("parses PUSH instruction with data", () => {
    const code = new Uint8Array([0x60, 0x01]);
    const instructions = Bytecode.parseInstructions(code);
    expect(instructions).toHaveLength(1);
    expect(instructions[0]).toEqual({
      opcode: 0x60,
      position: 0,
      pushData: new Uint8Array([0x01]),
    });
  });

  it("parses PUSH32 with full data", () => {
    const data = new Array(32).fill(0xff);
    const code = new Uint8Array([0x7f, ...data]);
    const instructions = Bytecode.parseInstructions(code);
    expect(instructions).toHaveLength(1);
    expect(instructions[0]?.pushData).toHaveLength(32);
    expect(instructions[0]?.pushData?.[0]).toBe(0xff);
  });

  it("parses multiple instructions", () => {
    const code = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
    const instructions = Bytecode.parseInstructions(code);
    expect(instructions).toHaveLength(3);
    expect(instructions[0]?.opcode).toBe(0x60);
    expect(instructions[1]?.opcode).toBe(0x60);
    expect(instructions[2]?.opcode).toBe(0x01);
  });

  it("handles incomplete PUSH data", () => {
    const code = new Uint8Array([0x60]); // PUSH1 with no data
    const instructions = Bytecode.parseInstructions(code);
    expect(instructions).toHaveLength(1);
    expect(instructions[0]?.pushData).toHaveLength(0);
  });

  it("tracks correct positions", () => {
    const code = new Uint8Array([0x60, 0x01, 0x5b, 0x00]);
    const instructions = Bytecode.parseInstructions(code);
    expect(instructions[0]?.position).toBe(0);
    expect(instructions[1]?.position).toBe(2);
    expect(instructions[2]?.position).toBe(3);
  });

  it("works with direct call", () => {
    const code = new Uint8Array([0x60, 0x01]);
    const instructions = Bytecode.parseInstructions(code);
    expect(instructions).toHaveLength(1);
  });
});

// ============================================================================
// Complete Analysis Tests
// ============================================================================

describe("Bytecode.analyze", () => {
  it("performs complete analysis", () => {
    const code = new Uint8Array([0x60, 0x01, 0x5b, 0x00]);
    const analysis = Bytecode.analyze(code);

    expect(analysis.valid).toBe(true);
    expect(analysis.jumpDestinations.has(2)).toBe(true);
    expect(analysis.jumpDestinations.size).toBe(1);
    expect(analysis.instructions).toHaveLength(3);
  });

  it("marks invalid bytecode", () => {
    const code = new Uint8Array([0x60]); // Incomplete PUSH
    const analysis = Bytecode.analyze(code);

    expect(analysis.valid).toBe(false);
    expect(analysis.instructions).toHaveLength(1);
  });

  it("analyzes empty bytecode", () => {
    const code = new Uint8Array([]);
    const analysis = Bytecode.analyze(code);

    expect(analysis.valid).toBe(true);
    expect(analysis.jumpDestinations.size).toBe(0);
    expect(analysis.instructions).toHaveLength(0);
  });

  it("works with direct call", () => {
    const code = new Uint8Array([0x60, 0x01, 0x5b]);
    const analysis = Bytecode.analyze(code);
    expect(analysis.valid).toBe(true);
  });
});

// ============================================================================
// Size Operations Tests
// ============================================================================

describe("Bytecode.size", () => {
  it("returns correct size", () => {
    const code = new Uint8Array([0x60, 0x01, 0x5b]);
    expect(Bytecode.size(code)).toBe(3);
  });

  it("returns 0 for empty bytecode", () => {
    const code = new Uint8Array([]);
    expect(Bytecode.size(code)).toBe(0);
  });

  it("works with direct call", () => {
    const code = new Uint8Array([0x60, 0x01]);
    expect(Bytecode.size(code)).toBe(2);
  });
});

describe("Bytecode.extractRuntime", () => {
  it("extracts runtime portion", () => {
    const code = new Uint8Array([0x60, 0x00, 0x60, 0x01, 0x60, 0x02]);
    const runtime = Bytecode.extractRuntime(code, 2);
    expect(runtime).toEqual(new Uint8Array([0x60, 0x01, 0x60, 0x02]));
  });

  it("handles offset 0", () => {
    const code = new Uint8Array([0x60, 0x01]);
    const runtime = Bytecode.extractRuntime(code, 0);
    expect(runtime).toEqual(code);
  });

  it("handles offset at end", () => {
    const code = new Uint8Array([0x60, 0x01]);
    const runtime = Bytecode.extractRuntime(code, 2);
    expect(runtime).toEqual(new Uint8Array([]));
  });

  it("works with direct call", () => {
    const code = new Uint8Array([0x60, 0x00, 0x60, 0x01]);
    const runtime = Bytecode.extractRuntime(code, 2);
    expect(runtime).toEqual(new Uint8Array([0x60, 0x01]));
  });
});

// ============================================================================
// Comparison Tests
// ============================================================================

describe("Bytecode.equals", () => {
  it("returns true for identical bytecode", () => {
    const code1 = new Uint8Array([0x60, 0x01, 0x5b]);
    const code2 = new Uint8Array([0x60, 0x01, 0x5b]);
    expect(Bytecode.equals(code1, code2)).toBe(true);
  });

  it("returns false for different bytecode", () => {
    const code1 = new Uint8Array([0x60, 0x01]);
    const code2 = new Uint8Array([0x60, 0x02]);
    expect(Bytecode.equals(code1, code2)).toBe(false);
  });

  it("returns false for different lengths", () => {
    const code1 = new Uint8Array([0x60, 0x01]);
    const code2 = new Uint8Array([0x60, 0x01, 0x5b]);
    expect(Bytecode.equals(code1, code2)).toBe(false);
  });

  it("returns true for empty bytecode", () => {
    const code1 = new Uint8Array([]);
    const code2 = new Uint8Array([]);
    expect(Bytecode.equals(code1, code2)).toBe(true);
  });

  it("works with direct call", () => {
    const code1 = new Uint8Array([0x60, 0x01]);
    const code2 = new Uint8Array([0x60, 0x01]);
    expect(Bytecode.equals(code1, code2)).toBe(true);
  });
});

// ============================================================================
// Hashing Tests
// ============================================================================

describe("Bytecode.hash", () => {
  it("computes keccak256 hash", () => {
    const code = new Uint8Array([0x60, 0x01]);
    const result = Bytecode.hash(code);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });

  it("works with direct call", () => {
    const code = new Uint8Array([0x60, 0x01]);
    const result = Bytecode.hash(code);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });
});

// ============================================================================
// Formatting Tests
// ============================================================================

describe("Bytecode.toHex", () => {
  it("formats bytecode with prefix", () => {
    const code = new Uint8Array([0x60, 0x01]);
    expect(Bytecode.toHex(code)).toBe("0x6001");
  });

  it("formats bytecode without prefix", () => {
    const code = new Uint8Array([0x60, 0x01]);
    expect(Bytecode.toHex(code, false)).toBe("6001");
  });

  it("pads single digit hex", () => {
    const code = new Uint8Array([0x01, 0x0f]);
    expect(Bytecode.toHex(code)).toBe("0x010f");
  });

  it("handles empty bytecode", () => {
    const code = new Uint8Array([]);
    expect(Bytecode.toHex(code)).toBe("0x");
  });

  it("works with direct call", () => {
    const code = new Uint8Array([0x60, 0x01]);
    expect(Bytecode.toHex(code)).toBe("0x6001");
  });
});

describe("Bytecode.fromHex", () => {
  it("parses hex with prefix", () => {
    const code = Bytecode.fromHex("0x6001");
    expect(code).toEqual(new Uint8Array([0x60, 0x01]));
  });

  it("parses hex without prefix", () => {
    const code = Bytecode.fromHex("6001");
    expect(code).toEqual(new Uint8Array([0x60, 0x01]));
  });

  it("parses empty hex", () => {
    const code = Bytecode.fromHex("0x");
    expect(code).toEqual(new Uint8Array([]));
  });

  it("throws on odd length hex", () => {
    expect(() => Bytecode.fromHex("0x600")).toThrow("Invalid hex string: odd length");
  });

  it("round-trips with toHex", () => {
    const original = new Uint8Array([0x60, 0x01, 0x5b, 0xff]);
    const hex = Bytecode.toHex(original);
    const parsed = Bytecode.fromHex(hex);
    expect(parsed).toEqual(original);
  });
});

describe("Bytecode.formatInstruction", () => {
  it("formats non-PUSH instruction", () => {
    const inst: Bytecode.Instruction = { opcode: 0x00, position: 0 };
    expect(Bytecode.formatInstruction(inst)).toBe("0x0000: 0x00");
  });

  it("formats PUSH instruction", () => {
    const inst: Bytecode.Instruction = {
      opcode: 0x60,
      position: 0,
      pushData: new Uint8Array([0x01]),
    };
    expect(Bytecode.formatInstruction(inst)).toBe("0x0000: PUSH1 0x01");
  });

  it("formats PUSH32 instruction", () => {
    const data = new Array(32).fill(0xff);
    const inst: Bytecode.Instruction = {
      opcode: 0x7f,
      position: 10,
      pushData: new Uint8Array(data),
    };
    const expected = `0x000a: PUSH32 0x${"ff".repeat(32)}`;
    expect(Bytecode.formatInstruction(inst)).toBe(expected);
  });

  it("pads position correctly", () => {
    const inst: Bytecode.Instruction = { opcode: 0x5b, position: 0x1234 };
    expect(Bytecode.formatInstruction(inst)).toBe("0x1234: 0x5B");
  });
});

describe("Bytecode.formatInstructions", () => {
  it("formats multiple instructions", () => {
    const code = new Uint8Array([0x60, 0x01, 0x5b, 0x00]);
    const formatted = Bytecode.formatInstructions(code);
    expect(formatted).toEqual([
      "0x0000: PUSH1 0x01",
      "0x0002: 0x5B",
      "0x0003: 0x00",
    ]);
  });

  it("handles empty bytecode", () => {
    const code = new Uint8Array([]);
    const formatted = Bytecode.formatInstructions(code);
    expect(formatted).toEqual([]);
  });

  it("works with direct call", () => {
    const code = new Uint8Array([0x60, 0x01]);
    const formatted = Bytecode.formatInstructions(code);
    expect(formatted).toHaveLength(1);
  });
});

// ============================================================================
// Metadata Tests
// ============================================================================

describe("Bytecode.hasMetadata", () => {
  it("detects metadata marker", () => {
    const code = new Uint8Array([0x60, 0x01, 0x00, 0x33]);
    expect(Bytecode.hasMetadata(code)).toBe(true);
  });

  it("validates length marker range", () => {
    const code1 = new Uint8Array([0x60, 0x01, 0x00, 0x20]);
    expect(Bytecode.hasMetadata(code1)).toBe(true);

    const code2 = new Uint8Array([0x60, 0x01, 0x00, 0x40]);
    expect(Bytecode.hasMetadata(code2)).toBe(true);

    const code3 = new Uint8Array([0x60, 0x01, 0x00, 0x1f]);
    expect(Bytecode.hasMetadata(code3)).toBe(false);

    const code4 = new Uint8Array([0x60, 0x01, 0x00, 0x41]);
    expect(Bytecode.hasMetadata(code4)).toBe(false);
  });

  it("rejects too-short bytecode", () => {
    const code = new Uint8Array([0x60]);
    expect(Bytecode.hasMetadata(code)).toBe(false);
  });

  it("works with direct call", () => {
    const code = new Uint8Array([0x60, 0x01, 0x00, 0x33]);
    expect(Bytecode.hasMetadata(code)).toBe(true);
  });
});

describe("Bytecode.stripMetadata", () => {
  it("strips metadata from bytecode", () => {
    // metadataLength = code[code.length - 1] + 2
    // If last byte is 0x33 (51), strips 51 + 2 = 53 bytes total
    // Need 51 bytes of metadata data + 2 bytes length marker
    const metadataBytes = 0x33;
    const metadata = new Array(metadataBytes).fill(0xaa); // metadataBytes worth of data
    const code = new Uint8Array([0x60, 0x01, 0x5b, ...metadata, 0x00, metadataBytes]);
    const stripped = Bytecode.stripMetadata(code);
    expect(stripped).toEqual(new Uint8Array([0x60, 0x01, 0x5b]));
  });

  it("returns original if no metadata", () => {
    const code = new Uint8Array([0x60, 0x01, 0x5b]);
    const stripped = Bytecode.stripMetadata(code);
    expect(stripped).toBe(code); // Same reference
  });

  it("handles varying metadata lengths", () => {
    // metadataLength = 0x28 (40) + 2 = 42 bytes
    const metadataBytes = 0x28;
    const metadata = new Array(metadataBytes).fill(0xbb);
    const code = new Uint8Array([0x60, 0x01, ...metadata, 0x00, metadataBytes]);
    const stripped = Bytecode.stripMetadata(code);
    expect(stripped).toEqual(new Uint8Array([0x60, 0x01]));
  });

  it("works with direct call", () => {
    const metadataBytes = 0x33;
    const metadata = new Array(metadataBytes).fill(0xaa);
    const code = new Uint8Array([0x60, 0x01, ...metadata, 0x00, metadataBytes]);
    const stripped = Bytecode.stripMetadata(code);
    expect(stripped).toEqual(new Uint8Array([0x60, 0x01]));
  });
});

// ============================================================================
// Edge Cases and Real-World Scenarios
// ============================================================================

describe("Bytecode edge cases", () => {
  it("handles all terminator opcodes", () => {
    expect(Bytecode.isTerminator(Bytecode.STOP)).toBe(true);
    expect(Bytecode.isTerminator(Bytecode.RETURN)).toBe(true);
    expect(Bytecode.isTerminator(Bytecode.REVERT)).toBe(true);
    expect(Bytecode.isTerminator(Bytecode.INVALID)).toBe(true);
  });

  it("validates constants", () => {
    expect(Bytecode.JUMPDEST).toBe(0x5b);
    expect(Bytecode.PUSH1).toBe(0x60);
    expect(Bytecode.PUSH32).toBe(0x7f);
    expect(Bytecode.STOP).toBe(0x00);
    expect(Bytecode.RETURN).toBe(0xf3);
    expect(Bytecode.REVERT).toBe(0xfd);
    expect(Bytecode.INVALID).toBe(0xfe);
  });

  it("handles real constructor bytecode pattern", () => {
    // Simplified constructor that returns runtime code
    const constructor = new Uint8Array([
      0x60, 0x80, // PUSH1 0x80
      0x60, 0x40, // PUSH1 0x40
      0x52, // MSTORE
      0x60, 0x04, // PUSH1 0x04 (runtime code size)
      0x60, 0x0c, // PUSH1 0x0c (runtime offset)
      0x60, 0x00, // PUSH1 0x00
      0x39, // CODECOPY
      0x60, 0x04, // PUSH1 0x04
      0x60, 0x00, // PUSH1 0x00
      0xf3, // RETURN
    ]);

    const analysis = Bytecode.analyze(constructor);
    expect(analysis.valid).toBe(true);
    expect(analysis.instructions.length).toBeGreaterThan(0);
  });

  it("analyzes bytecode with sequential PUSHes", () => {
    const code = new Uint8Array([
      0x60, 0x00, // PUSH1 0x00
      0x61, 0x01, 0x00, // PUSH2 0x0100
      0x62, 0x01, 0x00, 0x00, // PUSH3 0x010000
    ]);

    const instructions = Bytecode.parseInstructions(code);
    expect(instructions).toHaveLength(3);
    expect(instructions[0]?.pushData?.length).toBe(1);
    expect(instructions[1]?.pushData?.length).toBe(2);
    expect(instructions[2]?.pushData?.length).toBe(3);
  });

  it("handles JUMPDEST detection in complex bytecode", () => {
    const code = new Uint8Array([
      0x60, 0x5b, // PUSH1 0x5b (fake JUMPDEST in data)
      0x56, // JUMP
      0x5b, // JUMPDEST (real)
      0x60, 0x00, // PUSH1 0x00
      0x5b, // JUMPDEST (real)
    ]);

    const jumpdests = Bytecode.analyzeJumpDestinations(code);
    expect(jumpdests.has(1)).toBe(false); // In PUSH data
    expect(jumpdests.has(3)).toBe(true); // Real JUMPDEST
    expect(jumpdests.has(6)).toBe(true); // Real JUMPDEST
    expect(jumpdests.size).toBe(2);
  });

  it("validates incomplete multi-byte PUSH", () => {
    const code1 = new Uint8Array([0x61, 0x01]); // PUSH2 with 1 byte
    expect(Bytecode.validate(code1)).toBe(false);

    const code2 = new Uint8Array([0x62, 0x01, 0x02]); // PUSH3 with 2 bytes
    expect(Bytecode.validate(code2)).toBe(false);

    const code3 = new Uint8Array([0x62, 0x01, 0x02, 0x03]); // PUSH3 with 3 bytes
    expect(Bytecode.validate(code3)).toBe(true);
  });

  it("round-trips complex bytecode through hex", () => {
    const original = new Uint8Array([
      0x60, 0x80, 0x60, 0x40, 0x52, 0x5b, 0x00,
      0x7f, ...new Array(32).fill(0xff),
    ]);

    const hex = Bytecode.toHex(original);
    const parsed = Bytecode.fromHex(hex);
    expect(Bytecode.equals(original, parsed)).toBe(true);
  });

  it("disassembles realistic bytecode snippet", () => {
    const code = new Uint8Array([
      0x60, 0x00, // PUSH1 0x00
      0x35, // CALLDATALOAD
      0x5b, // JUMPDEST
      0x00, // STOP
    ]);

    const disassembly = Bytecode.formatInstructions(code);
    expect(disassembly).toEqual([
      "0x0000: PUSH1 0x00",
      "0x0002: 0x35",
      "0x0003: 0x5B",
      "0x0004: 0x00",
    ]);
  });
});
