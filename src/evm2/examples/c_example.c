#include "../evm2_c.h"
#include <stdio.h>
#include <stdint.h>

int main() {
    printf("EVM2 C API Example\n");
    printf("==================\n\n");
    
    // Display library information
    printf("Library version: %s\n", evm2_version());
    printf("Build info: %s\n\n", evm2_build_info());
    
    // Initialize library
    if (evm2_init() != 0) {
        printf("Failed to initialize EVM2 library\n");
        return 1;
    }
    
    // Example 1: Simple arithmetic - PUSH1 5, PUSH1 10, ADD, STOP
    printf("Example 1: Simple Arithmetic (5 + 10)\n");
    printf("Bytecode: PUSH1 5, PUSH1 10, ADD, STOP\n");
    
    uint8_t bytecode[] = {0x60, 0x05, 0x60, 0x0A, 0x01, 0x00};
    
    // Create frame
    evm_frame_t frame = evm_frame_create(bytecode, sizeof(bytecode), 1000000);
    if (!frame) {
        printf("Failed to create frame\n");
        return 1;
    }
    
    printf("Initial gas: %lu\n", evm_frame_get_gas_remaining(frame));
    printf("Stack size: %u\n", evm_frame_stack_size(frame));
    printf("Program counter: %u\n", evm_frame_get_pc(frame));
    
    // Execute
    int result = evm_frame_execute(frame);
    printf("Execution result: %s\n", evm_error_string(result));
    
    if (result == EVM_SUCCESS || evm_error_is_stop(result)) {
        printf("Gas remaining: %lu\n", evm_frame_get_gas_remaining(frame));
        printf("Gas used: %lu\n", evm_frame_get_gas_used(frame));
        printf("Final stack size: %u\n", evm_frame_stack_size(frame));
        
        // Pop the result
        if (evm_frame_stack_size(frame) > 0) {
            uint64_t value;
            if (evm_frame_pop_u64(frame, &value) == EVM_SUCCESS) {
                printf("Result value: %lu\n", value);
            }
        }
    }
    
    evm_frame_destroy(frame);
    printf("\n");
    
    // Example 2: Stack operations
    printf("Example 2: Manual Stack Operations\n");
    
    // Just STOP instruction for testing stack operations
    uint8_t simple_bytecode[] = {0x00};
    
    frame = evm_frame_create(simple_bytecode, sizeof(simple_bytecode), 1000000);
    if (!frame) {
        printf("Failed to create frame\n");
        return 1;
    }
    
    // Push some values manually
    printf("Pushing values: 42, 100, 255\n");
    evm_frame_push_u64(frame, 42);
    evm_frame_push_u64(frame, 100);
    evm_frame_push_u64(frame, 255);
    
    printf("Stack size: %u\n", evm_frame_stack_size(frame));
    printf("Stack capacity: %u\n", evm_frame_stack_capacity(frame));
    
    // Peek at top value
    uint64_t peek_value;
    if (evm_frame_peek_u64(frame, &peek_value) == EVM_SUCCESS) {
        printf("Top value (peek): %lu\n", peek_value);
    }
    
    // Pop values
    printf("Popping values: ");
    while (evm_frame_stack_size(frame) > 0) {
        uint64_t value;
        if (evm_frame_pop_u64(frame, &value) == EVM_SUCCESS) {
            printf("%lu ", value);
        }
    }
    printf("\n");
    
    printf("Final stack size: %u\n", evm_frame_stack_size(frame));
    
    evm_frame_destroy(frame);
    printf("\n");
    
    // Example 3: Bytecode inspection
    printf("Example 3: Bytecode Inspection\n");
    
    // PUSH1 42, PUSH2 0x1234, POP, STOP
    uint8_t complex_bytecode[] = {0x60, 0x2A, 0x61, 0x12, 0x34, 0x50, 0x00};
    
    frame = evm_frame_create(complex_bytecode, sizeof(complex_bytecode), 1000000);
    if (!frame) {
        printf("Failed to create frame\n");
        return 1;
    }
    
    printf("Bytecode length: %zu bytes\n", evm_frame_get_bytecode_len(frame));
    printf("Bytecode hex: ");
    for (size_t i = 0; i < sizeof(complex_bytecode); i++) {
        printf("%02x ", complex_bytecode[i]);
    }
    printf("\n");
    
    printf("Current opcode at PC %u: 0x%02x\n", 
           evm_frame_get_pc(frame), 
           evm_frame_get_current_opcode(frame));
    
    evm_frame_destroy(frame);
    printf("\n");
    
    // Example 4: Test functions (debug builds only)
    #ifndef NDEBUG
    printf("Example 4: Running Built-in Tests\n");
    
    result = evm2_test_simple_execution();
    printf("Simple execution test: %s\n", evm_error_string(result));
    
    result = evm2_test_stack_operations();
    printf("Stack operations test: %s\n", evm_error_string(result));
    #endif
    
    // Cleanup
    evm2_cleanup();
    
    printf("\nAll examples completed successfully!\n");
    return 0;
}