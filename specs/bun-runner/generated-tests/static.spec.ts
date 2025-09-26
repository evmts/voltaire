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


describe("static tests", () => {
  describe("ecadd_0-0_0-0_25000_64Filler", () => {
    test("ecadd_0-0_0-0_25000_64", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/static/state_tests/stZeroKnowledge2/ecadd_0-0_0-0_25000_64Filler.json";
      
      // Setup block environment
      const blockInfo: BlockInfo = {
        number: BigInt("0x01"),
        timestamp: BigInt("1000"),
        gasLimit: BigInt("0x5f5e100"),
        coinbase: "0x3535353535353535353535353535353535353535",
        baseFee: 0n,
        chainId: 1n,
        difficulty: BigInt("0x020000"),
      };
  
      const evm = new GuillotineEVM(blockInfo);
      
      // Setup pre-state
      evm.setBalance("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", BigInt("1000000000000000000"));
      evm.setCode("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000001", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000001", hexToBytes("0x"));
      evm.setBalance("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", BigInt("1000000000000000000"));
      evm.setCode("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", hexToBytes("0x"));
      evm.setBalance("0xc305c901078781c232a2a521c2af7980f8385ee9", BigInt("0"));
      evm.setCode("0xc305c901078781c232a2a521c2af7980f8385ee9", hexToBytes("0x600035601c52740100000000000000000000000000000000000000006020526fffffffffffffffffffffffffffffffff6040527fffffffffffffffffffffffffffffffff000000000000000000000000000000016060527402540be3fffffffffffffffffffffffffdabf41c006080527ffffffffffffffffffffffffdabf41c00000000000000000000000002540be40060a0526330c8d1da600051141561012b5760c06004356004013511151558576004356004013560200160043560040161014037604061026061014051610160600060066305f5e0fff11558576040610240526102406060806102c0828460006004601bf15050506102c08051602082012090506000556102c060206020820352604081510160206001820306601f820103905060208203f350005b"));
      evm.setBalance("0x0000000000000000000000000000000000000005", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000005", hexToBytes("0x"));
      evm.setBalance("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", BigInt("1000000000000000000"));
      evm.setCode("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000000", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000000", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000003", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000003", hexToBytes("0x"));
      evm.setBalance("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", BigInt("999999999999028346"));
      evm.setCode("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000006", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000006", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000007", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000007", hexToBytes("0x"));
      evm.setBalance("0x598443f1880ef585b21f1d7585bd0577402861e5", BigInt("1000000000000000000"));
      evm.setCode("0x598443f1880ef585b21f1d7585bd0577402861e5", hexToBytes("0x"));
      evm.setBalance("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", BigInt("1000000000000000000"));
      evm.setCode("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000004", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000004", hexToBytes("0x"));
      evm.setBalance("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", BigInt("1000000000000000000"));
      evm.setCode("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", hexToBytes("0x"));
      evm.setBalance("0x3535353535353535353535353535353535353535", BigInt("971654"));
      evm.setCode("0x3535353535353535353535353535353535353535", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000002", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000002", hexToBytes("0x"));
      evm.setBalance("0x77db2bebba79db42a978f896968f4afce746ea1f", BigInt("1000000000000000000"));
      evm.setCode("0x77db2bebba79db42a978f896968f4afce746ea1f", hexToBytes("0x"));
      evm.setBalance("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", BigInt("1000000000000000000"));
      evm.setCode("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", hexToBytes("0x"));
      evm.setBalance("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", BigInt("1000000000000000000"));
      evm.setCode("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", hexToBytes("0x"));
      
      // Execute transaction(s)
      const params0: CallParams = {
        caller: "0x0000000000000000000000000000000000000000",
        to: "0xc305c901078781c232a2a521c2af7980f8385ee9",
        value: BigInt("0x00"),
        input: hexToBytes("0x30c8d1da0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
        gas: BigInt("0xb740"),
        callType: CallType.CALL,
      };
      
      const result0 = evm.call(params0);
      
      // Verify expect-format expectations
      const stateDump = evm.dumpState();
      
      // Check account 0x24143873e0e0815fdcbcffdbe09c979cbf9ad013
      {
        const account = stateDump.accounts.get("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000001
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000001");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d
      {
        const account = stateDump.accounts.get("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xc305c901078781c232a2a521c2af7980f8385ee9
      {
        const account = stateDump.accounts.get("0xc305c901078781c232a2a521c2af7980f8385ee9");
        expect(account?.balance || 0n).toBe(BigInt("0"));
        expect(account?.nonce || 0n).toBe(BigInt("1"));
        expect(account?.storage.get("0x0000000000000000000000000000000000000000000000000000000000000000") || 0n).toBe(BigInt("0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5"));
      }
      // Check account 0x0000000000000000000000000000000000000005
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000005");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224
      {
        const account = stateDump.accounts.get("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000000
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000000");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000003
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000003");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1
      {
        const account = stateDump.accounts.get("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1");
        expect(account?.nonce || 0n).toBe(BigInt("21"));
      }
      // Check account 0x0000000000000000000000000000000000000006
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000006");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000007
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000007");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x598443f1880ef585b21f1d7585bd0577402861e5
      {
        const account = stateDump.accounts.get("0x598443f1880ef585b21f1d7585bd0577402861e5");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e
      {
        const account = stateDump.accounts.get("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000004
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000004");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xe0fc04fa2d34a66b779fd5cee748268032a146c0
      {
        const account = stateDump.accounts.get("0xe0fc04fa2d34a66b779fd5cee748268032a146c0");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x3535353535353535353535353535353535353535
      {
        const account = stateDump.accounts.get("0x3535353535353535353535353535353535353535");
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000002
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000002");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x77db2bebba79db42a978f896968f4afce746ea1f
      {
        const account = stateDump.accounts.get("0x77db2bebba79db42a978f896968f4afce746ea1f");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b
      {
        const account = stateDump.accounts.get("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c
      {
        const account = stateDump.accounts.get("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      
      evm.destroy();
    });
  
  });

  describe("ecadd_0-0_1-3_25000_128Filler", () => {
    test("ecadd_0-0_1-3_25000_128", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/static/state_tests/stZeroKnowledge2/ecadd_0-0_1-3_25000_128Filler.json";
      
      // Setup block environment
      const blockInfo: BlockInfo = {
        number: BigInt("0x01"),
        timestamp: BigInt("1000"),
        gasLimit: BigInt("0x5f5e100"),
        coinbase: "0x3535353535353535353535353535353535353535",
        baseFee: 0n,
        chainId: 1n,
        difficulty: BigInt("0x020000"),
      };
  
      const evm = new GuillotineEVM(blockInfo);
      
      // Setup pre-state
      evm.setBalance("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", BigInt("1000000000000000000"));
      evm.setCode("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000001", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000001", hexToBytes("0x"));
      evm.setBalance("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", BigInt("1000000000000000000"));
      evm.setCode("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", hexToBytes("0x"));
      evm.setBalance("0xc305c901078781c232a2a521c2af7980f8385ee9", BigInt("0"));
      evm.setCode("0xc305c901078781c232a2a521c2af7980f8385ee9", hexToBytes("0x600035601c52740100000000000000000000000000000000000000006020526fffffffffffffffffffffffffffffffff6040527fffffffffffffffffffffffffffffffff000000000000000000000000000000016060527402540be3fffffffffffffffffffffffffdabf41c006080527ffffffffffffffffffffffffdabf41c00000000000000000000000002540be40060a0526330c8d1da600051141561012b5760c06004356004013511151558576004356004013560200160043560040161014037604061026061014051610160600060066305f5e0fff11558576040610240526102406060806102c0828460006004601bf15050506102c08051602082012090506000556102c060206020820352604081510160206001820306601f820103905060208203f350005b"));
      evm.setBalance("0x0000000000000000000000000000000000000005", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000005", hexToBytes("0x"));
      evm.setBalance("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", BigInt("1000000000000000000"));
      evm.setCode("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000000", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000000", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000003", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000003", hexToBytes("0x"));
      evm.setBalance("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", BigInt("999999999998626359"));
      evm.setCode("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000006", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000006", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000007", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000007", hexToBytes("0x"));
      evm.setBalance("0x598443f1880ef585b21f1d7585bd0577402861e5", BigInt("1000000000000000000"));
      evm.setCode("0x598443f1880ef585b21f1d7585bd0577402861e5", hexToBytes("0x"));
      evm.setBalance("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", BigInt("1000000000000000000"));
      evm.setCode("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000004", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000004", hexToBytes("0x"));
      evm.setBalance("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", BigInt("1000000000000000000"));
      evm.setCode("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", hexToBytes("0x"));
      evm.setBalance("0x3535353535353535353535353535353535353535", BigInt("1373641"));
      evm.setCode("0x3535353535353535353535353535353535353535", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000002", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000002", hexToBytes("0x"));
      evm.setBalance("0x77db2bebba79db42a978f896968f4afce746ea1f", BigInt("1000000000000000000"));
      evm.setCode("0x77db2bebba79db42a978f896968f4afce746ea1f", hexToBytes("0x"));
      evm.setBalance("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", BigInt("1000000000000000000"));
      evm.setCode("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", hexToBytes("0x"));
      evm.setBalance("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", BigInt("1000000000000000000"));
      evm.setCode("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", hexToBytes("0x"));
      
      // Execute transaction(s)
      const params0: CallParams = {
        caller: "0x0000000000000000000000000000000000000000",
        to: "0xc305c901078781c232a2a521c2af7980f8385ee9",
        value: BigInt("0x00"),
        input: hexToBytes("0x30c8d1da000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003"),
        gas: BigInt("0xb8c0"),
        callType: CallType.CALL,
      };
      
      const result0 = evm.call(params0);
      
      // Verify expect-format expectations
      const stateDump = evm.dumpState();
      
      // Check account 0x24143873e0e0815fdcbcffdbe09c979cbf9ad013
      {
        const account = stateDump.accounts.get("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000001
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000001");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d
      {
        const account = stateDump.accounts.get("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xc305c901078781c232a2a521c2af7980f8385ee9
      {
        const account = stateDump.accounts.get("0xc305c901078781c232a2a521c2af7980f8385ee9");
        expect(account?.balance || 0n).toBe(BigInt("0"));
        expect(account?.nonce || 0n).toBe(BigInt("1"));
        expect(account?.storage.get("0x0000000000000000000000000000000000000000000000000000000000000000") || 0n).toBe(BigInt("0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5"));
      }
      // Check account 0x0000000000000000000000000000000000000005
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000005");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224
      {
        const account = stateDump.accounts.get("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000000
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000000");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000003
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000003");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1
      {
        const account = stateDump.accounts.get("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1");
        expect(account?.nonce || 0n).toBe(BigInt("34"));
      }
      // Check account 0x0000000000000000000000000000000000000006
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000006");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000007
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000007");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x598443f1880ef585b21f1d7585bd0577402861e5
      {
        const account = stateDump.accounts.get("0x598443f1880ef585b21f1d7585bd0577402861e5");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e
      {
        const account = stateDump.accounts.get("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000004
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000004");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xe0fc04fa2d34a66b779fd5cee748268032a146c0
      {
        const account = stateDump.accounts.get("0xe0fc04fa2d34a66b779fd5cee748268032a146c0");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x3535353535353535353535353535353535353535
      {
        const account = stateDump.accounts.get("0x3535353535353535353535353535353535353535");
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000002
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000002");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x77db2bebba79db42a978f896968f4afce746ea1f
      {
        const account = stateDump.accounts.get("0x77db2bebba79db42a978f896968f4afce746ea1f");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b
      {
        const account = stateDump.accounts.get("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c
      {
        const account = stateDump.accounts.get("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      
      evm.destroy();
    });
  
  });

  describe("ecadd_0-0_0-0_21000_192Filler", () => {
    test("ecadd_0-0_0-0_21000_192", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/static/state_tests/stZeroKnowledge2/ecadd_0-0_0-0_21000_192Filler.json";
      
      // Setup block environment
      const blockInfo: BlockInfo = {
        number: BigInt("0x01"),
        timestamp: BigInt("1000"),
        gasLimit: BigInt("0x5f5e100"),
        coinbase: "0x3535353535353535353535353535353535353535",
        baseFee: 0n,
        chainId: 1n,
        difficulty: BigInt("0x020000"),
      };
  
      const evm = new GuillotineEVM(blockInfo);
      
      // Setup pre-state
      evm.setBalance("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", BigInt("1000000000000000000"));
      evm.setCode("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000001", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000001", hexToBytes("0x"));
      evm.setBalance("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", BigInt("1000000000000000000"));
      evm.setCode("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", hexToBytes("0x"));
      evm.setBalance("0xc305c901078781c232a2a521c2af7980f8385ee9", BigInt("0"));
      evm.setCode("0xc305c901078781c232a2a521c2af7980f8385ee9", hexToBytes("0x600035601c52740100000000000000000000000000000000000000006020526fffffffffffffffffffffffffffffffff6040527fffffffffffffffffffffffffffffffff000000000000000000000000000000016060527402540be3fffffffffffffffffffffffffdabf41c006080527ffffffffffffffffffffffffdabf41c00000000000000000000000002540be40060a0526330c8d1da600051141561012b5760c06004356004013511151558576004356004013560200160043560040161014037604061026061014051610160600060066305f5e0fff11558576040610240526102406060806102c0828460006004601bf15050506102c08051602082012090506000556102c060206020820352604081510160206001820306601f820103905060208203f350005b"));
      evm.setBalance("0x0000000000000000000000000000000000000005", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000005", hexToBytes("0x"));
      evm.setBalance("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", BigInt("1000000000000000000"));
      evm.setCode("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000000", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000000", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000003", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000003", hexToBytes("0x"));
      evm.setBalance("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", BigInt("999999999999696722"));
      evm.setCode("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000006", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000006", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000007", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000007", hexToBytes("0x"));
      evm.setBalance("0x598443f1880ef585b21f1d7585bd0577402861e5", BigInt("1000000000000000000"));
      evm.setCode("0x598443f1880ef585b21f1d7585bd0577402861e5", hexToBytes("0x"));
      evm.setBalance("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", BigInt("1000000000000000000"));
      evm.setCode("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000004", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000004", hexToBytes("0x"));
      evm.setBalance("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", BigInt("1000000000000000000"));
      evm.setCode("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", hexToBytes("0x"));
      evm.setBalance("0x3535353535353535353535353535353535353535", BigInt("303278"));
      evm.setCode("0x3535353535353535353535353535353535353535", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000002", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000002", hexToBytes("0x"));
      evm.setBalance("0x77db2bebba79db42a978f896968f4afce746ea1f", BigInt("1000000000000000000"));
      evm.setCode("0x77db2bebba79db42a978f896968f4afce746ea1f", hexToBytes("0x"));
      evm.setBalance("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", BigInt("1000000000000000000"));
      evm.setCode("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", hexToBytes("0x"));
      evm.setBalance("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", BigInt("1000000000000000000"));
      evm.setCode("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", hexToBytes("0x"));
      
      // Execute transaction(s)
      const params0: CallParams = {
        caller: "0x0000000000000000000000000000000000000000",
        to: "0xc305c901078781c232a2a521c2af7980f8385ee9",
        value: BigInt("0x00"),
        input: hexToBytes("0x30c8d1da000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
        gas: BigInt("0xa9a0"),
        callType: CallType.CALL,
      };
      
      const result0 = evm.call(params0);
      
      // Verify expect-format expectations
      const stateDump = evm.dumpState();
      
      // Check account 0x24143873e0e0815fdcbcffdbe09c979cbf9ad013
      {
        const account = stateDump.accounts.get("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000001
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000001");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d
      {
        const account = stateDump.accounts.get("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xc305c901078781c232a2a521c2af7980f8385ee9
      {
        const account = stateDump.accounts.get("0xc305c901078781c232a2a521c2af7980f8385ee9");
        expect(account?.balance || 0n).toBe(BigInt("0"));
        expect(account?.nonce || 0n).toBe(BigInt("1"));
      }
      // Check account 0x0000000000000000000000000000000000000005
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000005");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224
      {
        const account = stateDump.accounts.get("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000000
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000000");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000003
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000003");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1
      {
        const account = stateDump.accounts.get("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1");
        expect(account?.nonce || 0n).toBe(BigInt("6"));
      }
      // Check account 0x0000000000000000000000000000000000000006
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000006");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000007
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000007");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x598443f1880ef585b21f1d7585bd0577402861e5
      {
        const account = stateDump.accounts.get("0x598443f1880ef585b21f1d7585bd0577402861e5");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e
      {
        const account = stateDump.accounts.get("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000004
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000004");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xe0fc04fa2d34a66b779fd5cee748268032a146c0
      {
        const account = stateDump.accounts.get("0xe0fc04fa2d34a66b779fd5cee748268032a146c0");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x3535353535353535353535353535353535353535
      {
        const account = stateDump.accounts.get("0x3535353535353535353535353535353535353535");
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000002
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000002");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x77db2bebba79db42a978f896968f4afce746ea1f
      {
        const account = stateDump.accounts.get("0x77db2bebba79db42a978f896968f4afce746ea1f");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b
      {
        const account = stateDump.accounts.get("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c
      {
        const account = stateDump.accounts.get("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      
      evm.destroy();
    });
  
  });

  describe("ecadd_1-3_0-0_25000_80_ParisFiller", () => {
    test("ecadd_1-3_0-0_25000_80_Paris", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/static/state_tests/stZeroKnowledge2/ecadd_1-3_0-0_25000_80_ParisFiller.json";
      
      // Setup block environment
      const blockInfo: BlockInfo = {
        number: BigInt("0x01"),
        timestamp: BigInt("1000"),
        gasLimit: BigInt("0x5f5e100"),
        coinbase: "0x3535353535353535353535353535353535353535",
        baseFee: 0n,
        chainId: 1n,
        difficulty: BigInt("0x020000"),
      };
  
      const evm = new GuillotineEVM(blockInfo);
      
      // Setup pre-state
      evm.setBalance("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", BigInt("1000000000000000000"));
      evm.setCode("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000001", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000001", hexToBytes("0x"));
      evm.setBalance("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", BigInt("1000000000000000000"));
      evm.setCode("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", hexToBytes("0x"));
      evm.setBalance("0xc305c901078781c232a2a521c2af7980f8385ee9", BigInt("0"));
      evm.setCode("0xc305c901078781c232a2a521c2af7980f8385ee9", hexToBytes("0x600035601c52740100000000000000000000000000000000000000006020526fffffffffffffffffffffffffffffffff6040527fffffffffffffffffffffffffffffffff000000000000000000000000000000016060527402540be3fffffffffffffffffffffffffdabf41c006080527ffffffffffffffffffffffffdabf41c00000000000000000000000002540be40060a0526330c8d1da600051141561012b5760c06004356004013511151558576004356004013560200160043560040161014037604061026061014051610160600060066305f5e0fff11558576040610240526102406060806102c0828460006004601bf15050506102c08051602082012090506000556102c060206020820352604081510160206001820306601f820103905060208203f350005b"));
      evm.setBalance("0x0000000000000000000000000000000000000005", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000005", hexToBytes("0x"));
      evm.setBalance("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", BigInt("1000000000000000000"));
      evm.setCode("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000000", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000000", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000003", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000003", hexToBytes("0x"));
      evm.setBalance("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", BigInt("999999999998579063"));
      evm.setCode("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000006", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000006", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000007", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000007", hexToBytes("0x"));
      evm.setBalance("0x598443f1880ef585b21f1d7585bd0577402861e5", BigInt("1000000000000000000"));
      evm.setCode("0x598443f1880ef585b21f1d7585bd0577402861e5", hexToBytes("0x"));
      evm.setBalance("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", BigInt("1000000000000000000"));
      evm.setCode("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000004", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000004", hexToBytes("0x"));
      evm.setBalance("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", BigInt("1000000000000000000"));
      evm.setCode("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", hexToBytes("0x"));
      evm.setBalance("0x3535353535353535353535353535353535353535", BigInt("10"));
      evm.setCode("0x3535353535353535353535353535353535353535", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000002", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000002", hexToBytes("0x"));
      evm.setBalance("0x77db2bebba79db42a978f896968f4afce746ea1f", BigInt("1000000000000000000"));
      evm.setCode("0x77db2bebba79db42a978f896968f4afce746ea1f", hexToBytes("0x"));
      evm.setBalance("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", BigInt("1000000000000000000"));
      evm.setCode("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", hexToBytes("0x"));
      evm.setBalance("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", BigInt("1000000000000000000"));
      evm.setCode("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", hexToBytes("0x"));
      
      // Execute transaction(s)
      const params0: CallParams = {
        caller: "0x0000000000000000000000000000000000000000",
        to: "0xc305c901078781c232a2a521c2af7980f8385ee9",
        value: BigInt("0x00"),
        input: hexToBytes("0x30c8d1da00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000"),
        gas: BigInt("0xb840"),
        callType: CallType.CALL,
      };
      
      const result0 = evm.call(params0);
      
      // Verify expect-format expectations
      const stateDump = evm.dumpState();
      
      // Check account 0x24143873e0e0815fdcbcffdbe09c979cbf9ad013
      {
        const account = stateDump.accounts.get("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000001
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000001");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d
      {
        const account = stateDump.accounts.get("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xc305c901078781c232a2a521c2af7980f8385ee9
      {
        const account = stateDump.accounts.get("0xc305c901078781c232a2a521c2af7980f8385ee9");
        expect(account?.balance || 0n).toBe(BigInt("0"));
        expect(account?.nonce || 0n).toBe(BigInt("1"));
        expect(account?.storage.get("0x0000000000000000000000000000000000000000000000000000000000000000") || 0n).toBe(BigInt("0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5"));
      }
      // Check account 0x0000000000000000000000000000000000000005
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000005");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224
      {
        const account = stateDump.accounts.get("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000000
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000000");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000003
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000003");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1
      {
        const account = stateDump.accounts.get("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1");
        expect(account?.nonce || 0n).toBe(BigInt("35"));
      }
      // Check account 0x0000000000000000000000000000000000000006
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000006");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000007
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000007");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x598443f1880ef585b21f1d7585bd0577402861e5
      {
        const account = stateDump.accounts.get("0x598443f1880ef585b21f1d7585bd0577402861e5");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e
      {
        const account = stateDump.accounts.get("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000004
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000004");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xe0fc04fa2d34a66b779fd5cee748268032a146c0
      {
        const account = stateDump.accounts.get("0xe0fc04fa2d34a66b779fd5cee748268032a146c0");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000002
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000002");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x77db2bebba79db42a978f896968f4afce746ea1f
      {
        const account = stateDump.accounts.get("0x77db2bebba79db42a978f896968f4afce746ea1f");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b
      {
        const account = stateDump.accounts.get("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c
      {
        const account = stateDump.accounts.get("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      
      evm.destroy();
    });
  
  });

  describe("ecadd_1-2_0-0_21000_128Filler", () => {
    test("ecadd_1-2_0-0_21000_128", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/static/state_tests/stZeroKnowledge2/ecadd_1-2_0-0_21000_128Filler.json";
      
      // Setup block environment
      const blockInfo: BlockInfo = {
        number: BigInt("0x01"),
        timestamp: BigInt("1000"),
        gasLimit: BigInt("0x5f5e100"),
        coinbase: "0x3535353535353535353535353535353535353535",
        baseFee: 0n,
        chainId: 1n,
        difficulty: BigInt("0x020000"),
      };
  
      const evm = new GuillotineEVM(blockInfo);
      
      // Setup pre-state
      evm.setBalance("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", BigInt("1000000000000000000"));
      evm.setCode("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000001", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000001", hexToBytes("0x"));
      evm.setBalance("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", BigInt("1000000000000000000"));
      evm.setCode("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", hexToBytes("0x"));
      evm.setBalance("0xc305c901078781c232a2a521c2af7980f8385ee9", BigInt("0"));
      evm.setCode("0xc305c901078781c232a2a521c2af7980f8385ee9", hexToBytes("0x600035601c52740100000000000000000000000000000000000000006020526fffffffffffffffffffffffffffffffff6040527fffffffffffffffffffffffffffffffff000000000000000000000000000000016060527402540be3fffffffffffffffffffffffffdabf41c006080527ffffffffffffffffffffffffdabf41c00000000000000000000000002540be40060a0526330c8d1da600051141561012b5760c06004356004013511151558576004356004013560200160043560040161014037604061026061014051610160600060066305f5e0fff11558576040610240526102406060806102c0828460006004601bf15050506102c08051602082012090506000556102c060206020820352604081510160206001820306601f820103905060208203f350005b"));
      evm.setBalance("0x0000000000000000000000000000000000000005", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000005", hexToBytes("0x"));
      evm.setBalance("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", BigInt("1000000000000000000"));
      evm.setCode("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000000", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000000", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000003", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000003", hexToBytes("0x"));
      evm.setBalance("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", BigInt("999999999999523410"));
      evm.setCode("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000006", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000006", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000007", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000007", hexToBytes("0x"));
      evm.setBalance("0x598443f1880ef585b21f1d7585bd0577402861e5", BigInt("1000000000000000000"));
      evm.setCode("0x598443f1880ef585b21f1d7585bd0577402861e5", hexToBytes("0x"));
      evm.setBalance("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", BigInt("1000000000000000000"));
      evm.setCode("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000004", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000004", hexToBytes("0x"));
      evm.setBalance("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", BigInt("1000000000000000000"));
      evm.setCode("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", hexToBytes("0x"));
      evm.setBalance("0x3535353535353535353535353535353535353535", BigInt("476590"));
      evm.setCode("0x3535353535353535353535353535353535353535", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000002", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000002", hexToBytes("0x"));
      evm.setBalance("0x77db2bebba79db42a978f896968f4afce746ea1f", BigInt("1000000000000000000"));
      evm.setCode("0x77db2bebba79db42a978f896968f4afce746ea1f", hexToBytes("0x"));
      evm.setBalance("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", BigInt("1000000000000000000"));
      evm.setCode("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", hexToBytes("0x"));
      evm.setBalance("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", BigInt("1000000000000000000"));
      evm.setCode("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", hexToBytes("0x"));
      
      // Execute transaction(s)
      const params0: CallParams = {
        caller: "0x0000000000000000000000000000000000000000",
        to: "0xc305c901078781c232a2a521c2af7980f8385ee9",
        value: BigInt("0x00"),
        input: hexToBytes("0x30c8d1da000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
        gas: BigInt("0xa920"),
        callType: CallType.CALL,
      };
      
      const result0 = evm.call(params0);
      
      // Verify expect-format expectations
      const stateDump = evm.dumpState();
      
      // Check account 0x24143873e0e0815fdcbcffdbe09c979cbf9ad013
      {
        const account = stateDump.accounts.get("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000001
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000001");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d
      {
        const account = stateDump.accounts.get("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xc305c901078781c232a2a521c2af7980f8385ee9
      {
        const account = stateDump.accounts.get("0xc305c901078781c232a2a521c2af7980f8385ee9");
        expect(account?.balance || 0n).toBe(BigInt("0"));
        expect(account?.nonce || 0n).toBe(BigInt("1"));
      }
      // Check account 0x0000000000000000000000000000000000000005
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000005");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224
      {
        const account = stateDump.accounts.get("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000000
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000000");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000003
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000003");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1
      {
        const account = stateDump.accounts.get("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1");
        expect(account?.nonce || 0n).toBe(BigInt("10"));
      }
      // Check account 0x0000000000000000000000000000000000000006
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000006");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000007
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000007");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x598443f1880ef585b21f1d7585bd0577402861e5
      {
        const account = stateDump.accounts.get("0x598443f1880ef585b21f1d7585bd0577402861e5");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e
      {
        const account = stateDump.accounts.get("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000004
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000004");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xe0fc04fa2d34a66b779fd5cee748268032a146c0
      {
        const account = stateDump.accounts.get("0xe0fc04fa2d34a66b779fd5cee748268032a146c0");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x3535353535353535353535353535353535353535
      {
        const account = stateDump.accounts.get("0x3535353535353535353535353535353535353535");
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000002
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000002");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x77db2bebba79db42a978f896968f4afce746ea1f
      {
        const account = stateDump.accounts.get("0x77db2bebba79db42a978f896968f4afce746ea1f");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b
      {
        const account = stateDump.accounts.get("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c
      {
        const account = stateDump.accounts.get("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      
      evm.destroy();
    });
  
  });

  describe("ecadd_1145-3932_1145-4651_25000_192Filler", () => {
    test("ecadd_1145-3932_1145-4651_25000_192", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/static/state_tests/stZeroKnowledge2/ecadd_1145-3932_1145-4651_25000_192Filler.json";
      
      // Setup block environment
      const blockInfo: BlockInfo = {
        number: BigInt("0x01"),
        timestamp: BigInt("1000"),
        gasLimit: BigInt("0x5f5e100"),
        coinbase: "0x3535353535353535353535353535353535353535",
        baseFee: 0n,
        chainId: 1n,
        difficulty: BigInt("0x020000"),
      };
  
      const evm = new GuillotineEVM(blockInfo);
      
      // Setup pre-state
      evm.setBalance("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", BigInt("1000000000000000000"));
      evm.setCode("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000001", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000001", hexToBytes("0x"));
      evm.setBalance("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", BigInt("1000000000000000000"));
      evm.setCode("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", hexToBytes("0x"));
      evm.setBalance("0xc305c901078781c232a2a521c2af7980f8385ee9", BigInt("0"));
      evm.setCode("0xc305c901078781c232a2a521c2af7980f8385ee9", hexToBytes("0x600035601c52740100000000000000000000000000000000000000006020526fffffffffffffffffffffffffffffffff6040527fffffffffffffffffffffffffffffffff000000000000000000000000000000016060527402540be3fffffffffffffffffffffffffdabf41c006080527ffffffffffffffffffffffffdabf41c00000000000000000000000002540be40060a0526330c8d1da600051141561012b5760c06004356004013511151558576004356004013560200160043560040161014037604061026061014051610160600060066305f5e0fff11558576040610240526102406060806102c0828460006004601bf15050506102c08051602082012090506000556102c060206020820352604081510160206001820306601f820103905060208203f350005b"));
      evm.setBalance("0x0000000000000000000000000000000000000005", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000005", hexToBytes("0x"));
      evm.setBalance("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", BigInt("1000000000000000000"));
      evm.setCode("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000000", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000000", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000003", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000003", hexToBytes("0x"));
      evm.setBalance("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", BigInt("999999999998664381"));
      evm.setCode("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000006", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000006", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000007", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000007", hexToBytes("0x"));
      evm.setBalance("0x598443f1880ef585b21f1d7585bd0577402861e5", BigInt("1000000000000000000"));
      evm.setCode("0x598443f1880ef585b21f1d7585bd0577402861e5", hexToBytes("0x"));
      evm.setBalance("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", BigInt("1000000000000000000"));
      evm.setCode("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000004", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000004", hexToBytes("0x"));
      evm.setBalance("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", BigInt("1000000000000000000"));
      evm.setCode("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", hexToBytes("0x"));
      evm.setBalance("0x3535353535353535353535353535353535353535", BigInt("1335619"));
      evm.setCode("0x3535353535353535353535353535353535353535", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000002", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000002", hexToBytes("0x"));
      evm.setBalance("0x77db2bebba79db42a978f896968f4afce746ea1f", BigInt("1000000000000000000"));
      evm.setCode("0x77db2bebba79db42a978f896968f4afce746ea1f", hexToBytes("0x"));
      evm.setBalance("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", BigInt("1000000000000000000"));
      evm.setCode("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", hexToBytes("0x"));
      evm.setBalance("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", BigInt("1000000000000000000"));
      evm.setCode("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", hexToBytes("0x"));
      
      // Execute transaction(s)
      const params0: CallParams = {
        caller: "0x0000000000000000000000000000000000000000",
        to: "0xc305c901078781c232a2a521c2af7980f8385ee9",
        value: BigInt("0x00"),
        input: hexToBytes("0x30c8d1da000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c017c139df0efee0f766bc0204762b774362e4ded88953a39ce849a8a7fa163fa901e0559bacb160664764a357af8a9fe70baa9258e0b959273ffc5718c6d4cc7c17c139df0efee0f766bc0204762b774362e4ded88953a39ce849a8a7fa163fa92e83f8d734803fc370eba25ed1f6b8768bd6d83887b87165fc2434fe11a830cb00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
        gas: BigInt("0xd940"),
        callType: CallType.CALL,
      };
      
      const result0 = evm.call(params0);
      
      // Verify expect-format expectations
      const stateDump = evm.dumpState();
      
      // Check account 0x24143873e0e0815fdcbcffdbe09c979cbf9ad013
      {
        const account = stateDump.accounts.get("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000001
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000001");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d
      {
        const account = stateDump.accounts.get("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xc305c901078781c232a2a521c2af7980f8385ee9
      {
        const account = stateDump.accounts.get("0xc305c901078781c232a2a521c2af7980f8385ee9");
        expect(account?.balance || 0n).toBe(BigInt("0"));
        expect(account?.nonce || 0n).toBe(BigInt("1"));
        expect(account?.storage.get("0x0000000000000000000000000000000000000000000000000000000000000000") || 0n).toBe(BigInt("0xad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5"));
      }
      // Check account 0x0000000000000000000000000000000000000005
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000005");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224
      {
        const account = stateDump.accounts.get("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000000
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000000");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000003
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000003");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1
      {
        const account = stateDump.accounts.get("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1");
        expect(account?.nonce || 0n).toBe(BigInt("33"));
      }
      // Check account 0x0000000000000000000000000000000000000006
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000006");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000007
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000007");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x598443f1880ef585b21f1d7585bd0577402861e5
      {
        const account = stateDump.accounts.get("0x598443f1880ef585b21f1d7585bd0577402861e5");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e
      {
        const account = stateDump.accounts.get("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000004
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000004");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xe0fc04fa2d34a66b779fd5cee748268032a146c0
      {
        const account = stateDump.accounts.get("0xe0fc04fa2d34a66b779fd5cee748268032a146c0");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x3535353535353535353535353535353535353535
      {
        const account = stateDump.accounts.get("0x3535353535353535353535353535353535353535");
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000002
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000002");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x77db2bebba79db42a978f896968f4afce746ea1f
      {
        const account = stateDump.accounts.get("0x77db2bebba79db42a978f896968f4afce746ea1f");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b
      {
        const account = stateDump.accounts.get("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c
      {
        const account = stateDump.accounts.get("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      
      evm.destroy();
    });
  
  });

  describe("ecadd_1-2_0-0_21000_64Filler", () => {
    test("ecadd_1-2_0-0_21000_64", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/static/state_tests/stZeroKnowledge2/ecadd_1-2_0-0_21000_64Filler.json";
      
      // Setup block environment
      const blockInfo: BlockInfo = {
        number: BigInt("0x01"),
        timestamp: BigInt("1000"),
        gasLimit: BigInt("0x5f5e100"),
        coinbase: "0x3535353535353535353535353535353535353535",
        baseFee: 0n,
        chainId: 1n,
        difficulty: BigInt("0x020000"),
      };
  
      const evm = new GuillotineEVM(blockInfo);
      
      // Setup pre-state
      evm.setBalance("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", BigInt("1000000000000000000"));
      evm.setCode("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000001", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000001", hexToBytes("0x"));
      evm.setBalance("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", BigInt("1000000000000000000"));
      evm.setCode("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", hexToBytes("0x"));
      evm.setBalance("0xc305c901078781c232a2a521c2af7980f8385ee9", BigInt("0"));
      evm.setCode("0xc305c901078781c232a2a521c2af7980f8385ee9", hexToBytes("0x600035601c52740100000000000000000000000000000000000000006020526fffffffffffffffffffffffffffffffff6040527fffffffffffffffffffffffffffffffff000000000000000000000000000000016060527402540be3fffffffffffffffffffffffffdabf41c006080527ffffffffffffffffffffffffdabf41c00000000000000000000000002540be40060a0526330c8d1da600051141561012b5760c06004356004013511151558576004356004013560200160043560040161014037604061026061014051610160600060066305f5e0fff11558576040610240526102406060806102c0828460006004601bf15050506102c08051602082012090506000556102c060206020820352604081510160206001820306601f820103905060208203f350005b"));
      evm.setBalance("0x0000000000000000000000000000000000000005", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000005", hexToBytes("0x"));
      evm.setBalance("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", BigInt("1000000000000000000"));
      evm.setCode("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000000", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000000", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000003", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000003", hexToBytes("0x"));
      evm.setBalance("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", BigInt("999999999999566450"));
      evm.setCode("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000006", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000006", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000007", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000007", hexToBytes("0x"));
      evm.setBalance("0x598443f1880ef585b21f1d7585bd0577402861e5", BigInt("1000000000000000000"));
      evm.setCode("0x598443f1880ef585b21f1d7585bd0577402861e5", hexToBytes("0x"));
      evm.setBalance("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", BigInt("1000000000000000000"));
      evm.setCode("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000004", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000004", hexToBytes("0x"));
      evm.setBalance("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", BigInt("1000000000000000000"));
      evm.setCode("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", hexToBytes("0x"));
      evm.setBalance("0x3535353535353535353535353535353535353535", BigInt("433550"));
      evm.setCode("0x3535353535353535353535353535353535353535", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000002", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000002", hexToBytes("0x"));
      evm.setBalance("0x77db2bebba79db42a978f896968f4afce746ea1f", BigInt("1000000000000000000"));
      evm.setCode("0x77db2bebba79db42a978f896968f4afce746ea1f", hexToBytes("0x"));
      evm.setBalance("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", BigInt("1000000000000000000"));
      evm.setCode("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", hexToBytes("0x"));
      evm.setBalance("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", BigInt("1000000000000000000"));
      evm.setCode("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", hexToBytes("0x"));
      
      // Execute transaction(s)
      const params0: CallParams = {
        caller: "0x0000000000000000000000000000000000000000",
        to: "0xc305c901078781c232a2a521c2af7980f8385ee9",
        value: BigInt("0x00"),
        input: hexToBytes("0x30c8d1da0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002"),
        gas: BigInt("0xa820"),
        callType: CallType.CALL,
      };
      
      const result0 = evm.call(params0);
      
      // Verify expect-format expectations
      const stateDump = evm.dumpState();
      
      // Check account 0x24143873e0e0815fdcbcffdbe09c979cbf9ad013
      {
        const account = stateDump.accounts.get("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000001
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000001");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d
      {
        const account = stateDump.accounts.get("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xc305c901078781c232a2a521c2af7980f8385ee9
      {
        const account = stateDump.accounts.get("0xc305c901078781c232a2a521c2af7980f8385ee9");
        expect(account?.balance || 0n).toBe(BigInt("0"));
        expect(account?.nonce || 0n).toBe(BigInt("1"));
      }
      // Check account 0x0000000000000000000000000000000000000005
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000005");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224
      {
        const account = stateDump.accounts.get("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000000
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000000");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000003
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000003");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1
      {
        const account = stateDump.accounts.get("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1");
        expect(account?.nonce || 0n).toBe(BigInt("9"));
      }
      // Check account 0x0000000000000000000000000000000000000006
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000006");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000007
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000007");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x598443f1880ef585b21f1d7585bd0577402861e5
      {
        const account = stateDump.accounts.get("0x598443f1880ef585b21f1d7585bd0577402861e5");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e
      {
        const account = stateDump.accounts.get("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000004
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000004");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xe0fc04fa2d34a66b779fd5cee748268032a146c0
      {
        const account = stateDump.accounts.get("0xe0fc04fa2d34a66b779fd5cee748268032a146c0");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x3535353535353535353535353535353535353535
      {
        const account = stateDump.accounts.get("0x3535353535353535353535353535353535353535");
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000002
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000002");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x77db2bebba79db42a978f896968f4afce746ea1f
      {
        const account = stateDump.accounts.get("0x77db2bebba79db42a978f896968f4afce746ea1f");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b
      {
        const account = stateDump.accounts.get("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c
      {
        const account = stateDump.accounts.get("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      
      evm.destroy();
    });
  
  });

  describe("ecadd_0-0_0-0_21000_80_ParisFiller", () => {
    test("ecadd_0-0_0-0_21000_80_Paris", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/static/state_tests/stZeroKnowledge2/ecadd_0-0_0-0_21000_80_ParisFiller.json";
      
      // Setup block environment
      const blockInfo: BlockInfo = {
        number: BigInt("0x01"),
        timestamp: BigInt("1000"),
        gasLimit: BigInt("0x5f5e100"),
        coinbase: "0x3535353535353535353535353535353535353535",
        baseFee: 0n,
        chainId: 1n,
        difficulty: BigInt("0x020000"),
      };
  
      const evm = new GuillotineEVM(blockInfo);
      
      // Setup pre-state
      evm.setBalance("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", BigInt("1000000000000000000"));
      evm.setCode("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000001", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000001", hexToBytes("0x"));
      evm.setBalance("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", BigInt("1000000000000000000"));
      evm.setCode("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", hexToBytes("0x"));
      evm.setBalance("0xc305c901078781c232a2a521c2af7980f8385ee9", BigInt("0"));
      evm.setCode("0xc305c901078781c232a2a521c2af7980f8385ee9", hexToBytes("0x600035601c52740100000000000000000000000000000000000000006020526fffffffffffffffffffffffffffffffff6040527fffffffffffffffffffffffffffffffff000000000000000000000000000000016060527402540be3fffffffffffffffffffffffffdabf41c006080527ffffffffffffffffffffffffdabf41c00000000000000000000000002540be40060a0526330c8d1da600051141561012b5760c06004356004013511151558576004356004013560200160043560040161014037604061026061014051610160600060066305f5e0fff11558576040610240526102406060806102c0828460006004601bf15050506102c08051602082012090506000556102c060206020820352604081510160206001820306601f820103905060208203f350005b"));
      evm.setBalance("0x0000000000000000000000000000000000000005", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000005", hexToBytes("0x"));
      evm.setBalance("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", BigInt("1000000000000000000"));
      evm.setCode("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000000", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000000", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000003", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000003", hexToBytes("0x"));
      evm.setBalance("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", BigInt("999999999999782354"));
      evm.setCode("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000006", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000006", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000007", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000007", hexToBytes("0x"));
      evm.setBalance("0x598443f1880ef585b21f1d7585bd0577402861e5", BigInt("1000000000000000000"));
      evm.setCode("0x598443f1880ef585b21f1d7585bd0577402861e5", hexToBytes("0x"));
      evm.setBalance("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", BigInt("1000000000000000000"));
      evm.setCode("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000004", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000004", hexToBytes("0x"));
      evm.setBalance("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", BigInt("1000000000000000000"));
      evm.setCode("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", hexToBytes("0x"));
      evm.setBalance("0x3535353535353535353535353535353535353535", BigInt("10"));
      evm.setCode("0x3535353535353535353535353535353535353535", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000002", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000002", hexToBytes("0x"));
      evm.setBalance("0x77db2bebba79db42a978f896968f4afce746ea1f", BigInt("1000000000000000000"));
      evm.setCode("0x77db2bebba79db42a978f896968f4afce746ea1f", hexToBytes("0x"));
      evm.setBalance("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", BigInt("1000000000000000000"));
      evm.setCode("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", hexToBytes("0x"));
      evm.setBalance("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", BigInt("1000000000000000000"));
      evm.setCode("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", hexToBytes("0x"));
      
      // Execute transaction(s)
      const params0: CallParams = {
        caller: "0x0000000000000000000000000000000000000000",
        to: "0xc305c901078781c232a2a521c2af7980f8385ee9",
        value: BigInt("0x00"),
        input: hexToBytes("0x30c8d1da00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"),
        gas: BigInt("0xa820"),
        callType: CallType.CALL,
      };
      
      const result0 = evm.call(params0);
      
      // Verify expect-format expectations
      const stateDump = evm.dumpState();
      
      // Check account 0x24143873e0e0815fdcbcffdbe09c979cbf9ad013
      {
        const account = stateDump.accounts.get("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000001
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000001");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d
      {
        const account = stateDump.accounts.get("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xc305c901078781c232a2a521c2af7980f8385ee9
      {
        const account = stateDump.accounts.get("0xc305c901078781c232a2a521c2af7980f8385ee9");
        expect(account?.balance || 0n).toBe(BigInt("0"));
        expect(account?.nonce || 0n).toBe(BigInt("1"));
      }
      // Check account 0x0000000000000000000000000000000000000005
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000005");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224
      {
        const account = stateDump.accounts.get("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000000
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000000");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000003
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000003");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1
      {
        const account = stateDump.accounts.get("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1");
        expect(account?.nonce || 0n).toBe(BigInt("4"));
      }
      // Check account 0x0000000000000000000000000000000000000006
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000006");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000007
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000007");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x598443f1880ef585b21f1d7585bd0577402861e5
      {
        const account = stateDump.accounts.get("0x598443f1880ef585b21f1d7585bd0577402861e5");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e
      {
        const account = stateDump.accounts.get("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000004
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000004");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xe0fc04fa2d34a66b779fd5cee748268032a146c0
      {
        const account = stateDump.accounts.get("0xe0fc04fa2d34a66b779fd5cee748268032a146c0");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000002
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000002");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x77db2bebba79db42a978f896968f4afce746ea1f
      {
        const account = stateDump.accounts.get("0x77db2bebba79db42a978f896968f4afce746ea1f");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b
      {
        const account = stateDump.accounts.get("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c
      {
        const account = stateDump.accounts.get("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      
      evm.destroy();
    });
  
  });

  describe("ecadd_0-0_1-3_21000_128Filler", () => {
    test("ecadd_0-0_1-3_21000_128", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/static/state_tests/stZeroKnowledge2/ecadd_0-0_1-3_21000_128Filler.json";
      
      // Setup block environment
      const blockInfo: BlockInfo = {
        number: BigInt("0x01"),
        timestamp: BigInt("1000"),
        gasLimit: BigInt("0x5f5e100"),
        coinbase: "0x3535353535353535353535353535353535353535",
        baseFee: 0n,
        chainId: 1n,
        difficulty: BigInt("0x020000"),
      };
  
      const evm = new GuillotineEVM(blockInfo);
      
      // Setup pre-state
      evm.setBalance("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", BigInt("1000000000000000000"));
      evm.setCode("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000001", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000001", hexToBytes("0x"));
      evm.setBalance("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", BigInt("1000000000000000000"));
      evm.setCode("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", hexToBytes("0x"));
      evm.setBalance("0xc305c901078781c232a2a521c2af7980f8385ee9", BigInt("0"));
      evm.setCode("0xc305c901078781c232a2a521c2af7980f8385ee9", hexToBytes("0x600035601c52740100000000000000000000000000000000000000006020526fffffffffffffffffffffffffffffffff6040527fffffffffffffffffffffffffffffffff000000000000000000000000000000016060527402540be3fffffffffffffffffffffffffdabf41c006080527ffffffffffffffffffffffffdabf41c00000000000000000000000002540be40060a0526330c8d1da600051141561012b5760c06004356004013511151558576004356004013560200160043560040161014037604061026061014051610160600060066305f5e0fff11558576040610240526102406060806102c0828460006004601bf15050506102c08051602082012090506000556102c060206020820352604081510160206001820306601f820103905060208203f350005b"));
      evm.setBalance("0x0000000000000000000000000000000000000005", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000005", hexToBytes("0x"));
      evm.setBalance("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", BigInt("1000000000000000000"));
      evm.setCode("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000000", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000000", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000003", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000003", hexToBytes("0x"));
      evm.setBalance("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", BigInt("999999999999246482"));
      evm.setCode("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000006", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000006", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000007", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000007", hexToBytes("0x"));
      evm.setBalance("0x598443f1880ef585b21f1d7585bd0577402861e5", BigInt("1000000000000000000"));
      evm.setCode("0x598443f1880ef585b21f1d7585bd0577402861e5", hexToBytes("0x"));
      evm.setBalance("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", BigInt("1000000000000000000"));
      evm.setCode("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000004", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000004", hexToBytes("0x"));
      evm.setBalance("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", BigInt("1000000000000000000"));
      evm.setCode("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", hexToBytes("0x"));
      evm.setBalance("0x3535353535353535353535353535353535353535", BigInt("753518"));
      evm.setCode("0x3535353535353535353535353535353535353535", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000002", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000002", hexToBytes("0x"));
      evm.setBalance("0x77db2bebba79db42a978f896968f4afce746ea1f", BigInt("1000000000000000000"));
      evm.setCode("0x77db2bebba79db42a978f896968f4afce746ea1f", hexToBytes("0x"));
      evm.setBalance("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", BigInt("1000000000000000000"));
      evm.setCode("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", hexToBytes("0x"));
      evm.setBalance("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", BigInt("1000000000000000000"));
      evm.setCode("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", hexToBytes("0x"));
      
      // Execute transaction(s)
      const params0: CallParams = {
        caller: "0x0000000000000000000000000000000000000000",
        to: "0xc305c901078781c232a2a521c2af7980f8385ee9",
        value: BigInt("0x00"),
        input: hexToBytes("0x30c8d1da000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003"),
        gas: BigInt("0xa920"),
        callType: CallType.CALL,
      };
      
      const result0 = evm.call(params0);
      
      // Verify expect-format expectations
      const stateDump = evm.dumpState();
      
      // Check account 0x24143873e0e0815fdcbcffdbe09c979cbf9ad013
      {
        const account = stateDump.accounts.get("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000001
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000001");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d
      {
        const account = stateDump.accounts.get("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xc305c901078781c232a2a521c2af7980f8385ee9
      {
        const account = stateDump.accounts.get("0xc305c901078781c232a2a521c2af7980f8385ee9");
        expect(account?.balance || 0n).toBe(BigInt("0"));
        expect(account?.nonce || 0n).toBe(BigInt("1"));
      }
      // Check account 0x0000000000000000000000000000000000000005
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000005");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224
      {
        const account = stateDump.accounts.get("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000000
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000000");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000003
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000003");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1
      {
        const account = stateDump.accounts.get("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1");
        expect(account?.nonce || 0n).toBe(BigInt("16"));
      }
      // Check account 0x0000000000000000000000000000000000000006
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000006");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000007
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000007");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x598443f1880ef585b21f1d7585bd0577402861e5
      {
        const account = stateDump.accounts.get("0x598443f1880ef585b21f1d7585bd0577402861e5");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e
      {
        const account = stateDump.accounts.get("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000004
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000004");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xe0fc04fa2d34a66b779fd5cee748268032a146c0
      {
        const account = stateDump.accounts.get("0xe0fc04fa2d34a66b779fd5cee748268032a146c0");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x3535353535353535353535353535353535353535
      {
        const account = stateDump.accounts.get("0x3535353535353535353535353535353535353535");
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000002
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000002");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x77db2bebba79db42a978f896968f4afce746ea1f
      {
        const account = stateDump.accounts.get("0x77db2bebba79db42a978f896968f4afce746ea1f");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b
      {
        const account = stateDump.accounts.get("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c
      {
        const account = stateDump.accounts.get("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      
      evm.destroy();
    });
  
  });

  describe("ecadd_1-2_0-0_25000_64Filler", () => {
    test("ecadd_1-2_0-0_25000_64", async () => {
      const testFile = "/Users/williamcory/Guillotine/specs/execution-specs/tests/eest/static/state_tests/stZeroKnowledge2/ecadd_1-2_0-0_25000_64Filler.json";
      
      // Setup block environment
      const blockInfo: BlockInfo = {
        number: BigInt("0x01"),
        timestamp: BigInt("1000"),
        gasLimit: BigInt("0x5f5e100"),
        coinbase: "0x3535353535353535353535353535353535353535",
        baseFee: 0n,
        chainId: 1n,
        difficulty: BigInt("0x020000"),
      };
  
      const evm = new GuillotineEVM(blockInfo);
      
      // Setup pre-state
      evm.setBalance("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", BigInt("1000000000000000000"));
      evm.setCode("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000001", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000001", hexToBytes("0x"));
      evm.setBalance("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", BigInt("1000000000000000000"));
      evm.setCode("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d", hexToBytes("0x"));
      evm.setBalance("0xc305c901078781c232a2a521c2af7980f8385ee9", BigInt("0"));
      evm.setCode("0xc305c901078781c232a2a521c2af7980f8385ee9", hexToBytes("0x600035601c52740100000000000000000000000000000000000000006020526fffffffffffffffffffffffffffffffff6040527fffffffffffffffffffffffffffffffff000000000000000000000000000000016060527402540be3fffffffffffffffffffffffffdabf41c006080527ffffffffffffffffffffffffdabf41c00000000000000000000000002540be40060a0526330c8d1da600051141561012b5760c06004356004013511151558576004356004013560200160043560040161014037604061026061014051610160600060066305f5e0fff11558576040610240526102406060806102c0828460006004601bf15050506102c08051602082012090506000556102c060206020820352604081510160206001820306601f820103905060208203f350005b"));
      evm.setBalance("0x0000000000000000000000000000000000000005", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000005", hexToBytes("0x"));
      evm.setBalance("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", BigInt("1000000000000000000"));
      evm.setCode("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000000", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000000", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000003", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000003", hexToBytes("0x"));
      evm.setBalance("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", BigInt("999999999998851139"));
      evm.setCode("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000006", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000006", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000007", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000007", hexToBytes("0x"));
      evm.setBalance("0x598443f1880ef585b21f1d7585bd0577402861e5", BigInt("1000000000000000000"));
      evm.setCode("0x598443f1880ef585b21f1d7585bd0577402861e5", hexToBytes("0x"));
      evm.setBalance("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", BigInt("1000000000000000000"));
      evm.setCode("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000004", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000004", hexToBytes("0x"));
      evm.setBalance("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", BigInt("1000000000000000000"));
      evm.setCode("0xe0fc04fa2d34a66b779fd5cee748268032a146c0", hexToBytes("0x"));
      evm.setBalance("0x3535353535353535353535353535353535353535", BigInt("1148861"));
      evm.setCode("0x3535353535353535353535353535353535353535", hexToBytes("0x"));
      evm.setBalance("0x0000000000000000000000000000000000000002", BigInt("1"));
      evm.setCode("0x0000000000000000000000000000000000000002", hexToBytes("0x"));
      evm.setBalance("0x77db2bebba79db42a978f896968f4afce746ea1f", BigInt("1000000000000000000"));
      evm.setCode("0x77db2bebba79db42a978f896968f4afce746ea1f", hexToBytes("0x"));
      evm.setBalance("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", BigInt("1000000000000000000"));
      evm.setCode("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b", hexToBytes("0x"));
      evm.setBalance("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", BigInt("1000000000000000000"));
      evm.setCode("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c", hexToBytes("0x"));
      
      // Execute transaction(s)
      const params0: CallParams = {
        caller: "0x0000000000000000000000000000000000000000",
        to: "0xc305c901078781c232a2a521c2af7980f8385ee9",
        value: BigInt("0x00"),
        input: hexToBytes("0x30c8d1da0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002"),
        gas: BigInt("0xb7c0"),
        callType: CallType.CALL,
      };
      
      const result0 = evm.call(params0);
      
      // Verify expect-format expectations
      const stateDump = evm.dumpState();
      
      // Check account 0x24143873e0e0815fdcbcffdbe09c979cbf9ad013
      {
        const account = stateDump.accounts.get("0x24143873e0e0815fdcbcffdbe09c979cbf9ad013");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000001
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000001");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d
      {
        const account = stateDump.accounts.get("0xdceceaf3fc5c0a63d195d69b1a90011b7b19650d");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xc305c901078781c232a2a521c2af7980f8385ee9
      {
        const account = stateDump.accounts.get("0xc305c901078781c232a2a521c2af7980f8385ee9");
        expect(account?.balance || 0n).toBe(BigInt("0"));
        expect(account?.nonce || 0n).toBe(BigInt("1"));
        expect(account?.storage.get("0x0000000000000000000000000000000000000000000000000000000000000000") || 0n).toBe(BigInt("0xe90b7bceb6e7df5418fb78d8ee546e97c83a08bbccc01a0644d599ccd2a7c2e0"));
      }
      // Check account 0x0000000000000000000000000000000000000005
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000005");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224
      {
        const account = stateDump.accounts.get("0x13cbb8d99c6c4e0f2728c7d72606e78a29c4e224");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000000
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000000");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000003
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000003");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1
      {
        const account = stateDump.accounts.get("0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1");
        expect(account?.nonce || 0n).toBe(BigInt("27"));
      }
      // Check account 0x0000000000000000000000000000000000000006
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000006");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000007
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000007");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x598443f1880ef585b21f1d7585bd0577402861e5
      {
        const account = stateDump.accounts.get("0x598443f1880ef585b21f1d7585bd0577402861e5");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e
      {
        const account = stateDump.accounts.get("0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000004
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000004");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0xe0fc04fa2d34a66b779fd5cee748268032a146c0
      {
        const account = stateDump.accounts.get("0xe0fc04fa2d34a66b779fd5cee748268032a146c0");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x3535353535353535353535353535353535353535
      {
        const account = stateDump.accounts.get("0x3535353535353535353535353535353535353535");
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x0000000000000000000000000000000000000002
      {
        const account = stateDump.accounts.get("0x0000000000000000000000000000000000000002");
        expect(account?.balance || 0n).toBe(BigInt("1"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x77db2bebba79db42a978f896968f4afce746ea1f
      {
        const account = stateDump.accounts.get("0x77db2bebba79db42a978f896968f4afce746ea1f");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b
      {
        const account = stateDump.accounts.get("0x10a1c1cb95c92ec31d3f22c66eef1d9f3f258c6b");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      // Check account 0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c
      {
        const account = stateDump.accounts.get("0x90f0b1ebbba1c1936aff7aaf20a7878ff9e04b6c");
        expect(account?.balance || 0n).toBe(BigInt("1000000000000000000"));
        expect(account?.nonce || 0n).toBe(BigInt("0"));
      }
      
      evm.destroy();
    });
  
  });

});

// Generated 10 tests, skipped 0