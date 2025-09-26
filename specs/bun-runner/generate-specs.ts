#!/usr/bin/env bun
import { readdir, readFile, mkdir, writeFile } from "fs/promises";
import { join, basename, dirname } from "path";
import { existsSync } from "fs";
import { compileAssembly } from "./lll-compiler";

const SPECS_DIR = join(import.meta.dir, "../execution-specs/tests");
const OUTPUT_DIR = join(import.meta.dir, "./generated-tests");
const MAX_FILES = parseInt(process.argv[2] || "100");
const PATTERN = process.argv[3] || "*.json";

interface TestCase {
  _info?: {
    comment?: string;
    pytest_marks?: string[];
  };
  env?: {
    currentCoinbase?: string;
    currentDifficulty?: string;
    currentGasLimit?: string;
    currentNumber?: string;
    currentTimestamp?: string;
    currentRandom?: string;
    currentBaseFee?: string;
  };
  pre?: Record<string, AccountState>;
  transaction?: Transaction;
  transactions?: Transaction[];
  expect?: ExpectResult[];
  post?: Record<string, AccountState>;
}

interface AccountState {
  balance?: string;
  code?: string;
  nonce?: string;
  storage?: Record<string, string>;
}

interface Transaction {
  data?: string | string[];
  gasLimit?: string | string[];
  gasPrice?: string;
  nonce?: string;
  to?: string;
  value?: string | string[];
  secretKey?: string;
  sender?: string;
  r?: string;
  s?: string;
  v?: string;
}

interface ExpectResult {
  network?: string[];
  result?: Record<string, AccountState>;
  indexes?: {
    data?: number | number[];
    gas?: number | number[];
    value?: number | number[];
  };
}

async function findTestFiles(dir: string, pattern: string): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        // Simple pattern matching
        if (pattern === "*.json") {
          files.push(fullPath);
        } else if (pattern.includes("*")) {
          const searchPattern = pattern.replace(/\*/g, "").toLowerCase();
          if (entry.name.toLowerCase().includes(searchPattern)) {
            files.push(fullPath);
          }
        } else if (entry.name.toLowerCase().includes(pattern.toLowerCase())) {
          files.push(fullPath);
        }
      }
    }
  }
  
  await walk(dir);
  return files.slice(0, MAX_FILES);
}

