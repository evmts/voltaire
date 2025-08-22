#!/usr/bin/env node
/**
 * EVM2 JavaScript/Node.js Example using FFI
 * 
 * This example demonstrates how to use the EVM2 C API from JavaScript/Node.js.
 * 
 * Requirements:
 *   - Node.js 14+
 *   - ffi-napi package: npm install ffi-napi ref-napi
 *   - The EVM2 C library (libevm2_c.dylib or libevm2_c.so)
 * 
 * Usage:
 *   npm install ffi-napi ref-napi
 *   node js_example.js
 */

const fs = require('fs');
const path = require('path');

// Try to load FFI
let ffi, ref;
try {
    ffi = require('ffi-napi');
    ref = require('ref-napi');
} catch (e) {
    console.log('Error: ffi-napi and ref-napi packages are required.');
    console.log('Please install them with: npm install ffi-napi ref-napi');
    process.exit(1);
}

/**
 * Find the EVM2 C library in the cache directory.
 */
function findLibrary() {
    const cacheDir = path.join(__dirname, '..', '..', '..', '.zig-cache', 'o');
    
    if (!fs.existsSync(cacheDir)) {
        return null;
    }
    
    // Try to find shared library
    const extensions = process.platform === 'darwin' ? ['.dylib'] : ['.so'];
    
    for (const ext of extensions) {
        try {
            const dirs = fs.readdirSync(cacheDir);
            for (const dir of dirs) {
                const libPath = path.join(cacheDir, dir, `libevm2_c${ext}`);
                if (fs.existsSync(libPath)) {
                    return libPath;
                }
            }
        } catch (e) {
            // Continue searching
        }
    }
    
    return null;
}

/**
 * Load the EVM2 C library and define function signatures.
 */
function loadEVM2Library() {
    const libPath = findLibrary();
    if (!libPath) {
        console.log('Error: EVM2 C library not found.');
        console.log('Please run "zig build evm2-c" first.');
        return null;
    }
    
    console.log(`Loading library: ${libPath}`);
    
    try {
        // Define types
        const voidPtr = ref.refType(ref.types.void);
        const uint8Ptr = ref.refType(ref.types.uint8);
        const uint64Ptr = ref.refType(ref.types.uint64);
        
        // Load the library with function signatures
        const lib = ffi.Library(libPath, {
            // Library metadata
            'evm2_version': ['string', []],
            'evm2_build_info': ['string', []],
            'evm2_init': ['int', []],
            'evm2_cleanup': ['void', []],
            
            // Frame lifecycle
            'evm_frame_create': [voidPtr, [uint8Ptr, 'size_t', 'uint64']],
            'evm_frame_destroy': ['void', [voidPtr]],
            'evm_frame_reset': ['int', [voidPtr, 'uint64']],
            
            // Execution
            'evm_frame_execute': ['int', [voidPtr]],
            
            // Stack operations
            'evm_frame_push_u64': ['int', [voidPtr, 'uint64']],
            'evm_frame_push_u32': ['int', [voidPtr, 'uint32']],
            'evm_frame_pop_u64': ['int', [voidPtr, uint64Ptr]],
            'evm_frame_peek_u64': ['int', [voidPtr, uint64Ptr]],
            'evm_frame_stack_size': ['uint32', [voidPtr]],
            'evm_frame_stack_capacity': ['uint32', [voidPtr]],
            
            // State inspection
            'evm_frame_get_gas_remaining': ['uint64', [voidPtr]],
            'evm_frame_get_gas_used': ['uint64', [voidPtr]],
            'evm_frame_get_pc': ['uint32', [voidPtr]],
            'evm_frame_get_bytecode_len': ['size_t', [voidPtr]],
            'evm_frame_get_current_opcode': ['uint8', [voidPtr]],
            'evm_frame_is_stopped': ['bool', [voidPtr]],
            
            // Error handling
            'evm_error_string': ['string', ['int']],
            'evm_error_is_stop': ['bool', ['int']],
            
            // Test functions (may not exist in release builds)
            'evm2_test_simple_execution': ['int', []],
            'evm2_test_stack_operations': ['int', []],
        });
        
        return lib;
        
    } catch (e) {
        console.log(`Error loading library: ${e.message}`);
        return null;
    }
}

// Error codes
const EVM_SUCCESS = 0;
const EVM_ERROR_STOP = -9;

/**
 * JavaScript wrapper for EVM frame operations.
 */
class EVMFrame {
    constructor(lib, bytecode, initialGas = 1000000) {
        this.lib = lib;
        
        // Convert bytecode array to Buffer
        const bytecodeBuffer = Buffer.from(bytecode);
        
        // Create frame
        this.handle = lib.evm_frame_create(bytecodeBuffer, bytecode.length, initialGas);
        if (this.handle.isNull()) {
            throw new Error('Failed to create EVM frame');
        }
    }
    
    destroy() {
        if (this.handle && !this.handle.isNull()) {
            this.lib.evm_frame_destroy(this.handle);
            this.handle = ref.NULL;
        }
    }
    
    execute() {
        return this.lib.evm_frame_execute(this.handle);
    }
    
    pushU64(value) {
        const result = this.lib.evm_frame_push_u64(this.handle, value);
        if (result !== EVM_SUCCESS) {
            throw new Error(`Push failed: ${this.errorString(result)}`);
        }
    }
    
    popU64() {
        const valuePtr = ref.alloc('uint64');
        const result = this.lib.evm_frame_pop_u64(this.handle, valuePtr);
        if (result !== EVM_SUCCESS) {
            throw new Error(`Pop failed: ${this.errorString(result)}`);
        }
        return valuePtr.deref();
    }
    
