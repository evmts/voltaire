// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReturnData {
    function helper() public pure returns (uint256, bytes memory) {
        return (42, abi.encode("test data", 123));
    }
    
    function benchmark() public view returns (uint256) {
        uint256 result = 0;
        
        (bool success, bytes memory data) = address(this).staticcall(
            abi.encodeWithSignature("helper()")
        );
        
        if (success) {
            assembly {
                let size := returndatasize()
                result := add(result, size)
                
                let memPtr := mload(0x40)
                returndatacopy(memPtr, 0, size)
                result := add(result, mload(memPtr))
            }
        }
        
        assembly {
            let memPtr := mload(0x40)
            mstore(memPtr, result)
            return(memPtr, 32)
        }
    }
    
    function failingFunction() public pure {
        assembly {
            let memPtr := mload(0x40)
            mstore(memPtr, 0x08c379a000000000000000000000000000000000000000000000000000000000)
            mstore(add(memPtr, 4), 32)
            mstore(add(memPtr, 36), 13)
            mstore(add(memPtr, 68), "Error message")
            revert(memPtr, 100)
        }
    }
}