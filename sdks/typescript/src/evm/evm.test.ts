import { describe, it, expect, beforeEach } from 'bun:test';
import { GuillotineEVM, ExecutionParams } from './evm';
import { ExecutionResult } from './execution-result';
import { Address } from '../primitives/address';
import { U256 } from '../primitives/u256';
import { Hash } from '../primitives/hash';
import { Bytes } from '../primitives/bytes';
import { GuillotineError } from '../errors';
import { MockWasmLoader, mockWasmModule } from '../test/mock-wasm';

describe('GuillotineEVM', () => {
  let mockLoader: MockWasmLoader;
  let mockVmPtr: number;

  beforeEach(() => {
    mockLoader = new MockWasmLoader();
    mockVmPtr = 0x4000;
    mockWasmModule.memory = new WebAssembly.Memory({ initial: 1 });
    
    // Reset all mock functions
    Object.values(mockWasmModule.exports).forEach((fn: any) => {
      if (fn && typeof fn.reset === 'function') {
        fn.reset();
      }
    });
    
    // Mock guillotine_is_initialized to return true
    mockWasmModule.exports.guillotine_is_initialized.mockReturnValue(1);
  });

  describe('initialization', () => {
    it('should create VM and initialize if needed', async () => {
      const mockInit = mockWasmModule.exports.guillotine_init;
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      
      mockInit.mockImplementation(() => 0); // Success
      mockCreate.mockImplementation(() => mockVmPtr);

      const vm = await GuillotineEVM.create();

      expect(mockCreate.calls).toHaveLength(1);
      expect(vm).toBeDefined();
    });

    it('should throw on VM creation failure', async () => {
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      mockCreate.mockImplementation(() => 0); // Null pointer

      await expect(GuillotineEVM.create()).rejects.toThrow('Failed to create VM instance');
    });
  });

  describe('VM lifecycle', () => {
    it('should create a new VM instance', async () => {
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      mockCreate.mockImplementation(() => mockVmPtr);

      const vm = await GuillotineEVM.create();

      expect(mockCreate.calls).toHaveLength(1);
      expect(vm).toBeDefined();
    });

    it('should throw on VM creation failure', async () => {
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      mockCreate.mockImplementation(() => 0); // Null pointer

      await expect(GuillotineEVM.create()).rejects.toThrow('Failed to create VM');
    });

    it('should close VM on cleanup', async () => {
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      const mockDestroy = mockWasmModule.exports.guillotine_vm_destroy;
      
      mockCreate.mockImplementation(() => mockVmPtr);
      mockDestroy.mockImplementation(() => {});

      const vm = await GuillotineEVM.create();
      vm.close();

      expect(mockDestroy.calls).toHaveLength(1);
      expect(mockDestroy.lastCall).toEqual([mockVmPtr]);
    });
  });

  describe('state management', () => {
    it('should set account balance', async () => {
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      const mockSetBalance = mockWasmModule.exports.guillotine_set_balance;
      
      mockCreate.mockImplementation(() => mockVmPtr);
      mockSetBalance.mockImplementation(() => 0); // Success

      const vm = await GuillotineEVM.create();
      const address = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f89346');
      const balance = U256.from('1000000000000000000'); // 1 ETH

      await vm.setBalance(address, balance);

      expect(mockSetBalance.calls).toHaveLength(1);
      expect(mockSetBalance.lastCall).toEqual([
        mockVmPtr,
        expect.any(Number), // address pointer
        expect.any(Number)  // balance pointer
      ]);
    });

    it('should get account balance', async () => {
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      const mockGetBalance = mockWasmModule.exports.guillotine_get_balance;
      
      mockCreate.mockImplementation(() => mockVmPtr);
      
      const balancePtr = 0x5000;
      const expectedBalance = U256.from('1000000000000000000');
      mockGetBalance.mockImplementation((vm, addrPtr) => {
        // Write balance to memory
        if (mockWasmModule.memory) {
          const view = new Uint8Array(mockWasmModule.memory.buffer);
          const balanceBytes = expectedBalance.toBytes();
          view.set(balanceBytes, balancePtr);
        }
        return balancePtr;
      });

      const vm = await GuillotineEVM.create();
      const address = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f89346');
      const balance = await vm.getBalance(address);

      expect(balance.equals(expectedBalance)).toBe(true);
    });

    it('should set contract code', async () => {
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      const mockSetCode = mockWasmModule.exports.guillotine_set_code;
      
      mockCreate.mockImplementation(() => mockVmPtr);
      mockSetCode.mockImplementation(() => 0); // Success

      const vm = await GuillotineEVM.create();
      const address = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f89346');
      const code = Bytes.from('0x6001600101');

      await vm.setCode(address, code);

      expect(mockSetCode.calls).toHaveLength(1);
      expect(mockSetCode.lastCall).toEqual([
        mockVmPtr,
        expect.any(Number), // address pointer
        expect.any(Number), // code pointer
        5                   // code length
      ]);
    });

    it('should set storage value', async () => {
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      const mockSetStorage = mockWasmModule.exports.guillotine_set_storage;
      
      mockCreate.mockImplementation(() => mockVmPtr);
      mockSetStorage.mockImplementation(() => 0); // Success

      const vm = await GuillotineEVM.create();
      const address = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f89346');
      const key = U256.from(1);
      const value = U256.from(42);

      await vm.setStorage(address, key, value);

      expect(mockSetStorage.calls).toHaveLength(1);
      expect(mockSetStorage.lastCall).toEqual([
        mockVmPtr,
        expect.any(Number), // address pointer
        expect.any(Number), // key pointer
        expect.any(Number)  // value pointer
      ]);
    });
  });

  describe('execution', () => {
    it('should execute simple bytecode', async () => {
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      const mockExecute = mockWasmModule.exports.guillotine_vm_execute;
      
      mockCreate.mockImplementation(() => mockVmPtr);
      
      const resultPtr = 0x6000;
      mockExecute.mockImplementation(() => {
        // Create a successful result in memory matching parseExecutionResult format
        if (mockWasmModule.memory) {
          const view = new DataView(mockWasmModule.memory.buffer);
          // Result structure:
          // - 4 bytes: success flag
          // - 8 bytes: gas used
          // - 4 bytes: return data length
          // - N bytes: return data
          // - 4 bytes: revert reason length
          // - N bytes: revert reason
          view.setUint32(resultPtr, 1, true); // Success = true
          view.setBigUint64(resultPtr + 4, 21000n, true); // Gas used
          view.setUint32(resultPtr + 12, 0, true); // Return data length = 0
          view.setUint32(resultPtr + 16, 0, true); // Revert reason length = 0
        }
        return resultPtr;
      });

      const vm = await GuillotineEVM.create();
      const params: ExecutionParams = {
        bytecode: Bytes.from('0x00'), // STOP
        from: Address.zero(),
        to: Address.zero(),
        value: U256.zero(),
        input: Bytes.empty(),
        gasLimit: 30000000n
      };

      const result = await vm.execute(params);

      expect(result.isSuccess()).toBe(true);
      expect(result.gasUsed).toBe(21000n);
      expect(result.returnData.length()).toBe(0);
    });

    it('should handle execution failure', async () => {
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      const mockExecute = mockWasmModule.exports.guillotine_vm_execute;
      
      mockCreate.mockImplementation(() => mockVmPtr);
      
      const resultPtr = 0x6000;
      mockExecute.mockImplementation(() => {
        // Create a failed result in memory
        if (mockWasmModule.memory) {
          const view = new DataView(mockWasmModule.memory.buffer);
          view.setUint32(resultPtr, 0, true); // Success = false
          view.setBigUint64(resultPtr + 4, 115200n, true); // Gas used = all gas
          view.setUint32(resultPtr + 12, 0, true); // Return data length = 0
          view.setUint32(resultPtr + 16, 0, true); // Revert reason length = 0
        }
        return resultPtr;
      });

      const vm = await GuillotineEVM.create();
      const params: ExecutionParams = {
        bytecode: Bytes.from('0x5b5b5b5b'), // Infinite loop of JUMPDESTs
        from: Address.zero(),
        to: Address.zero(),
        value: U256.zero(),
        input: Bytes.empty(),
        gasLimit: 115200n // Low gas limit
      };

      const result = await vm.execute(params);

      expect(result.isFailure()).toBe(true);
      expect(result.gasUsed).toBe(115200n);
    });

    it('should handle revert with output', async () => {
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      const mockExecute = mockWasmModule.exports.guillotine_vm_execute;
      
      mockCreate.mockImplementation(() => mockVmPtr);
      
      const resultPtr = 0x6000;
      const revertMessage = 'Insufficient balance';
      const encoder = new TextEncoder();
      const revertBytes = encoder.encode(revertMessage);
      
      mockExecute.mockImplementation(() => {
        // Create a revert result in memory
        if (mockWasmModule.memory) {
          const view = new DataView(mockWasmModule.memory.buffer);
          const uint8View = new Uint8Array(mockWasmModule.memory.buffer);
          
          view.setUint32(resultPtr, 0, true); // Success = false (for revert)
          view.setBigUint64(resultPtr + 4, 50000n, true); // Gas used
          view.setUint32(resultPtr + 12, 0, true); // Return data length = 0
          view.setUint32(resultPtr + 16, revertBytes.length, true); // Revert reason length
          // Revert reason data
          uint8View.set(revertBytes, resultPtr + 20);
        }
        return resultPtr;
      });

      const vm = await GuillotineEVM.create();
      const params: ExecutionParams = {
        bytecode: Bytes.from('0xfd'), // REVERT
        from: Address.zero(),
        to: Address.zero(),
        value: U256.from('1000000000000000000'),
        input: Bytes.empty(),
        gasLimit: 30000000n
      };

      const result = await vm.execute(params);

      expect(result.isFailure()).toBe(true);
      expect(result.gasUsed).toBe(50000n);
      expect(result.revertReason.toString()).toBe(revertMessage);
    });
  });

  describe('error handling', () => {
    it('should throw when executing on destroyed VM', async () => {
      const mockCreate = mockWasmModule.exports.guillotine_vm_create;
      const mockDestroy = mockWasmModule.exports.guillotine_vm_destroy;
      
      mockCreate.mockImplementation(() => mockVmPtr);
      mockDestroy.mockImplementation(() => {});

      const vm = await GuillotineEVM.create();
      vm.close();

      const params: ExecutionParams = {
        bytecode: Bytes.from('0x00'),
        from: Address.zero(),
        to: Address.zero(),
        value: U256.zero(),
        input: Bytes.empty(),
        gasLimit: 30000000n
      };

      await expect(vm.execute(params)).rejects.toThrow('EVM instance is not initialized');
    });
  });
});