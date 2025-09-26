import { describe, test, expect } from "bun:test";
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


describe("osaka tests", () => {
  describe("vectors", () => {
    test("0", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("1", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("2", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("3", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("4", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("5", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("6", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("7", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("8", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("9", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("10", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("11", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("12", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("13", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("14", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("15", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("16", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("17", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("18", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("19", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("20", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("21", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("22", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("23", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("24", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("25", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("26", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("27", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("28", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("29", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("30", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("31", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("32", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("33", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("34", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("35", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("36", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("37", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("38", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("39", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("40", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("41", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("42", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("43", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("44", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("45", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/vectors.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
  });

  describe("legacy", () => {
    test("0", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("1", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("2", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("3", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("4", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("5", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("6", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("7", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("8", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("9", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("10", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("11", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("12", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("13", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("14", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("15", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("16", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("17", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("18", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("19", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("20", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("21", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("22", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("23", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("24", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("25", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("26", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("27", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("28", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("29", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("30", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("31", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7883_modexp_gas_increase/vector/legacy.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
  });

  describe("secp256r1_test", () => {
    test("0", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("1", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("2", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("3", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("4", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("5", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("6", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("7", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("8", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("9", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("10", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("11", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("12", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("13", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("14", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("15", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("16", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("17", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("18", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("19", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("20", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("21", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("22", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("23", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("24", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("25", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("26", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("27", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("28", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("29", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("30", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("31", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("32", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("33", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("34", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("35", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("36", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("37", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("38", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("39", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("40", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("41", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("42", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("43", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("44", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("45", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("46", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("47", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("48", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("49", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("50", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("51", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("52", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("53", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("54", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("55", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("56", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("57", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("58", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("59", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("60", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("61", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("62", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("63", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("64", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("65", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("66", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("67", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("68", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("69", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("70", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("71", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("72", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("73", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("74", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("75", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("76", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("77", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("78", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("79", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("80", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("81", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("82", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("83", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("84", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("85", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("86", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("87", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("88", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("89", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("90", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("91", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("92", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("93", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("94", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("95", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("96", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("97", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("98", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("99", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("100", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("101", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("102", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("103", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("104", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("105", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("106", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("107", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("108", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("109", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("110", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("111", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("112", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("113", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("114", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("115", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("116", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("117", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("118", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("119", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("120", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("121", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("122", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("123", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("124", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("125", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("126", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("127", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("128", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("129", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("130", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("131", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("132", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("133", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("134", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("135", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("136", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("137", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("138", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("139", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("140", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("141", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("142", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("143", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("144", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("145", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("146", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("147", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("148", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("149", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("150", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("151", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("152", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("153", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("154", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("155", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("156", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("157", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("158", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("159", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("160", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("161", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("162", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("163", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("164", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("165", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("166", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("167", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("168", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("169", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("170", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("171", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("172", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("173", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("174", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("175", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("176", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("177", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("178", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("179", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("180", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("181", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("182", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("183", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("184", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("185", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("186", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("187", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("188", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("189", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("190", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("191", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("192", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("193", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("194", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("195", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("196", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("197", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("198", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("199", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("200", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("201", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("202", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("203", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("204", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("205", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("206", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("207", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("208", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("209", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("210", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("211", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("212", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("213", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("214", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("215", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("216", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("217", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("218", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("219", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("220", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("221", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("222", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("223", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("224", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("225", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("226", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("227", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("228", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("229", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("230", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("231", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("232", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("233", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("234", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("235", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("236", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("237", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("238", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("239", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("240", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("241", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("242", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("243", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("244", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("245", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("246", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("247", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("248", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("249", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("250", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("251", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("252", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("253", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("254", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("255", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("256", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("257", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("258", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("259", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("260", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("261", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("262", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("263", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("264", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("265", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("266", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("267", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("268", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("269", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("270", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("271", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("272", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("273", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("274", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("275", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("276", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("277", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("278", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("279", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("280", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("281", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("282", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("283", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("284", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("285", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("286", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("287", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("288", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("289", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("290", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("291", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("292", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
    test("293", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/osaka/eip7951_p256verify_precompiles/vectors/secp256r1_test.json";
      
      const evm = createDefaultEVM();
      
      // No post-state expectations to verify
      expect(result0).toBeDefined();
      
      evm.destroy();
    });
  
  });

});

// Generated 372 tests, skipped 0