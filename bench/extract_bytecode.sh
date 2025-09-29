#!/bin/bash

# Create cache directory if it doesn't exist
mkdir -p bench/fixtures/cache

# Extract deployed bytecode for each fixture
for json_file in bench/fixtures/*.json; do
    # Get the base name without .json extension
    fixture_name=$(basename "$json_file" .json)

    # Skip if it's not a fixture file (e.g., solidity-files-cache.json)
    if [[ "$fixture_name" == "solidity-files-cache" ]]; then
        continue
    fi

    # Read the contract name from the fixture JSON
    contract=$(jq -r '.contract' "$json_file" 2>/dev/null)

    if [[ -n "$contract" ]]; then
        # Remove .sol extension to get contract name
        contract_name=$(basename "$contract" .sol)

        # Try multiple paths for the compiled JSON file
        compiled_json="bench/fixtures/out/fixtures/${contract}/${contract_name}.json"
        if [[ ! -f "$compiled_json" ]]; then
            # Try evm-benchmarks directory
            compiled_json="bench/fixtures/out/evm-benchmarks/fixtures/${contract}/${contract_name}.json"
        fi

        if [[ -f "$compiled_json" ]]; then
            # Extract deployed bytecode (runtime bytecode)
            bytecode=$(jq -r '.deployedBytecode.object' "$compiled_json" 2>/dev/null)

            if [[ -n "$bytecode" && "$bytecode" != "null" ]]; then
                # Save bytecode to cache file
                echo "$bytecode" > "bench/fixtures/cache/${fixture_name}.bin"
                echo "Extracted bytecode for ${fixture_name}"
            else
                echo "Warning: No deployedBytecode found for ${fixture_name}"
            fi
        else
            echo "Warning: Compiled file not found: ${compiled_json}"
        fi
    fi
done

echo "Done extracting bytecode to cache directory"