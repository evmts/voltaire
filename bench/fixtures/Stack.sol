// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Stack {
    function benchmark() public pure returns (uint256) {
        uint256 result = 0;
        
        assembly {
            let a := 1
            let b := 2
            let c := 3
            let d := 4
            let e := 5
            let f := 6
            let g := 7
            let h := 8
            
            for { let i := 0 } lt(i, 100) { i := add(i, 1) } {
                // POP operation
                pop(add(a, b))
                
                // DUP operations - store on stack and use
                let temp := c
                temp := add(temp, d)
                temp := add(temp, e) 
                temp := add(temp, f)
                temp := add(temp, h)
                
                // SWAP operations - exchange values
                let t1 := a
                a := b
                b := t1
                
                let t2 := c
                c := d
                d := t2
                
                let t3 := e
                e := f
                f := t3
                
                let t4 := g
                g := h
                h := t4
                
                result := add(result, temp)
            }
            
            result := add(result, pc())
        }
        
        return result;
    }
}