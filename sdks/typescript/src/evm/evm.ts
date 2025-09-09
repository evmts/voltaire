import { Address } from '../primitives/address.js';
import { U256 } from '../primitives/u256.js';
import { Bytes } from '../primitives/bytes.js';
import { Hash } from '../primitives/hash.js';
import { ExecutionResult } from './execution-result.js';
import { GuillotineError } from '../errors.js';
import { getWasmLoader, WasmMemory, GuillotineWasm } from '../wasm/loader.js';

/**
 * Parameters for EVM execution
 */
export interface ExecutionParams {
  /** The bytecode to execute */
  bytecode: Bytes;
  /** The caller address (defaults to zero address) */
  caller?: Address;
  /** The target address (defaults to zero address) */
  to?: Address;
  /** The value to transfer (defaults to zero) */
  value?: U256;
  /** The input data (defaults to empty) */
  input?: Bytes;
  /** The gas limit (defaults to 1,000,000) */
  gasLimit?: bigint;
}

/**
 * Main EVM execution engine using WebAssembly
 */
export class GuillotineEVM {
  private wasm: GuillotineWasm;
  private memory: WasmMemory;
  private vmPtr: number;
  private isInitialized: boolean = false;

  private constructor(wasm: GuillotineWasm, memory: WasmMemory, vmPtr: number) {
    this.wasm = wasm;
    this.memory = memory;
    this.vmPtr = vmPtr;
    this.isInitialized = true;
  }

  /**
   * Create a new EVM instance
   */
  static async create(wasmPath?: string): Promise<GuillotineEVM> {
    try {
      const loader = getWasmLoader();
      
      // Load WASM if not already loaded
      if (!loader.isLoaded()) {
        await loader.load(wasmPath);
      }

      const wasm = loader.getWasm();
      const memory = loader.getMemory();

      // Create VM instance
      const vmPtr = wasm.guillotine_vm_create();
      if (vmPtr === 0) {
        throw GuillotineError.vmCreationFailed('Failed to create VM instance');
      }

      return new GuillotineEVM(wasm, memory, vmPtr);
    } catch (error) {
      if (error instanceof GuillotineError) {
        throw error;
      }
      throw GuillotineError.initializationFailed(
        'Failed to create EVM instance',
        error as Error
      );
    }
  }

  /**
   * Execute bytecode on the EVM
   */
  async execute(params: ExecutionParams): Promise<ExecutionResult> {
    this.ensureInitialized();

    try {
      // Set default parameters
      const caller = params.caller || Address.zero();
      const to = params.to || Address.zero();
      const value = params.value || U256.zero();
      const input = params.input || Bytes.empty();
      const gasLimit = params.gasLimit || 1000000n;

      // Validate inputs
      if (params.bytecode.isEmpty()) {
        throw GuillotineError.invalidBytecode('Bytecode cannot be empty');
      }

      // Write data to WASM memory
      const bytecodePtr = this.memory.writeBytes(params.bytecode.toBytes());
      const callerPtr = this.memory.writeAddress(caller.toBytes());
      const toPtr = this.memory.writeAddress(to.toBytes());
      const valuePtr = this.memory.writeU256(value.toBytes());
      const inputPtr = input.isEmpty() ? 0 : this.memory.writeBytes(input.toBytes());

      try {
        // Execute on the EVM
        const resultPtr = this.wasm.guillotine_vm_execute(
          this.vmPtr,
          bytecodePtr,
          params.bytecode.length(),
          callerPtr,
          toPtr,
          valuePtr,
          inputPtr,
          input.length(),
          gasLimit
        );

        if (resultPtr === 0) {
          throw GuillotineError.executionFailed('VM execution returned null result');
        }

        // Read the result from WASM memory
        const result = this.parseExecutionResult(resultPtr);
        
        return result;
      } finally {
        // Clean up allocated memory
        this.memory.free(bytecodePtr, params.bytecode.length());
        this.memory.free(callerPtr, 20);
        this.memory.free(toPtr, 20);
        this.memory.free(valuePtr, 32);
        if (inputPtr !== 0) {
          this.memory.free(inputPtr, input.length());
        }
      }
    } catch (error) {
      if (error instanceof GuillotineError) {
        throw error;
      }
      throw GuillotineError.executionFailed(
        'EVM execution failed',
        error as Error
      );
    }
  }

  /**
   * Set the balance of an account
   */
  async setBalance(address: Address, balance: U256): Promise<void> {
    this.ensureInitialized();

    try {
      const addressPtr = this.memory.writeAddress(address.toBytes());
      const balancePtr = this.memory.writeU256(balance.toBytes());

      try {
        const result = this.wasm.guillotine_set_balance(this.vmPtr, addressPtr, balancePtr);
        if (result !== 0) {
          throw GuillotineError.fromErrorCode(result, 'Failed to set balance');
        }
      } finally {
        this.memory.free(addressPtr, 20);
        this.memory.free(balancePtr, 32);
      }
    } catch (error) {
      if (error instanceof GuillotineError) {
        throw error;
      }
      throw GuillotineError.stateError('Failed to set balance', error as Error);
    }
  }

  /**
   * Set the code of an account
   */
  async setCode(address: Address, code: Bytes): Promise<void> {
    this.ensureInitialized();

    try {
      const addressPtr = this.memory.writeAddress(address.toBytes());
      const codePtr = code.isEmpty() ? 0 : this.memory.writeBytes(code.toBytes());

      try {
        const result = this.wasm.guillotine_set_code(
          this.vmPtr,
          addressPtr,
          codePtr,
          code.length()
        );
        if (result !== 0) {
          throw GuillotineError.fromErrorCode(result, 'Failed to set code');
        }
      } finally {
        this.memory.free(addressPtr, 20);
        if (codePtr !== 0) {
          this.memory.free(codePtr, code.length());
        }
      }
    } catch (error) {
      if (error instanceof GuillotineError) {
        throw error;
      }
      throw GuillotineError.stateError('Failed to set code', error as Error);
    }
  }