function categorizeTests(files: string[]): Map<string, string[]> {
  const categories = new Map<string, string[]>();
  
  for (const file of files) {
    // Extract category from path
    const relativePath = file.replace(SPECS_DIR, "").replace(/^\//, "");
    const parts = relativePath.split("/");
    
    let category = "general";
    if (parts.length > 1) {
      // Use the first meaningful directory as category
      if (parts[0] === "eest") {
        category = parts[1] || "eest";
      } else {
        category = parts[0];
      }
    }
    
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(file);
  }
  
  return categories;
}

function parseAddress(addr: string): string {
  // Handle special address formats
  if (addr.startsWith("<") && addr.endsWith(">")) {
    // Extract hex part from formats like "<eoa:sender:0xa94f...>"
    const match = addr.match(/0x[0-9a-fA-F]+/);
    if (match) {
      return match[0].toLowerCase();
    }
  }
  
  // Ensure address has 0x prefix and is lowercase
  if (!addr.startsWith("0x")) {
    addr = "0x" + addr;
  }
  return addr.toLowerCase().padEnd(42, "0");
}

function parseHexData(data: string): string {
  // Handle :raw prefix
  if (data.startsWith(":raw ")) {
    data = data.substring(5);
  }
  
  // Handle multiple :raw segments (comma separated)
  if (data.includes(",:raw ")) {
    const parts = data.split(",:raw ");
    data = parts.map(p => p.replace(/^0x/, "")).join("");
    data = "0x" + data;
  }
  
  // Ensure 0x prefix
  if (!data.startsWith("0x")) {
    data = "0x" + data;
  }
  
  return data;
}

function generateTestCode(testName: string, testCase: TestCase, filePath: string): string {
  const code: string[] = [];
  
  // Generate test function
  code.push(`  test("${testName}", async () => {`);
  code.push(`    const testFile = "${filePath}";`);
  code.push(`    `);
  
  // Parse and setup block info
  if (testCase.env) {
    code.push(`    // Setup block environment`);
    code.push(`    const blockInfo: BlockInfo = {`);
    code.push(`      number: ${testCase.env.currentNumber ? `BigInt("${testCase.env.currentNumber}")` : "1n"},`);
    code.push(`      timestamp: ${testCase.env.currentTimestamp ? `BigInt("${testCase.env.currentTimestamp}")` : "1000n"},`);
    code.push(`      gasLimit: ${testCase.env.currentGasLimit ? `BigInt("${testCase.env.currentGasLimit}")` : "10000000n"},`);
    code.push(`      coinbase: "${parseAddress(testCase.env.currentCoinbase || "0x0000000000000000000000000000000000000000")}",`);
    code.push(`      baseFee: ${testCase.env.currentBaseFee ? `BigInt("${testCase.env.currentBaseFee}")` : "0n"},`);
    code.push(`      chainId: 1n,`);
    if (testCase.env.currentDifficulty) {
      code.push(`      difficulty: BigInt("${testCase.env.currentDifficulty}"),`);
    }
    code.push(`    };`);
    code.push(``);
    code.push(`    const evm = new GuillotineEVM(blockInfo);`);
    code.push(`    `);
  } else {
    // Default block info
    code.push(`    const evm = createDefaultEVM();`);
    code.push(`    `);
  }
  
  // Setup pre-state
  if (testCase.pre) {
    code.push(`    // Setup pre-state`);
    for (const [address, state] of Object.entries(testCase.pre)) {
      const cleanAddr = parseAddress(address);
      
      if (state.balance) {
        code.push(`    evm.setBalance("${cleanAddr}", BigInt("${state.balance}"));`);
      }
      if (state.nonce) {
        code.push(`    evm.setNonce("${cleanAddr}", BigInt("${state.nonce}"));`);
      }
      if (state.storage) {
        for (const [key, value] of Object.entries(state.storage)) {
          code.push(`    evm.setStorage("${cleanAddr}", BigInt("${key}"), BigInt("${value}"));`);
        }
      }
      if (state.code) {
        // Handle assembly syntax or hex code
        if (state.code.startsWith("0x")) {
          code.push(`    evm.setCode("${cleanAddr}", hexToBytes("${state.code}"));`);
        } else if (state.code.startsWith(":raw ")) {
          const hexData = parseHexData(state.code);
          code.push(`    evm.setCode("${cleanAddr}", hexToBytes("${hexData}"));`);
        } else if (state.code.startsWith("{") || state.code.startsWith(":yul")) {
          // Compile assembly to bytecode
          try {
            const bytecode = compileAssembly(state.code);
            code.push(`    // Compiled from assembly: ${state.code.substring(0, 50)}...`);
            code.push(`    evm.setCode("${cleanAddr}", hexToBytes("${bytecode}"));`);
          } catch (error) {
            code.push(`    // Failed to compile assembly: ${error}`);
            code.push(`    // Original code: ${state.code.substring(0, 50)}...`);
            code.push(`    // Using empty bytecode as fallback`);
            code.push(`    evm.setCode("${cleanAddr}", hexToBytes("0x"));`);
          }
        }
      }
    }
    code.push(`    `);
  }
  
  // Execute transaction(s)
  if (testCase.transaction || testCase.transactions) {
    const transactions = testCase.transactions || [testCase.transaction!];
    code.push(`    // Execute transaction(s)`);
    
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (tx) {
        const txData = Array.isArray(tx.data) ? tx.data[0] : (tx.data || "0x");
        const cleanData = parseHexData(txData);
        
        code.push(`    const params${i}: CallParams = {`);
        code.push(`      caller: "${parseAddress(tx.sender || "0x0000000000000000000000000000000000000000")}",`);
        code.push(`      to: "${parseAddress(tx.to || "0x0000000000000000000000000000000000000000")}",`);
        code.push(`      value: ${tx.value ? `BigInt("${Array.isArray(tx.value) ? tx.value[0] : tx.value}")` : "0n"},`);
        code.push(`      input: hexToBytes("${cleanData}"),`);
        code.push(`      gas: ${tx.gasLimit ? `BigInt("${Array.isArray(tx.gasLimit) ? tx.gasLimit[0] : tx.gasLimit}")` : "1000000n"},`);
        code.push(`      callType: CallType.CALL,`);
        code.push(`    };`);
        code.push(`    `);
        code.push(`    const result${i} = evm.call(params${i});`);
        code.push(`    `);
      }
    }
  }
  
  // Validate post-state
  if (testCase.post) {
    code.push(`    // Verify post-state expectations`);
    code.push(`    const stateDump = evm.dumpState();`);
    code.push(`    `);
    
    for (const [address, expectedState] of Object.entries(testCase.post)) {
      const cleanAddr = parseAddress(address);
      code.push(`    // Check account ${cleanAddr}`);
      code.push(`    {`);
      code.push(`      const account = stateDump.accounts.get("${cleanAddr}");`);
      
      if (expectedState.balance !== undefined) {
        code.push(`      expect(account?.balance || 0n).toBe(BigInt("${expectedState.balance}"));`);
      }
      
      if (expectedState.nonce !== undefined) {
        code.push(`      expect(account?.nonce || 0n).toBe(BigInt("${expectedState.nonce}"));`);
      }
      
      if (expectedState.code && expectedState.code !== "" && expectedState.code !== "0x") {
        const expectedCode = parseHexData(expectedState.code);
        code.push(`      expect(bytesToHex(account?.code || new Uint8Array(0))).toBe("${expectedCode.toLowerCase()}");`);
      }
      
      if (expectedState.storage) {
        for (const [key, value] of Object.entries(expectedState.storage)) {
          const storageKey = `0x${BigInt(key).toString(16).padStart(64, '0')}`;
          code.push(`      expect(account?.storage.get("${storageKey}") || 0n).toBe(BigInt("${value}"));`);
        }
      }
      
      code.push(`    }`);
    }
  } else if (testCase.expect && testCase.expect.length > 0) {
    code.push(`    // Verify expect-format expectations`);
    code.push(`    const stateDump = evm.dumpState();`);
    code.push(`    `);
    
    // Handle expect format (some tests use this instead of post)
    for (const expectation of testCase.expect) {
      if (expectation.result) {
        for (const [address, expectedState] of Object.entries(expectation.result)) {
          const cleanAddr = parseAddress(address);
          code.push(`    // Check account ${cleanAddr}`);
          code.push(`    {`);
          code.push(`      const account = stateDump.accounts.get("${cleanAddr}");`);
          
          if (expectedState.balance !== undefined) {
            code.push(`      expect(account?.balance || 0n).toBe(BigInt("${expectedState.balance}"));`);
          }
          
          if (expectedState.nonce !== undefined) {
            code.push(`      expect(account?.nonce || 0n).toBe(BigInt("${expectedState.nonce}"));`);
          }
          
          if (expectedState.storage) {
            for (const [key, value] of Object.entries(expectedState.storage)) {
              const storageKey = `0x${BigInt(key).toString(16).padStart(64, '0')}`;
              code.push(`      expect(account?.storage.get("${storageKey}") || 0n).toBe(BigInt("${value}"));`);
            }
          }
          
          code.push(`    }`);
        }
        break; // Only use first expectation for now
      }
    }
  } else {
    code.push(`    // No post-state expectations to verify`);
    code.push(`    expect(result0).toBeDefined();`);
  }
  
  code.push(`    `);
  code.push(`    evm.destroy();`);
  code.push(`  });`);
  code.push(``);
  
  return code.join("\n");
}

