#include <evmc/evmc.h>
#include <evmc/mocked_host.hpp>
#include <evmone/evmone.h>

#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <chrono>
#include <cstring>
#include <iomanip>

// Convert hex string to bytes
evmc::bytes hex_to_bytes(const std::string& hex) {
    std::string clean_hex = hex;
    if (clean_hex.substr(0, 2) == "0x") {
        clean_hex = clean_hex.substr(2);
    }
    
    evmc::bytes bytes;
    evmc::from_hex(clean_hex.begin(), clean_hex.end(), std::back_inserter(bytes));
    return bytes;
}

int main(int argc, char* argv[]) {
    std::string contract_code_path;
    std::string calldata_hex;
    int num_runs = 1;
    
    // Parse arguments
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "--contract-code-path" && i + 1 < argc) {
            contract_code_path = argv[++i];
        } else if (arg == "--calldata" && i + 1 < argc) {
            calldata_hex = argv[++i];
        } else if ((arg == "--num-runs" || arg == "-n") && i + 1 < argc) {
            num_runs = std::stoi(argv[++i]);
        } else if (arg == "--help" || arg == "-h") {
            std::cout << "evmone runner interface\n\n";
            std::cout << "Usage: runner [OPTIONS]\n\n";
            std::cout << "Options:\n";
            std::cout << "  --contract-code-path <PATH>  Path to the hex contract code to deploy and run\n";
            std::cout << "  --calldata <HEX>            Hex of calldata to use when calling the contract\n";
            std::cout << "  -n, --num-runs <N>          Number of times to run the benchmark [default: 1]\n";
            std::cout << "  -h, --help                  Print help information\n";
            return 0;
        }
    }
    
    // Read contract code
    std::ifstream file(contract_code_path);
    if (!file) {
        std::cerr << "Failed to open contract code file: " << contract_code_path << std::endl;
        return 1;
    }
    
    std::string contract_code_hex;
    std::getline(file, contract_code_hex);
    auto contract_code = hex_to_bytes(contract_code_hex);
    
    // Prepare calldata
    auto calldata = hex_to_bytes(calldata_hex);
    
    // Create evmone VM
    evmc_vm* vm = evmc_create_evmone();
    if (!vm) {
        std::cerr << "Failed to create evmone VM" << std::endl;
        return 1;
    }
    
    // Set up addresses
    evmc::address caller_address{{0x10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x01}};
    evmc::address contract_address = evmc::from_hex<evmc::address>("5DDDfCe53EE040D9EB21AFbC0aE1BB4Dbb0BA643").value();
    
    // Create host and deploy contract once
    evmc::MockedHost host;
    
    // Set up caller account with max balance
    host.accounts[caller_address].balance = evmc::bytes32{{
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff
    }};
    
    // Deploy contract first
    evmc_message create_msg{};
    create_msg.kind = EVMC_CREATE;
    create_msg.gas = 10000000;
    create_msg.sender = caller_address;
    create_msg.input_data = contract_code.data();
    create_msg.input_size = contract_code.size();
    
    evmc_result create_result = evmc_execute(vm, &host.get_interface(), 
                                            (evmc_host_context*)&host,
                                            EVMC_SHANGHAI, &create_msg, 
                                            nullptr, 0);
    
    if (create_result.status_code != EVMC_SUCCESS) {
        std::cerr << "Contract creation failed with status: " << create_result.status_code << std::endl;
        if (create_result.release) create_result.release(&create_result);
        evmc_destroy(vm);
        return 1;
    }
    
    // Get deployed contract address and code
    evmc::address deployed_address = create_result.create_address;
    
    // Store the deployed code in the host
    if (create_result.output_data && create_result.output_size > 0) {
        evmc::bytes deployed_code(create_result.output_data, create_result.output_data + create_result.output_size);
        host.accounts[deployed_address].code = std::move(deployed_code);
    }
    
    // Clean up create result
    if (create_result.release) create_result.release(&create_result);
    
    // Run benchmark
    for (int i = 0; i < num_runs; i++) {
        auto start = std::chrono::high_resolution_clock::now();
        
        // Prepare call message
        evmc_message msg{};
        msg.kind = EVMC_CALL;
        msg.gas = 1000000000;
        msg.recipient = deployed_address;
        msg.sender = caller_address;
        msg.input_data = calldata.data();
        msg.input_size = calldata.size();
        
        // Execute call
        evmc_result result = evmc_execute(vm, &host.get_interface(), 
                                         (evmc_host_context*)&host,
                                         EVMC_SHANGHAI, &msg, 
                                         nullptr, 0);
        
        auto end = std::chrono::high_resolution_clock::now();
        
        // Check for errors
        if (result.status_code != EVMC_SUCCESS) {
            std::cerr << "Execution failed with status: " << result.status_code << std::endl;
            if (result.release) result.release(&result);
            evmc_destroy(vm);
            return 1;
        }
        
        // Clean up result
        if (result.release) result.release(&result);
        
        // Calculate duration
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
        double duration_ms = duration / 1000.0;
        
        // Output timing (rounded to nearest ms, minimum 1)
        long ms = static_cast<long>(duration_ms + 0.5);
        if (ms < 1) ms = 1;
        std::cout << ms << std::endl;
    }
    
    evmc_destroy(vm);
    return 0;
}