
import { GuillotineEVM, hexToBytes, CallType } from "../../sdks/bun/src";

const testData = JSON.parse(process.argv[2]);
const testCase = JSON.parse(process.argv[3]);

function parseAddress(addr) {
  if (addr.startsWith("<") && addr.endsWith(">")) {
    const match = addr.match(/0x[0-9a-fA-F]+/);
    if (match) return match[0].toLowerCase();
  }
  if (!addr.startsWith("0x")) addr = "0x" + addr;
  return addr.toLowerCase().padEnd(42, "0");
}

function parseHexData(data) {
  if (data.startsWith(":raw ")) data = data.substring(5);
  if (data.includes(",:raw ")) {
    const parts = data.split(",:raw ");
    data = parts.map(p => p.replace(/^0x/, "")).join("");
    data = "0x" + data;
  }
  if (!data.startsWith("0x")) data = "0x" + data;
  return data;
}

try {
  // Skip if assembly code
  if (testCase.pre) {
    for (const state of Object.values(testCase.pre)) {
      if (state.code && state.code.startsWith("{")) {
        console.log(JSON.stringify({ skipped: true, reason: "assembly" }));
        process.exit(0);
      }
    }
  }
  
  const blockInfo = {
    number: testCase.env?.currentNumber ? BigInt(testCase.env.currentNumber) : 1n,
    timestamp: testCase.env?.currentTimestamp ? BigInt(testCase.env.currentTimestamp) : 1000n,
    gasLimit: testCase.env?.currentGasLimit ? BigInt(testCase.env.currentGasLimit) : 10000000n,
    coinbase: parseAddress(testCase.env?.currentCoinbase || "0x0000000000000000000000000000000000000000"),
    baseFee: testCase.env?.currentBaseFee ? BigInt(testCase.env.currentBaseFee) : 0n,
    chainId: 1n,
  };
  
  if (testCase.env?.currentDifficulty) {
    blockInfo.difficulty = BigInt(testCase.env.currentDifficulty);
  }
  
  const evm = new GuillotineEVM(blockInfo);
  
  try {
    // Setup pre-state
    if (testCase.pre) {
      for (const [address, state] of Object.entries(testCase.pre)) {
        const cleanAddr = parseAddress(address);
        
        if (state.balance) {
          evm.setBalance(cleanAddr, BigInt(state.balance));
        }
        
        if (state.code && state.code !== "" && state.code !== "0x") {
          let codeBytes;
          
          if (state.code.startsWith("0x")) {
            codeBytes = hexToBytes(state.code);
          } else if (state.code.startsWith(":raw ")) {
            const hexData = parseHexData(state.code);
            codeBytes = hexToBytes(hexData);
          }
          
          if (codeBytes && codeBytes.length > 0) {
            evm.setCode(cleanAddr, codeBytes);
          }
        }
      }
    }
    
    // Execute transaction(s)
    if (testCase.transaction || testCase.transactions) {
      const transactions = testCase.transactions || [testCase.transaction];
      
      for (const tx of transactions) {
        if (tx) {
          const txData = Array.isArray(tx.data) ? tx.data[0] : (tx.data || "0x");
          const cleanData = parseHexData(txData);
          
          let inputBytes = new Uint8Array(0);
          if (cleanData && cleanData !== "0x" && cleanData.length > 2) {
            inputBytes = hexToBytes(cleanData);
          }
          
          const params = {
            caller: parseAddress(tx.sender || "0x0000000000000000000000000000000000000000"),
            to: parseAddress(tx.to || "0x0000000000000000000000000000000000000000"),
            value: tx.value ? BigInt(Array.isArray(tx.value) ? tx.value[0] : tx.value) : 0n,
            input: inputBytes,
            gas: tx.gasLimit ? BigInt(Array.isArray(tx.gasLimit) ? tx.gasLimit[0] : tx.gasLimit) : 1000000n,
            callType: 0, // CallType.CALL
          };
          
          const result = evm.call(params);
        }
      }
    }
    
    console.log(JSON.stringify({ success: true }));
  } finally {
    evm.destroy();
  }
} catch (error) {
  console.log(JSON.stringify({ error: error.toString() }));
  process.exit(1);
}
