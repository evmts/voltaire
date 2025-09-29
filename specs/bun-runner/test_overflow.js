import { GuillotineEVM, hexToBytes } from "../../sdks/bun/src";

// Test 1: Create bytecode that pushes 1023 times (just under the limit)
console.log("Test 1: 1023 pushes (should succeed)");
let bytecode1 = "0x";
for (let i = 0; i < 1023; i++) {
  bytecode1 += "6000"; // PUSH1 0x00
}

const evm1 = new GuillotineEVM({
  number: 1n,
  timestamp: 1000n,
  gasLimit: 10000000n,
  coinbase: "0x0000000000000000000000000000000000000000",
  baseFee: 0n,
  chainId: 1n,
});

try {
  const result1 = evm1.call({
    caller: "0x1000000000000000000000000000000000000000",
    to: "0x0000000000000000000000000000000000000000",
    value: 0n,
    input: hexToBytes(bytecode1),
    gas: 10000000n,
    callType: 0,
  });
  console.log("Result 1:", result1);
} catch (e) {
  console.log("Error 1:", e.message);
} finally {
  evm1.destroy();
}

// Test 2: Create bytecode that pushes 1024 times (exactly at the limit)
console.log("\nTest 2: 1024 pushes (should fail with stack overflow)");
let bytecode2 = "0x";
for (let i = 0; i < 1024; i++) {
  bytecode2 += "6000"; // PUSH1 0x00
}

const evm2 = new GuillotineEVM({
  number: 1n,
  timestamp: 1000n,
  gasLimit: 10000000n,
  coinbase: "0x0000000000000000000000000000000000000000",
  baseFee: 0n,
  chainId: 1n,
});

try {
  const result2 = evm2.call({
    caller: "0x1000000000000000000000000000000000000000",
    to: "0x0000000000000000000000000000000000000000",
    value: 0n,
    input: hexToBytes(bytecode2),
    gas: 10000000n,
    callType: 0,
  });
  console.log("Result 2:", result2);
} catch (e) {
  console.log("Error 2:", e.message);
} finally {
  evm2.destroy();
}

// Test 3: Test the actual failing test data
console.log("\nTest 3: Actual test data from stackOverflowM1PUSH");
let bytecode3 = "0x";
for (let i = 0; i < 1023; i++) {
  bytecode3 += "610000"; // PUSH2 0x0000
}

const evm3 = new GuillotineEVM({
  number: 1n,
  timestamp: 1000n,
  gasLimit: 10000000n,
  coinbase: "0x0000000000000000000000000000000000000000",
  baseFee: 0n,
  chainId: 1n,
});

try {
  const result3 = evm3.call({
    caller: "0x1000000000000000000000000000000000000000",
    to: "0x0000000000000000000000000000000000000000",
    value: 0n,
    input: hexToBytes(bytecode3),
    gas: 10000000n,
    callType: 0,
  });
  console.log("Result 3:", result3);
} catch (e) {
  console.log("Error 3:", e.message);
} finally {
  evm3.destroy();
}