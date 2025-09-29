// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CodeCopy {
    function benchmark() public view returns (uint256) {
        uint256 result = 0;
        
        assembly {
            let size := codesize()
            result := add(result, size)
            
            let memPtr := mload(0x40)
            
            codecopy(memPtr, 0, 100)
            result := add(result, mload(memPtr))
            
            if lt(size, 1000) {
                codecopy(add(memPtr, 100), 100, 100)
                result := add(result, mload(add(memPtr, 100)))
            }
            
            for { let i := 0 } lt(i, 10) { i := add(i, 1) } {
                let offset := mul(i, 32)
                if lt(offset, size) {
                    codecopy(memPtr, offset, 32)
                    result := add(result, mload(memPtr))
                }
            }
        }
        
        return result;
    }
}