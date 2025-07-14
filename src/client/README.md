# Client Package

## Status: Not Currently Under Development

This package is planned for future development but is not actively being worked on at this time.

## Future Vision

The client package will eventually provide:
- Full Ethereum client implementation
- State management and synchronization
- Block processing and validation
- Transaction pool management
- Peer-to-peer networking
- RPC server implementation

## Current Focus

Development efforts are currently focused on:
1. **EVM Package**: Core execution engine implementation
2. **Primitives Package**: Essential types and utilities
3. **Provider Package**: RPC client functionality

## When Development Will Begin

Client development will commence after:
- The EVM implementation is feature-complete
- The provider package has established stable RPC interfaces
- Core primitives are thoroughly tested and optimized

## Contributing

If you're interested in contributing to the client package in the future, please:
- Focus on the currently active packages (EVM, primitives, provider)
- Watch this repository for updates on client development
- Review the architecture decisions in other packages as they will inform client design

## Architecture Notes

When development begins, the client will:
- Build upon the existing EVM implementation
- Use primitives for all core types
- Integrate with the provider package for RPC capabilities
- Follow the testing philosophy outlined in CLAUDE.md (no abstractions)
- Emphasize performance and minimal allocations per Zig best practices