  /**
   * Set a storage slot for an account
   */
  async setStorage(address: Address, key: U256, value: U256): Promise<void> {
    this.ensureInitialized();

    try {
      const addressPtr = this.memory.writeAddress(address.toBytes());
      const keyPtr = this.memory.writeU256(key.toBytes());
      const valuePtr = this.memory.writeU256(value.toBytes());

      try {
        const result = this.wasm.guillotine_set_storage(
          this.vmPtr,
          addressPtr,
          keyPtr,
          valuePtr
        );
        if (result !== 0) {
          throw GuillotineError.fromErrorCode(result, 'Failed to set storage');
        }
      } finally {
        this.memory.free(addressPtr, 20);
        this.memory.free(keyPtr, 32);
        this.memory.free(valuePtr, 32);
      }
    } catch (error) {
      if (error instanceof GuillotineError) {
        throw error;
      }
      throw GuillotineError.stateError('Failed to set storage', error as Error);
    }
  }

  /**
   * Get the balance of an account
   */
  async getBalance(address: Address): Promise<U256> {
    this.ensureInitialized();

    try {
      const addressPtr = this.memory.writeAddress(address.toBytes());

      try {
        const balancePtr = this.wasm.guillotine_get_balance(this.vmPtr, addressPtr);
        if (balancePtr === 0) {
          return U256.zero();
        }

        const balanceBytes = this.memory.readU256(balancePtr);
        return U256.fromBytes(balanceBytes);
      } finally {
        this.memory.free(addressPtr, 20);
      }
    } catch (error) {
      if (error instanceof GuillotineError) {
        throw error;
      }
      throw GuillotineError.stateError('Failed to get balance', error as Error);
    }
  }

  /**
   * Get the code of an account
   */
  async getCode(address: Address): Promise<Bytes> {
    this.ensureInitialized();

    try {
      const addressPtr = this.memory.writeAddress(address.toBytes());

      try {
        const codePtr = this.wasm.guillotine_get_code(this.vmPtr, addressPtr);
        if (codePtr === 0) {
          return Bytes.empty();
        }

        // Note: In a real implementation, we'd need to know the length
        // For now, we'll assume the WASM function returns a structured result
        // This is a simplified version
        return Bytes.empty();
      } finally {
        this.memory.free(addressPtr, 20);
      }
    } catch (error) {
      if (error instanceof GuillotineError) {
        throw error;
      }
      throw GuillotineError.stateError('Failed to get code', error as Error);
    }
  }

  /**
   * Get a storage slot for an account
   */
  async getStorage(address: Address, key: U256): Promise<U256> {
    this.ensureInitialized();

    try {
      const addressPtr = this.memory.writeAddress(address.toBytes());
      const keyPtr = this.memory.writeU256(key.toBytes());

      try {
        const valuePtr = this.wasm.guillotine_get_storage(this.vmPtr, addressPtr, keyPtr);
        if (valuePtr === 0) {
          return U256.zero();
        }

        const valueBytes = this.memory.readU256(valuePtr);
        return U256.fromBytes(valueBytes);
      } finally {
        this.memory.free(addressPtr, 20);
        this.memory.free(keyPtr, 32);
      }
    } catch (error) {
      if (error instanceof GuillotineError) {
        throw error;
      }
      throw GuillotineError.stateError('Failed to get storage', error as Error);
    }
  }

  /**
   * Get the EVM version
   */
  getVersion(): string {
    this.ensureInitialized();

    try {
      const versionPtr = this.wasm.guillotine_version();
      return this.memory.readString(versionPtr);
    } catch (error) {
      throw GuillotineError.unknown('Failed to get version', error as Error);
    }
  }

  /**
   * Close the EVM instance and clean up resources
   */
  close(): void {
    if (this.isInitialized && this.vmPtr !== 0) {
      this.wasm.guillotine_vm_destroy(this.vmPtr);
      this.vmPtr = 0;
      this.isInitialized = false;
    }
  }

  /**
   * Ensure the EVM is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || this.vmPtr === 0) {
      throw GuillotineError.vmNotInitialized('EVM instance is not initialized');
    }
  }

  /**
   * Parse execution result from WASM memory
   */
  private parseExecutionResult(resultPtr: number): ExecutionResult {
    // This is a simplified parser - in a real implementation,
    // we'd need to match the exact structure returned by the Zig code
    const buffer = this.memory.getBuffer();
    
    // Assuming a simple structure for now:
    // - 4 bytes: success flag
    // - 8 bytes: gas used
    // - 4 bytes: return data length
    // - N bytes: return data
    // - 4 bytes: revert reason length
    // - N bytes: revert reason
    
    const view = new DataView(buffer.buffer, resultPtr);
    
    const success = view.getUint32(0, true) !== 0;
    const gasUsed = view.getBigUint64(4, true);
    const returnDataLen = view.getUint32(12, true);
    
    let offset = 16;
    const returnDataBytes = new Uint8Array(buffer.buffer, resultPtr + offset, returnDataLen);
    const returnData = Bytes.fromBytes(returnDataBytes);
    
    offset += returnDataLen;
    const revertReasonLen = view.getUint32(offset, true);
    offset += 4;
    
    const revertReasonBytes = new Uint8Array(buffer.buffer, resultPtr + offset, revertReasonLen);
    const revertReason = Bytes.fromBytes(revertReasonBytes);

    return new ExecutionResult(success, gasUsed, returnData, revertReason);
  }
}