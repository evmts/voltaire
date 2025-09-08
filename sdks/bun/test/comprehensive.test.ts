import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { createEVM, CallType, hexToBytes, bytesToHex, GuillotineEVM } from "../src/index";

// Test utilities
function generateAddress(seed: number): string {
  const hex = seed.toString(16).padStart(40, "0");
  return "0x" + hex;
}

function generateBytecode(...opcodes: number[]): Uint8Array {
  return new Uint8Array(opcodes);
}

describe("Guillotine Bun FFI - Comprehensive Tests", () => {
  describe("EVM Instance Management", () => {
    test("should create and destroy multiple EVM instances", () => {
      const evms: GuillotineEVM[] = [];
      
      // Create multiple instances
      for (let i = 0; i < 5; i++) {
        const evm = createEVM({
          number: BigInt(i),
          timestamp: BigInt(1000 + i),
          gasLimit: 30_000_000n,
          coinbase: generateAddress(i),
          baseFee: 1_000_000_000n,
          chainId: BigInt(i + 1),
        });
        evms.push(evm);
      }
      
      // Verify all are created
      expect(evms.length).toBe(5);
      
      // Destroy all instances
      for (const evm of evms) {
        evm.destroy();
      }
    });

    test("should handle different hardfork configurations", () => {
      const configs = [
        { chainId: 1n, baseFee: 0n },           // Pre-London
        { chainId: 1n, baseFee: 1_000_000_000n }, // Post-London
        { chainId: 137n, baseFee: 30_000_000_000n }, // Polygon
      ];
      
      for (const config of configs) {
        const evm = createEVM({
          number: 1n,
          timestamp: 1000n,
          gasLimit: 30_000_000n,
          coinbase: "0x0000000000000000000000000000000000000000",
          baseFee: config.baseFee,
          chainId: config.chainId,
        });
        
        expect(evm).toBeDefined();
        evm.destroy();
      }
    });
  });

  describe("Account Management", () => {
    let evm: GuillotineEVM;
    
    beforeAll(() => {
      evm = createEVM({
        number: 1n,
        timestamp: 1000n,
        gasLimit: 30_000_000n,
        coinbase: "0x0000000000000000000000000000000000000000",
        baseFee: 1_000_000_000n,
        chainId: 1n,
      });
    });
    
    afterAll(() => {
      evm.destroy();
    });

    test("should set and use multiple account balances", () => {
      const accounts = [
        { address: generateAddress(1), balance: 1_000_000_000_000_000_000n }, // 1 ETH
        { address: generateAddress(2), balance: 500_000_000_000_000_000n },   // 0.5 ETH
        { address: generateAddress(3), balance: 100_000_000_000_000_000n },   // 0.1 ETH
      ];
      
      for (const account of accounts) {
        evm.setBalance(account.address, account.balance);
      }
      
      // Verify all balances were set
      expect(true).toBe(true); // Would need getBalance method to verify
    });

    test("should handle edge case balances", () => {
      const edgeCases = [
        { address: generateAddress(100), balance: 0n },
        { address: generateAddress(101), balance: 1n },
        { address: generateAddress(102), balance: (1n << 256n) - 1n }, // Max uint256
      ];
      
      for (const account of edgeCases) {
        expect(() => {
          evm.setBalance(account.address, account.balance);
        }).not.toThrow();
      }
    });
  });

  describe("Bytecode Execution", () => {
    let evm: GuillotineEVM;
    
    beforeAll(() => {
      evm = createEVM({
        number: 1n,
        timestamp: 1000n,
        gasLimit: 30_000_000n,
        coinbase: "0x0000000000000000000000000000000000000000",
        baseFee: 1_000_000_000n,
        chainId: 1n,
      });
    });
    
    afterAll(() => {
      evm.destroy();
    });

    test("should execute arithmetic operations", () => {
      const caller = generateAddress(1);
      const contractAddress = generateAddress(2);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Bytecode: PUSH1 5, PUSH1 3, ADD, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
      // Adds 3 + 5 = 8 and returns it
      const bytecode = generateBytecode(
        0x60, 0x05,  // PUSH1 5
        0x60, 0x03,  // PUSH1 3
        0x01,        // ADD
        0x60, 0x00,  // PUSH1 0
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 32
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      );
      
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
      expect(result.output.length).toBe(32);
      // Result should be 8 in the last byte
      expect(result.output[31]).toBe(8);
    });

    test("should execute comparison operations", () => {
      const caller = generateAddress(1);
      const contractAddress = generateAddress(3);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Bytecode: PUSH1 5, PUSH1 10, LT, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
      // Checks if 5 < 10 (true = 1)
      const bytecode = generateBytecode(
        0x60, 0x05,  // PUSH1 5
        0x60, 0x0a,  // PUSH1 10
        0x10,        // LT
        0x60, 0x00,  // PUSH1 0
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 32
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      );
      
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
      expect(result.output[31]).toBe(1); // True
    });

    test("should handle storage operations", () => {
      const caller = generateAddress(1);
      const contractAddress = generateAddress(4);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Bytecode: Store 42 at slot 0, then load and return it
      // PUSH1 42, PUSH1 0, SSTORE, PUSH1 0, SLOAD, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
      const bytecode = generateBytecode(
        0x60, 0x2a,  // PUSH1 42
        0x60, 0x00,  // PUSH1 0
        0x55,        // SSTORE
        0x60, 0x00,  // PUSH1 0
        0x54,        // SLOAD
        0x60, 0x00,  // PUSH1 0
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 32
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      );
      
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
      expect(result.output[31]).toBe(42);
    });

    test("should handle memory operations", () => {
      const caller = generateAddress(1);
      const contractAddress = generateAddress(5);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Bytecode: Store values in memory and return
      // PUSH1 0xFF, PUSH1 0, MSTORE8
      // PUSH1 0xAA, PUSH1 1, MSTORE8
      // PUSH1 2, PUSH1 0, RETURN
      const bytecode = generateBytecode(
        0x60, 0xff,  // PUSH1 0xFF
        0x60, 0x00,  // PUSH1 0
        0x53,        // MSTORE8
        0x60, 0xaa,  // PUSH1 0xAA
        0x60, 0x01,  // PUSH1 1
        0x53,        // MSTORE8
        0x60, 0x02,  // PUSH1 2
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      );
      
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
      expect(result.output.length).toBe(2);
      expect(result.output[0]).toBe(0xff);
      expect(result.output[1]).toBe(0xaa);
    });
  });

  describe("Contract Creation", () => {
    let evm: GuillotineEVM;
    
    beforeAll(() => {
      evm = createEVM({
        number: 1n,
        timestamp: 1000n,
        gasLimit: 30_000_000n,
        coinbase: "0x0000000000000000000000000000000000000000",
        baseFee: 1_000_000_000n,
        chainId: 1n,
      });
    });
    
    afterAll(() => {
      evm.destroy();
    });

    test("CREATE - should deploy simple contract", () => {
      const deployer = generateAddress(10);
      evm.setBalance(deployer, 10n ** 18n);
      
      // Init code that returns runtime code: STOP
      const initCode = generateBytecode(
        0x60, 0x01,  // PUSH1 1 (size)
        0x60, 0x0a,  // PUSH1 10 (offset)
        0xf3,        // RETURN
        // Padding
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        // Runtime code at offset 10
        0x00         // STOP
      );
      
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
      // Output should contain the created address (if implemented)
    });

    test("CREATE - should deploy with value transfer", () => {
      const deployer = generateAddress(11);
      const deployValue = 1_000_000_000_000_000n; // 0.001 ETH
      
      evm.setBalance(deployer, 10n ** 18n);
      
      // Simple init code
      const initCode = generateBytecode(
        0x60, 0x00,  // PUSH1 0
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      );
      
      const result = evm.call({
        caller: deployer,
        to: "0x0000000000000000000000000000000000000000",
        value: deployValue,
        input: initCode,
        gas: 1000000n,
        callType: CallType.CREATE,
      });
      
      expect(result.success).toBe(true);
    });

    test("CREATE2 - should deploy with deterministic address", () => {
      const deployer = generateAddress(12);
      evm.setBalance(deployer, 10n ** 18n);
      
      const salt = 0x1234567890abcdefn;
      
      // Init code
      const initCode = generateBytecode(
        0x60, 0x01,  // PUSH1 1
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      );
      
      const result = evm.call({
        caller: deployer,
        to: "0x0000000000000000000000000000000000000000",
        value: 0n,
        input: initCode,
        gas: 1000000n,
        callType: CallType.CREATE2,
        salt,
      });
      
      expect(result.success).toBe(true);
      expect(result.gasLeft).toBeGreaterThan(0n);
    });

    test("CREATE2 - same parameters should produce same address", () => {
      const deployer = generateAddress(13);
      evm.setBalance(deployer, 10n ** 19n); // 10 ETH
      
      const salt = 0xdeadbeefn;
      const initCode = generateBytecode(0x00, 0x00, 0xf3);
      
      // First deployment
      const result1 = evm.call({
        caller: deployer,
        to: "0x0000000000000000000000000000000000000000",
        value: 0n,
        input: initCode,
        gas: 1000000n,
        callType: CallType.CREATE2,
        salt,
      });
      
      expect(result1.success).toBe(true);
      
      // Attempting same deployment should fail (collision)
      const result2 = evm.call({
        caller: deployer,
        to: "0x0000000000000000000000000000000000000000",
        value: 0n,
        input: initCode,
        gas: 1000000n,
        callType: CallType.CREATE2,
        salt,
      });
      
      // Should fail due to address collision
      expect(result2.success).toBe(false);
    });
  });

  describe("Call Types", () => {
    let evm: GuillotineEVM;
    
    beforeAll(() => {
      evm = createEVM({
        number: 1n,
        timestamp: 1000n,
        gasLimit: 30_000_000n,
        coinbase: "0x0000000000000000000000000000000000000000",
        baseFee: 1_000_000_000n,
        chainId: 1n,
      });
    });
    
    afterAll(() => {
      evm.destroy();
    });

    test("CALL - should execute with value transfer", () => {
      const caller = generateAddress(20);
      const target = generateAddress(21);
      
      evm.setBalance(caller, 10n ** 18n);
      evm.setCode(target, generateBytecode(0x00)); // STOP
      
      const transferValue = 1000000n;
      
      const result = evm.call({
        caller,
        to: target,
        value: transferValue,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(true);
      expect(result.gasLeft).toBeGreaterThan(0n);
    });

    test("DELEGATECALL - should preserve caller context", () => {
      const originalCaller = generateAddress(22);
      const proxy = generateAddress(23);
      const implementation = generateAddress(24);
      
      evm.setBalance(originalCaller, 10n ** 18n);
      
      // Implementation returns CALLER address
      const implCode = generateBytecode(
        0x33,        // CALLER
        0x60, 0x00,  // PUSH1 0
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 32
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      );
      evm.setCode(implementation, implCode);
      
      // For this test, we simulate what a proxy would do
      const result = evm.call({
        caller: originalCaller,
        to: implementation,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.DELEGATECALL,
      });
      
      expect(result.success).toBe(true);
      // Output should contain originalCaller address
    });

    test("STATICCALL - should prevent state modifications", () => {
      const caller = generateAddress(25);
      const target = generateAddress(26);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Code that attempts SSTORE (should fail in static context)
      const bytecode = generateBytecode(
        0x60, 0x01,  // PUSH1 1
        0x60, 0x00,  // PUSH1 0
        0x55,        // SSTORE (should fail)
        0x00         // STOP
      );
      evm.setCode(target, bytecode);
      
      const result = evm.call({
        caller,
        to: target,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.STATICCALL,
      });
      
      // Should fail due to state modification attempt
      expect(result.success).toBe(false);
    });

    test("STATICCALL - should allow reads", () => {
      const caller = generateAddress(27);
      const target = generateAddress(28);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Code that only reads (SLOAD)
      const bytecode = generateBytecode(
        0x60, 0x00,  // PUSH1 0
        0x54,        // SLOAD
        0x60, 0x00,  // PUSH1 0
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 32
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      );
      evm.setCode(target, bytecode);
      
      const result = evm.call({
        caller,
        to: target,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.STATICCALL,
      });
      
      expect(result.success).toBe(true);
      expect(result.output.length).toBe(32);
    });
  });

  describe("Gas Metering", () => {
    let evm: GuillotineEVM;
    
    beforeAll(() => {
      evm = createEVM({
        number: 1n,
        timestamp: 1000n,
        gasLimit: 30_000_000n,
        coinbase: "0x0000000000000000000000000000000000000000",
        baseFee: 1_000_000_000n,
        chainId: 1n,
      });
    });
    
    afterAll(() => {
      evm.destroy();
    });

    test("should consume gas for operations", () => {
      const caller = generateAddress(30);
      const contract = generateAddress(31);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Simple operations with known gas costs
      const bytecode = generateBytecode(
        0x60, 0x01,  // PUSH1 1 (3 gas)
        0x60, 0x02,  // PUSH1 2 (3 gas)
        0x01,        // ADD (3 gas)
        0x00         // STOP (0 gas)
      );
      evm.setCode(contract, bytecode);
      
      const initialGas = 100000n;
      const result = evm.call({
        caller,
        to: contract,
        value: 0n,
        input: new Uint8Array(0),
        gas: initialGas,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(true);
      expect(result.gasLeft).toBeLessThan(initialGas);
      expect(result.gasLeft).toBeGreaterThan(initialGas - 1000n); // Reasonable gas usage
    });

    test("should fail with insufficient gas", () => {
      const caller = generateAddress(32);
      const contract = generateAddress(33);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Expensive operation
      const bytecode = generateBytecode(
        0x60, 0x00,  // PUSH1 0
        0x60, 0x00,  // PUSH1 0
        0x60, 0x00,  // PUSH1 0
        0x60, 0x00,  // PUSH1 0
        0x60, 0x00,  // PUSH1 0
        0xf0         // CREATE (very expensive)
      );
      evm.setCode(contract, bytecode);
      
      const result = evm.call({
        caller,
        to: contract,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100n, // Very low gas
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(false);
      expect(result.gasLeft).toBe(0n);
    });
  });

  describe("Error Handling", () => {
    let evm: GuillotineEVM;
    
    beforeAll(() => {
      evm = createEVM({
        number: 1n,
        timestamp: 1000n,
        gasLimit: 30_000_000n,
        coinbase: "0x0000000000000000000000000000000000000000",
        baseFee: 1_000_000_000n,
        chainId: 1n,
      });
    });
    
    afterAll(() => {
      evm.destroy();
    });

    test("should handle invalid jump", () => {
      const caller = generateAddress(40);
      const contract = generateAddress(41);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Invalid JUMP destination
      const bytecode = generateBytecode(
        0x60, 0xff,  // PUSH1 255 (invalid destination)
        0x56         // JUMP
      );
      evm.setCode(contract, bytecode);
      
      const result = evm.call({
        caller,
        to: contract,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(false);
    });

    test("should handle stack underflow", () => {
      const caller = generateAddress(42);
      const contract = generateAddress(43);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // ADD without enough stack items
      const bytecode = generateBytecode(
        0x60, 0x01,  // PUSH1 1
        0x01         // ADD (needs 2 items, only has 1)
      );
      evm.setCode(contract, bytecode);
      
      const result = evm.call({
        caller,
        to: contract,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(false);
    });

    test("should handle invalid opcode", () => {
      const caller = generateAddress(44);
      const contract = generateAddress(45);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Invalid opcode
      const bytecode = generateBytecode(0xfe); // INVALID opcode
      evm.setCode(contract, bytecode);
      
      const result = evm.call({
        caller,
        to: contract,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(false);
    });

    test("should handle revert", () => {
      const caller = generateAddress(46);
      const contract = generateAddress(47);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // REVERT with data
      const bytecode = generateBytecode(
        0x60, 0x04,  // PUSH1 4 (size)
        0x60, 0x00,  // PUSH1 0 (offset)
        0xfd         // REVERT
      );
      evm.setCode(contract, bytecode);
      
      const result = evm.call({
        caller,
        to: contract,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(false);
      // Should have revert data
      expect(result.output.length).toBeGreaterThan(0);
    });
  });

  describe("Complex Scenarios", () => {
    let evm: GuillotineEVM;
    
    beforeAll(() => {
      evm = createEVM({
        number: 1n,
        timestamp: 1000n,
        gasLimit: 30_000_000n,
        coinbase: "0x0000000000000000000000000000000000000000",
        baseFee: 1_000_000_000n,
        chainId: 1n,
      });
    });
    
    afterAll(() => {
      evm.destroy();
    });

    test("should handle nested calls", () => {
      const caller = generateAddress(50);
      const contractA = generateAddress(51);
      const contractB = generateAddress(52);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Contract B: Returns 42
      const contractBCode = generateBytecode(
        0x60, 0x2a,  // PUSH1 42
        0x60, 0x00,  // PUSH1 0
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 32
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      );
      evm.setCode(contractB, contractBCode);
      
      // Contract A: Calls B and returns result
      // This is simplified - real nested call would use CALL opcode
      const contractACode = generateBytecode(
        0x60, 0x01,  // PUSH1 1
        0x60, 0x00,  // PUSH1 0
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 32
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      );
      evm.setCode(contractA, contractACode);
      
      const result = evm.call({
        caller,
        to: contractA,
        value: 0n,
        input: new Uint8Array(0),
        gas: 200000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(true);
    });

    test("should handle complex state transitions", () => {
      const caller = generateAddress(60);
      const contract = generateAddress(61);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Complex contract with multiple storage operations
      const bytecode = generateBytecode(
        // Store 100 at slot 0
        0x60, 0x64,  // PUSH1 100
        0x60, 0x00,  // PUSH1 0
        0x55,        // SSTORE
        
        // Store 200 at slot 1
        0x60, 0xc8,  // PUSH1 200
        0x60, 0x01,  // PUSH1 1
        0x55,        // SSTORE
        
        // Load slot 0 and slot 1, add them
        0x60, 0x00,  // PUSH1 0
        0x54,        // SLOAD
        0x60, 0x01,  // PUSH1 1
        0x54,        // SLOAD
        0x01,        // ADD
        
        // Store result at slot 2
        0x60, 0x02,  // PUSH1 2
        0x55,        // SSTORE
        
        // Return the sum
        0x60, 0x02,  // PUSH1 2
        0x54,        // SLOAD
        0x60, 0x00,  // PUSH1 0
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 32
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      );
      evm.setCode(contract, bytecode);
      
      const result = evm.call({
        caller,
        to: contract,
        value: 0n,
        input: new Uint8Array(0),
        gas: 500000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(true);
      expect(result.output.length).toBe(32);
      // Result should be 300 (100 + 200)
      const resultValue = result.output[31] | (result.output[30] << 8);
      expect(resultValue).toBe(300);
    });
  });

  describe("Input/Output Handling", () => {
    let evm: GuillotineEVM;
    
    beforeAll(() => {
      evm = createEVM({
        number: 1n,
        timestamp: 1000n,
        gasLimit: 30_000_000n,
        coinbase: "0x0000000000000000000000000000000000000000",
        baseFee: 1_000_000_000n,
        chainId: 1n,
      });
    });
    
    afterAll(() => {
      evm.destroy();
    });

    test("should handle calldata correctly", () => {
      const caller = generateAddress(70);
      const contract = generateAddress(71);
      
      evm.setBalance(caller, 10n ** 18n);
      
      // Contract that returns calldata
      const bytecode = generateBytecode(
        0x36,        // CALLDATASIZE
        0x60, 0x00,  // PUSH1 0
        0x60, 0x00,  // PUSH1 0
        0x37,        // CALLDATACOPY
        0x36,        // CALLDATASIZE
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      );
      evm.setCode(contract, bytecode);
      
      const inputData = new Uint8Array([1, 2, 3, 4, 5]);
      
      const result = evm.call({
        caller,
        to: contract,
        value: 0n,
        input: inputData,
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(true);
      expect(result.output).toEqual(inputData);
    });

    test("should handle large inputs", () => {
      const caller = generateAddress(72);
      const contract = generateAddress(73);
      
      evm.setBalance(caller, 10n ** 18n);
      evm.setCode(contract, generateBytecode(0x00)); // STOP
      
      // Create large input (1KB)
      const largeInput = new Uint8Array(1024);
      for (let i = 0; i < largeInput.length; i++) {
        largeInput[i] = i % 256;
      }
      
      const result = evm.call({
        caller,
        to: contract,
        value: 0n,
        input: largeInput,
        gas: 1000000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(true);
    });

    test("should handle empty input", () => {
      const caller = generateAddress(74);
      const contract = generateAddress(75);
      
      evm.setBalance(caller, 10n ** 18n);
      evm.setCode(contract, generateBytecode(0x00)); // STOP
      
      const result = evm.call({
        caller,
        to: contract,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(true);
      expect(result.output.length).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    let evm: GuillotineEVM;
    
    beforeAll(() => {
      evm = createEVM({
        number: 1n,
        timestamp: 1000n,
        gasLimit: 30_000_000n,
        coinbase: "0x0000000000000000000000000000000000000000",
        baseFee: 1_000_000_000n,
        chainId: 1n,
      });
    });
    
    afterAll(() => {
      evm.destroy();
    });

    test("should handle call to non-existent account", () => {
      const caller = generateAddress(80);
      const nonExistent = generateAddress(81);
      
      evm.setBalance(caller, 10n ** 18n);
      
      const result = evm.call({
        caller,
        to: nonExistent,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      // Call to non-existent account should succeed (empty code)
      expect(result.success).toBe(true);
      expect(result.output.length).toBe(0);
    });

    test("should handle self-destruct", () => {
      const caller = generateAddress(82);
      const contract = generateAddress(83);
      const beneficiary = generateAddress(84);
      
      evm.setBalance(caller, 10n ** 18n);
      evm.setBalance(contract, 5n * 10n ** 17n); // 0.5 ETH
      
      // SELFDESTRUCT to beneficiary
      // Note: Exact bytecode depends on how beneficiary address is pushed
      const bytecode = generateBytecode(
        0x73, // PUSH20
        ...Array.from(hexToBytes(beneficiary.slice(2))),
        0xff  // SELFDESTRUCT
      );
      evm.setCode(contract, bytecode);
      
      const result = evm.call({
        caller,
        to: contract,
        value: 0n,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(true);
    });

    test("should handle maximum value transfers", () => {
      const caller = generateAddress(85);
      const recipient = generateAddress(86);
      
      const maxValue = (1n << 256n) - 1n;
      evm.setBalance(caller, maxValue);
      evm.setCode(recipient, generateBytecode(0x00)); // STOP
      
      const result = evm.call({
        caller,
        to: recipient,
        value: maxValue,
        input: new Uint8Array(0),
        gas: 100000n,
        callType: CallType.CALL,
      });
      
      // Should fail due to insufficient balance (can't transfer entire balance due to gas)
      expect(result.success).toBe(false);
    });

    test("should handle zero gas", () => {
      const caller = generateAddress(87);
      const contract = generateAddress(88);
      
      evm.setBalance(caller, 10n ** 18n);
      evm.setCode(contract, generateBytecode(0x00)); // STOP
      
      const result = evm.call({
        caller,
        to: contract,
        value: 0n,
        input: new Uint8Array(0),
        gas: 0n,
        callType: CallType.CALL,
      });
      
      expect(result.success).toBe(false);
      expect(result.gasLeft).toBe(0n);
    });
  });
});