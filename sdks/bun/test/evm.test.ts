import { test, expect, describe } from "bun:test";
import { createEVM, CallType, hexToBytes, bytesToHex } from "../src/index";

describe("GuillotineEVM", () => {
  test("should create and destroy EVM instance", () => {
    const evm = createEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 30_000_000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 1_000_000_000n,
      chainId: 1n,
    });
    
    expect(evm).toBeDefined();
    evm.destroy();
  });

  test("should set and use account balance", () => {
    const evm = createEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 30_000_000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 1_000_000_000n,
      chainId: 1n,
    });
    
    try {
      const address = "0x1234567890123456789012345678901234567890";
      evm.setBalance(address, 1000000n);
      
      // Test that the balance was set (would need a getBalance method to verify)
      expect(true).toBe(true);
    } finally {
      evm.destroy();
    }
  });

  test("should execute simple STOP opcode", () => {
    const evm = createEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 30_000_000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 1_000_000_000n,
      chainId: 1n,
    });
    
    try {
      const caller = "0x1234567890123456789012345678901234567890";
      const contractAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      
      // Set balance for caller
      evm.setBalance(caller, 10n ** 18n);
      
      // Set simple STOP bytecode (0x00)
      evm.setCode(contractAddress, new Uint8Array([0x00]));
      
      const result = evm.call({
        caller,
        to: contractAddress,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(true);
      expect(result.gasLeft).toBeGreaterThan(0n);
      expect(result.output.length).toBe(0);
    } finally {
      evm.destroy();
    }
  });

  test("should execute PUSH and ADD opcodes", () => {
    const evm = createEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 30_000_000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 1_000_000_000n,
      chainId: 1n,
    });
    
    try {
      const caller = "0x1234567890123456789012345678901234567890";
      const contractAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      
      // Set balance for caller
      evm.setBalance(caller, 10n ** 18n);
      
      // Bytecode: PUSH1 0x02, PUSH1 0x03, ADD, STOP
      // This pushes 2 and 3 onto the stack, adds them, then stops
      const bytecode = new Uint8Array([
        0x60, 0x02,  // PUSH1 0x02
        0x60, 0x03,  // PUSH1 0x03
        0x01,        // ADD
        0x00         // STOP
      ]);
      
      evm.setCode(contractAddress, bytecode);
      
      const result = evm.call({
        caller,
        to: contractAddress,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(true);
      expect(result.gasLeft).toBeGreaterThan(0n);
    } finally {
      evm.destroy();
    }
  });

  test("should handle RETURN opcode", () => {
    const evm = createEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 30_000_000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 1_000_000_000n,
      chainId: 1n,
    });
    
    try {
      const caller = "0x1234567890123456789012345678901234567890";
      const contractAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      
      // Set balance for caller
      evm.setBalance(caller, 10n ** 18n);
      
      // Bytecode: PUSH1 0x42, PUSH1 0x00, MSTORE, PUSH1 0x20, PUSH1 0x00, RETURN
      // This stores 0x42 at memory position 0 and returns 32 bytes
      const bytecode = new Uint8Array([
        0x60, 0x42,  // PUSH1 0x42
        0x60, 0x00,  // PUSH1 0x00
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 0x20 (32 bytes)
        0x60, 0x00,  // PUSH1 0x00 (offset)
        0xf3         // RETURN
      ]);
      
      evm.setCode(contractAddress, bytecode);
      
      const result = evm.call({
        caller,
        to: contractAddress,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(true);
      expect(result.output.length).toBe(32);
      // The output should contain 0x42 padded to 32 bytes
      expect(result.output[31]).toBe(0x42);
    } finally {
      evm.destroy();
    }
  });

  test("should handle CREATE opcode", () => {
    const evm = createEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 30_000_000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 1_000_000_000n,
      chainId: 1n,
    });
    
    try {
      const deployer = "0x1234567890123456789012345678901234567890";
      
      // Set balance for deployer
      evm.setBalance(deployer, 10n ** 18n);
      
      // Simple init code that returns empty runtime code
      const initCode = new Uint8Array([
        0x60, 0x00,  // PUSH1 0x00
        0x60, 0x00,  // PUSH1 0x00
        0xf3         // RETURN
      ]);
      
      const result = evm.call({
        caller: deployer,
        to: "0x0000000000000000000000000000000000000000",
        value: 0n,
        input: initCode,
        gas: 1000000n,
        callType: CallType.CREATE,
      });
      
      expect(result.success).toBe(true);
      expect(result.gasLeft).toBeGreaterThan(0n);
    } finally {
      evm.destroy();
    }
  });

  test("should handle STATICCALL correctly", () => {
    const evm = createEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 30_000_000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 1_000_000_000n,
      chainId: 1n,
    });
    
    try {
      const caller = "0x1234567890123456789012345678901234567890";
      const contractAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      
      // Set balance for caller
      evm.setBalance(caller, 10n ** 18n);
      
      // Simple code that just returns success
      const bytecode = new Uint8Array([0x00]); // STOP
      evm.setCode(contractAddress, bytecode);
      
      const result = evm.call({
        caller,
        to: contractAddress,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.STATICCALL,
      });
      
      expect(result.success).toBe(true);
      expect(result.gasLeft).toBeGreaterThan(0n);
    } finally {
      evm.destroy();
    }
  });

  test("should convert hex to bytes correctly", () => {
    const hex = "0x48656c6c6f"; // "Hello" in hex
    const bytes = hexToBytes(hex);
    
    expect(bytes.length).toBe(5);
    expect(bytes[0]).toBe(0x48); // 'H'
    expect(bytes[1]).toBe(0x65); // 'e'
    expect(bytes[2]).toBe(0x6c); // 'l'
    expect(bytes[3]).toBe(0x6c); // 'l'
    expect(bytes[4]).toBe(0x6f); // 'o'
  });

  test("should convert bytes to hex correctly", () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    const hex = bytesToHex(bytes);
    
    expect(hex).toBe("0x48656c6c6f");
  });
});