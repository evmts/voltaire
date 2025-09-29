// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ControlFlow {
    function benchmark() public pure returns (uint256) {
        uint256 result = 0;
        
        assembly {
            let counter := 0
            
            // Loop with conditional jump
            for { } lt(counter, 100) { } {
                counter := add(counter, 1)
                result := add(result, counter)
            }
            
            // Conditional jump example
            let x := 10
            if eq(x, 10) {
                result := add(result, 100)
            }
            
            // Another loop with modulo check
            for { let i := 0 } lt(i, 50) { i := add(i, 1) } {
                if iszero(mod(i, 2)) {
                    result := add(result, i)
                }
            }
            
            // Add gas remaining (approximation since we can't call gas() in pure)
            result := add(result, 1000000)
        }
        
        return result;
    }
}