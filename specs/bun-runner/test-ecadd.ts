import { describe, test, expect } from "bun:test";
import fs from "fs";
import { executeTestCase } from './executor';

const testPath = "../execution-specs/tests/eest/static/state_tests/stZeroKnowledge2/ecadd_0-0_0-0_25000_64Filler.json";
const testData = JSON.parse(fs.readFileSync(testPath, "utf-8"));

describe("ecadd precompile test", () => {
  const testName = Object.keys(testData)[0];
  const spec = testData[testName];
  
  test(testName, () => {
    const result = executeTestCase(spec);
    
    // Log the result for debugging
    console.log("Test result:", {
      success: result.success,
      gasUsed: result.gasUsed,
      error: result.error
    });
    
    expect(result.success).toBe(true);
  });
});