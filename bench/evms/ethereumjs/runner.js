#!/usr/bin/env bun

import { EVM } from '@ethereumjs/evm';
import { DefaultStateManager } from '@ethereumjs/statemanager';
import { Address, Account } from '@ethereumjs/util';
import { Chain, Common, Hardfork } from '@ethereumjs/common';
import { readFileSync } from 'fs';

const CALLER_ADDRESS = Address.fromString('0x1000000000000000000000000000000000000001');

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
                console.log('EthereumJS EVM runner interface\n');
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
    const contractCode = Buffer.from(contractCodeHex.replace('0x', ''), 'hex');
    
    // Prepare calldata
    const calldata = Buffer.from(calldataHex.replace('0x', ''), 'hex');

    // Create common instance for latest supported hardfork
    const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Cancun });
    
    // Create state manager
    const stateManager = new DefaultStateManager();
    
    // Create EVM instance
    const evm = new EVM({
        common,
        stateManager
    });

    // Set up caller account with large balance
    const callerAccount = Account.fromAccountData({
        balance: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
        nonce: BigInt(0)
    });
    await stateManager.putAccount(CALLER_ADDRESS, callerAccount);
    
    // Deploy the contract first to get runtime code
    const contractAddress = Address.fromString('0x5FbDB2315678afecb367f032d93F642f64180aa3');
    
    // Deploy contract using CREATE to get runtime code
    const deployResult = await evm.runCall({
        caller: CALLER_ADDRESS,
        data: contractCode,
        gasLimit: BigInt(10_000_000),
        gasPrice: BigInt(1),
        value: BigInt(0)
    });
    
    if (deployResult.execResult.exceptionError) {
        throw new Error(`Deployment failed: ${deployResult.execResult.exceptionError.error || deployResult.execResult.exceptionError}`);
    }
    
    // Extract runtime code from deployment result
    const runtimeCode = deployResult.execResult.returnValue;
    if (!runtimeCode || runtimeCode.length === 0) {
        throw new Error('Deployment returned no runtime code');
    }
    
    // Set the runtime code at the contract address
    await stateManager.putContractCode(contractAddress, runtimeCode);

    // Run the benchmark num_runs times
    for (let i = 0; i < numRuns; i++) {
        const startTime = process.hrtime.bigint();
        
        // Execute the contract call
        const result = await evm.runCall({
            caller: CALLER_ADDRESS,
            to: contractAddress,
            data: calldata,
            gasLimit: BigInt(1_000_000_000),
            gasPrice: BigInt(1),
            value: BigInt(0)
        });
        
        const endTime = process.hrtime.bigint();
        const durationNs = endTime - startTime;
        const durationMs = Number(durationNs) / 1_000_000;
        
        // Check for errors
        if (result.execResult.exceptionError) {
            throw new Error(`Call failed: ${result.execResult.exceptionError.error || result.execResult.exceptionError}`);
        }
        
        // Output timing in milliseconds (one per line as expected by orchestrator)
        console.log(durationMs.toFixed(6));
    }
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});