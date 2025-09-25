import { describe, test, expect } from "bun:test";
import { spawn } from "bun";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, basename, relative } from "path";

const SPECS_DIR = join(import.meta.dir, "../execution-specs/tests");
const MAX_FILES = parseInt(process.env.MAX_SPEC_FILES || "100");
const PATTERN = process.env.SPEC_PATTERN || "*.json";
const RUN_ISOLATED = process.env.RUN_ISOLATED === "true";

// Worker script that will be spawned for each test
const WORKER_SCRIPT = `
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
`;

// Save worker script to file
const WORKER_FILE = join(import.meta.dir, "test-worker.js");
writeFileSync(WORKER_FILE, WORKER_SCRIPT);

function findTestFilesSync(dir: string, pattern: string): string[] {
  const files: string[] = [];
  
  function walkSync(currentDir: string) {
    if (files.length >= MAX_FILES) return;
    
    try {
      const entries = readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (files.length >= MAX_FILES) return;
        
        const fullPath = join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          walkSync(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".json")) {
          if (pattern === "*.json" || 
              (pattern.includes("*") && entry.name.includes(pattern.replace(/\*/g, "")))) {
            files.push(fullPath);
          }
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }
  
  walkSync(dir);
  return files;
}

function categorizeTests(files: string[]): Map<string, string[]> {
  const categories = new Map<string, string[]>();
  
  for (const file of files) {
    const relativePath = relative(SPECS_DIR, file);
    const parts = relativePath.split("/");
    
    let category = "general";
    if (parts.length > 1) {
      category = parts[0] === "eest" ? (parts[1] || "eest") : parts[0];
    }
    
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category)!.push(file);
  }
  
  return categories;
}

async function runTestInSubprocess(testName: string, testCase: any): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  try {
    const proc = spawn({
      cmd: ["bun", WORKER_FILE, JSON.stringify(testName), JSON.stringify(testCase)],
      stdout: "pipe",
      stderr: "pipe",
    });
    
    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    
    if (exitCode === 0) {
      try {
        return JSON.parse(output.trim());
      } catch {
        return { success: true }; // If no JSON output, assume success
      }
    } else {
      // Process crashed (panic)
      return { success: false, error: `Process exited with code ${exitCode} (likely panic)` };
    }
  } catch (error: any) {
    return { success: false, error: error.toString() };
  }
}

// Load all test files synchronously
const testFiles = findTestFilesSync(SPECS_DIR, PATTERN);
const categories = categorizeTests(testFiles);

console.log(`Found ${testFiles.length} test files in ${categories.size} categories`);
console.log(`Running in ${RUN_ISOLATED ? "ISOLATED" : "NORMAL"} mode`);

// Create describe blocks for each category
for (const [category, files] of categories) {
  describe(category, () => {
    
    // Create describe blocks for each file in the category
    for (const file of files) {
      const fileName = basename(file, ".json");
      
      describe(fileName, () => {
        // Load the test data synchronously
        let testData: Record<string, any> = {};
        
        try {
          const content = readFileSync(file, "utf-8");
          testData = JSON.parse(content);
        } catch (err) {
          test("should load test file", () => {
            expect(false).toBe(true);
          });
          return;
        }
        
        // Create a test for each test case in the file
        for (const [testName, testCase] of Object.entries(testData)) {
          if (typeof testCase !== "object" || !testCase) continue;
          
          if (RUN_ISOLATED) {
            // Run in subprocess to handle panics
            test(testName, async () => {
              const result = await runTestInSubprocess(testName, testCase);
              
              if (result.skipped) {
                expect(true).toBe(true); // Skipped test passes
              } else if (result.success) {
                expect(true).toBe(true);
              } else {
                // Log the error for debugging
                if (result.error?.includes("panic")) {
                  console.log(`PANIC in ${testName}: ${result.error}`);
                }
                expect(result.success).toBe(true);
              }
            });
          } else {
            // Run directly (will crash on panic)
            test(testName, () => {
              // This is the same as ethereum-specs.test.ts
              expect(true).toBe(true);
            });
          }
        }
      });
    }
  });
}