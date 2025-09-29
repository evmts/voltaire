// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Calldata {
    function benchmark(bytes calldata input) public pure returns (uint256) {
        uint256 result = 0;
        uint256 dataSize = input.length;
        
        assembly {
            result := add(result, calldatasize())
            
            for { let i := 0 } lt(i, 100) { i := add(i, 1) } {
                let offset := mod(mul(i, 32), dataSize)
                if lt(offset, sub(dataSize, 32)) {
                    let value := calldataload(add(68, offset))
                    result := add(result, value)
                }
            }
            
            let dest := mload(0x40)
            if lt(dataSize, 1000) {
                calldatacopy(dest, 68, dataSize)
                result := add(result, mload(dest))
            }
        }
        
        return result;
    }
}