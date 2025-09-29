// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ExternalCode {
    function benchmark() public view returns (uint256) {
        uint256 result = 0;
        address target = address(this);
        
        uint256 size = target.code.length;
        result += size;
        
        bytes32 hash = target.codehash;
        result += uint256(hash);
        
        assembly {
            result := add(result, extcodesize(target))
            
            let memPtr := mload(0x40)
            if lt(size, 1000) {
                extcodecopy(target, memPtr, 0, 100)
                result := add(result, mload(memPtr))
            }
            
            let codeHash := extcodehash(target)
            result := add(result, codeHash)
        }
        
        return result;
    }
}