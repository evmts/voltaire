// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Memory {
    function benchmark() public pure returns (uint256) {
        uint256 result = 0;
        
        assembly {
            let memPtr := mload(0x40)
            
            for { let i := 0 } lt(i, 1000) { i := add(i, 1) } {
                mstore(add(memPtr, mul(i, 0x20)), i)
                
                let value := mload(add(memPtr, mul(i, 0x20)))
                result := add(result, value)
                
                if iszero(mod(i, 100)) {
                    mstore8(add(memPtr, i), byte(0, value))
                }
            }
            
            result := add(result, msize())
        }
        
        return result;
    }
}