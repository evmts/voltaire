#!/usr/bin/env bun

import { createMemoryClient } from '@tevm/memory-client';
import { readFileSync } from 'fs';

const CALLER_ADDRESS = '0x1000000000000000000000000000000000000001';

async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let contractCodePath = '';
    let calldataHex = '';
    let numRuns = 1;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--contract-code-path':
                contractCodePath = args[++i];
                break;
            case '--calldata':
                calldataHex = args[++i];
                break;
            case '--num-runs':
            case '-n':
                numRuns = parseInt(args[++i]);
                break;
            case '--help':
            case '-h':
                console.log('TEVM runner interface\n');
                console.log('Usage: runner [OPTIONS]\n');
                console.log('Options:');
                console.log('  --contract-code-path <PATH>  Path to the hex contract code to deploy and run');
                console.log('  --calldata <HEX>            Hex of calldata to use when calling the contract');
                console.log('  -n, --num-runs <N>          Number of times to run the benchmark [default: 1]');
                console.log('  -h, --help                  Print help information');
                process.exit(0);
        }
    }

    // Read contract code
    const contractCodeHex = readFileSync(contractCodePath, 'utf8').trim();
    const contractCode = contractCodeHex.startsWith('0x') ? contractCodeHex : '0x' + contractCodeHex;
    
    // Prepare calldata
    const calldata = calldataHex.startsWith('0x') ? calldataHex : '0x' + calldataHex;

    // Create memory client once - outside the loop
    const client = createMemoryClient();

    // Set up caller account with large balance
    await client.tevmSetAccount({
        address: CALLER_ADDRESS,
        balance: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
        nonce: 0n
    });

    // Calculate deterministic contract address (CREATE opcode with nonce 0)
    const contractAddress = '0x5DDDfCe53EE040D9EB21AFbC0aE1BB4Dbb0BA643';
    
    // Set the contract code directly as deployed bytecode
    await client.tevmSetAccount({
        address: contractAddress,
        deployedBytecode: contractCode,
        balance: 0n,
        nonce: 1n  // Contract nonce starts at 1
    });

    // Run the benchmark num_runs times
    for (let i = 0; i < numRuns; i++) {
        const startTime = process.hrtime.bigint();
        
        // Execute the contract call
        const result = await client.tevmCall({
            from: CALLER_ADDRESS,
            to: contractAddress,
            data: calldata,
            gas: 1_000_000_000n
        });
        
        // Check for errors
        if (result.errors && result.errors.length > 0) {
            throw new Error(`Call failed: ${result.errors[0].message}`);
        }
        
        const endTime = process.hrtime.bigint();
        const durationNs = endTime - startTime;
        const durationMs = Number(durationNs) / 1_000_000;
        
        // Output timing (rounded to nearest ms, minimum 1)
        console.log(Math.max(1, Math.round(durationMs)));
    }
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});