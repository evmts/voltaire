/**
 * Standard hash of empty string - used for EOA code hash
 * keccak256("") = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
 */
export const EMPTY_CODE_HASH = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
/**
 * Standard hash of empty trie - used for EOA storage root
 * keccak256(rlp([])) = 0x56e81f171bcc55a6ff8345e692c0f86e5b47e5b60e2d8c5ab6c7c9fa0e32d3c5
 */
export const EMPTY_TRIE_HASH = "0x56e81f171bcc55a6ff8345e692c0f86e5b47e5b60e2d8c5ab6c7c9fa0e32d3c5";