    peekU64() {
        const valuePtr = ref.alloc('uint64');
        const result = this.lib.evm_frame_peek_u64(this.handle, valuePtr);
        if (result !== EVM_SUCCESS) {
            throw new Error(`Peek failed: ${this.errorString(result)}`);
        }
        return valuePtr.deref();
    }
    
    get stackSize() {
        return this.lib.evm_frame_stack_size(this.handle);
    }
    
    get stackCapacity() {
        return this.lib.evm_frame_stack_capacity(this.handle);
    }
    
    get gasRemaining() {
        return this.lib.evm_frame_get_gas_remaining(this.handle);
    }
    
    get gasUsed() {
        return this.lib.evm_frame_get_gas_used(this.handle);
    }
    
    get pc() {
        return this.lib.evm_frame_get_pc(this.handle);
    }
    
    get bytecodeLen() {
        return this.lib.evm_frame_get_bytecode_len(this.handle);
    }
    
    get currentOpcode() {
        return this.lib.evm_frame_get_current_opcode(this.handle);
    }
    
    get isStopped() {
        return this.lib.evm_frame_is_stopped(this.handle);
    }
    
    errorString(errorCode) {
        return this.lib.evm_error_string(errorCode);
    }
}

/**
 * Main example function.
 */
function main() {
    console.log('EVM2 JavaScript Example');
    console.log('========================\n');
    
    // Load the library
    const lib = loadEVM2Library();
    if (!lib) {
        return 1;
    }
    
    // Initialize library
    if (lib.evm2_init() !== 0) {
        console.log('Failed to initialize EVM2 library');
        return 1;
    }
    
    try {
        // Display library information
        const version = lib.evm2_version();
        const buildInfo = lib.evm2_build_info();
        console.log(`Library version: ${version}`);
        console.log(`Build info: ${buildInfo}\n`);
        
        // Example 1: Simple arithmetic - PUSH1 5, PUSH1 10, ADD, STOP
        console.log('Example 1: Simple Arithmetic (5 + 10)');
        console.log('Bytecode: PUSH1 5, PUSH1 10, ADD, STOP');
        
        const bytecode = [0x60, 0x05, 0x60, 0x0A, 0x01, 0x00];
        const frame = new EVMFrame(lib, bytecode, 1000000);
        
        console.log(`Initial gas: ${frame.gasRemaining}`);
        console.log(`Stack size: ${frame.stackSize}`);
        console.log(`Program counter: ${frame.pc}`);
        
        // Execute
        const result = frame.execute();
        console.log(`Execution result: ${frame.errorString(result)}`);
        
        if (result === EVM_SUCCESS || lib.evm_error_is_stop(result)) {
            console.log(`Gas remaining: ${frame.gasRemaining}`);
            console.log(`Gas used: ${frame.gasUsed}`);
            console.log(`Final stack size: ${frame.stackSize}`);
            
            // Pop the result
            if (frame.stackSize > 0) {
                const value = frame.popU64();
                console.log(`Result value: ${value}`);
            }
        }
        
        frame.destroy();
        console.log();
        
        // Example 2: Stack operations
        console.log('Example 2: Manual Stack Operations');
        
        // Just STOP instruction for testing stack operations
        const simpleBytecode = [0x00];
        const frame2 = new EVMFrame(lib, simpleBytecode, 1000000);
        
        // Push some values manually
        console.log('Pushing values: 42, 100, 255');
        frame2.pushU64(42);
        frame2.pushU64(100);
        frame2.pushU64(255);
        
        console.log(`Stack size: ${frame2.stackSize}`);
        console.log(`Stack capacity: ${frame2.stackCapacity}`);
        
        // Peek at top value
        const peekValue = frame2.peekU64();
        console.log(`Top value (peek): ${peekValue}`);
        
        // Pop values
        const values = [];
        while (frame2.stackSize > 0) {
            values.push(frame2.popU64());
        }
        
        console.log(`Popped values: ${values.join(' ')}`);
        console.log(`Final stack size: ${frame2.stackSize}`);
        
        frame2.destroy();
        console.log();
        
        // Example 3: Bytecode inspection
        console.log('Example 3: Bytecode Inspection');
        
        // PUSH1 42, PUSH2 0x1234, POP, STOP
        const complexBytecode = [0x60, 0x2A, 0x61, 0x12, 0x34, 0x50, 0x00];
        const frame3 = new EVMFrame(lib, complexBytecode, 1000000);
        
        console.log(`Bytecode length: ${frame3.bytecodeLen} bytes`);
        console.log(`Bytecode hex: ${complexBytecode.map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        console.log(`Current opcode at PC ${frame3.pc}: 0x${frame3.currentOpcode.toString(16).padStart(2, '0')}`);
        
        frame3.destroy();
        console.log();
        
        // Example 4: Test functions (if available)
        try {
            console.log('Example 4: Running Built-in Tests');
            
            const testResult1 = lib.evm2_test_simple_execution();
            console.log(`Simple execution test: ${lib.evm_error_string(testResult1)}`);
            
            const testResult2 = lib.evm2_test_stack_operations();
            console.log(`Stack operations test: ${lib.evm_error_string(testResult2)}`);
            console.log();
        } catch (e) {
            console.log('Test functions not available in this build');
            console.log();
        }
        
        console.log('All examples completed successfully!');
        
    } finally {
        // Cleanup
        lib.evm2_cleanup();
    }
    
    return 0;
}

// Run the example
if (require.main === module) {
    process.exit(main());
}