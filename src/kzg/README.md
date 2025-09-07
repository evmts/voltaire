# KZG Trusted Setup

This directory contains the KZG trusted setup file required for EIP-4844 (Proto-Danksharding) support.

## Download Instructions

The trusted setup file is not included in the repository due to its size (~788KB). You need to download it manually:

```bash
curl -L -o src/kzg/trusted_setup.txt https://github.com/ethereum/c-kzg-4844/raw/main/src/trusted_setup.txt
```

## About the Trusted Setup

The trusted setup file was generated through the Ethereum KZG Ceremony, which had over 141,000 participants. This ceremony created the cryptographic foundation needed for EIP-4844's polynomial commitment scheme.

## File Format

The file contains:
- First line: Number of G1 points (4096)
- Second line: Number of G2 points (65)
- Following lines: The points in hexadecimal format

## Security

The security of the KZG scheme depends on at least one honest participant in the ceremony. With over 141,000 participants, this requirement is easily met.

## Source

Official source: https://github.com/ethereum/c-kzg-4844