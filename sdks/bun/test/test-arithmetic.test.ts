import { test, expect, describe } from "bun:test";
import { createEVM, CallType } from "../src/index";

describe("Debug Arithmetic Test", () => {
  test("should execute arithmetic addition", () => {
    const evm = createEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 30_000_000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 1_000_000_000n,
      chainId: 1n,
      difficulty: 0n,
      prevRandao: new Uint8Array(32),
    });
    
    // Setup accounts
    const caller = "0x0000000000000000000000000000000000000001";
    const contractAddress = "0x0000000000000000000000000000000000000002";
    
    // Set balances
    evm.setBalance(caller, 1_000_000_000_000_000_000n); // 1 ETH
    
    // Deploy contract with ADD bytecode
    // PUSH1 5, PUSH1 3, ADD, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
    const bytecode = new Uint8Array([
      0x60, 0x05,  // PUSH1 5
      0x60, 0x03,  // PUSH1 3
      0x01,        // ADD
      0x60, 0x00,  // PUSH1 0
      0x52,        // MSTORE
      0x60, 0x20,  // PUSH1 32
      0x60, 0x00,  // PUSH1 0
      0xf3         // RETURN
    ]);
    
    console.log("Deploying contract with bytecode:", Array.from(bytecode).map(b => "0x" + b.toString(16).padStart(2, '0')).join(' '));
    evm.setCode(contractAddress, bytecode);
    
    // Call the contract
    console.log("Calling contract...");
    console.log("Caller:", caller);
    console.log("Contract:", contractAddress);
    
    const result = evm.call({
      caller,
      to: contractAddress,
      value: 0n,
      input: new Uint8Array(0),
      gas: 100000n,
      callType: CallType.CALL,
    });
    
    console.log("\n=== Result ===");
    console.log("Success:", result.success);
    console.log("Gas left:", result.gasLeft);
    console.log("Output length:", result.output.length);
    console.log("Output bytes:", Array.from(result.output));
    console.log("Output hex:", Array.from(result.output).map(b => b.toString(16).padStart(2, '0')).join(' '));
    
    if (result.output.length >= 32) {
      console.log("\nLast 32 bytes:", Array.from(result.output.slice(-32)));
      console.log("Value at position 31:", result.output[31]);
      console.log("Expected value:", 8);
      
      // Check if the value is somewhere else
      for (let i = 0; i < result.output.length; i++) {
        if (result.output[i] === 8) {
          console.log(`Found value 8 at position ${i}`);
        }
      }
    }
    
    if (result.error) {
      console.log("Error:", result.error);
    }
    
    expect(result.success).toBe(true);
    expect(result.gasLeft).toBeGreaterThan(0n);
    expect(result.output.length).toBe(32);
    expect(result.output[31]).toBe(8);
    
    evm.destroy();
  });
});