async function generateCategoryTestFile(category: string, files: string[]): Promise<void> {
  const outputFile = join(OUTPUT_DIR, `${category}.spec.ts`);
  
  const imports = `import { describe, test, expect } from "bun:test";
import { 
  GuillotineEVM, 
  createEVM, 
  hexToBytes, 
  bytesToHex, 
  CallType,
  type BlockInfo,
  type CallParams,
  type EvmResult,
  type StateDump,
  type AccountState
} from "../../../sdks/bun/src";

function createDefaultEVM(): GuillotineEVM {
  return new GuillotineEVM({
    number: 1n,
    timestamp: 1000n,
    gasLimit: 10000000n,
    coinbase: "0x0000000000000000000000000000000000000000",
    baseFee: 0n,
    chainId: 1n,
  });
}

`;
  
  const testCode: string[] = [imports];
  
  testCode.push(`describe("${category} tests", () => {`);
  
  let testsGenerated = 0;
  let testsSkipped = 0;
  
  for (const file of files) {
    try {
      const content = await readFile(file, "utf-8");
      const data = JSON.parse(content);
      
      const fileName = basename(file, ".json");
      
      // Generate describe block for this file
      testCode.push(`  describe("${fileName}", () => {`);
      
      // Each file can contain multiple test cases
      for (const [testName, testCase] of Object.entries(data)) {
        if (typeof testCase === "object" && testCase !== null) {
          const generatedTest = generateTestCode(testName, testCase as TestCase, file);
          testCode.push(generatedTest.split("\n").map(line => "  " + line).join("\n"));
          testsGenerated++;
        }
      }
      
      testCode.push(`  });`);
      testCode.push(``);
      
    } catch (error) {
      console.warn(`Failed to process ${file}:`, error);
      testsSkipped++;
    }
  }
  
  testCode.push(`});`);
  testCode.push(``);
  testCode.push(`// Generated ${testsGenerated} tests, skipped ${testsSkipped}`);
  
  await writeFile(outputFile, testCode.join("\n"));
  console.log(`Generated ${outputFile} with ${testsGenerated} tests`);
}

async function main() {
  console.log(`🧪 Generating Bun test specs`);
  console.log(`Max files: ${MAX_FILES}`);
  console.log(`Pattern: ${PATTERN}`);
  console.log(``);
  
  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }
  
  // Find test files
  console.log(`Searching for test files...`);
  const testFiles = await findTestFiles(SPECS_DIR, PATTERN);
  console.log(`Found ${testFiles.length} test files`);
  
  // Categorize tests
  const categories = categorizeTests(testFiles);
  console.log(`Organized into ${categories.size} categories:`);
  for (const [category, files] of categories) {
    console.log(`  - ${category}: ${files.length} files`);
  }
  console.log(``);
  
  // Generate test files for each category
  for (const [category, files] of categories) {
    await generateCategoryTestFile(category, files);
  }
  
  // Generate package.json for the test runner
  const packageJson = {
    name: "guillotine-spec-tests",
    version: "1.0.0",
    type: "module",
    scripts: {
      test: "bun test",
      "test:watch": "bun test --watch",
      generate: "bun run generate-specs.ts",
    },
    devDependencies: {
      "@types/bun": "latest",
    },
  };
  
  await writeFile(
    join(dirname(OUTPUT_DIR), "package.json"), 
    JSON.stringify(packageJson, null, 2)
  );
  
  console.log(`\n✅ Test generation complete!`);
  console.log(`Run tests with: cd ${dirname(OUTPUT_DIR)} && bun test`);
}

main().catch(console.error);