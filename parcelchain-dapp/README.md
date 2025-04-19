# ParcelChain DApp

A decentralized application for package delivery management on the Solana blockchain.

## Features

- Package registration and tracking
- Carrier management and delivery assignment
- Escrow-based payment system
- Platform fee management
- Secure delivery completion with payment distribution

## Prerequisites

- Node.js (v16 or later)
- Yarn package manager
- Solana CLI tools
- Anchor framework (v0.30.1)
- Rust (latest stable version)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/parcelchain-dapp.git
cd parcelchain-dapp
```

2. Install dependencies:
```bash
yarn install
```

3. Build the program:
```bash
anchor build
```

## Development

### Project Structure

```
parcelchain-dapp/
├── programs/
│   └── parcelchain-dapp/
│       ├── src/
│       │   ├── lib.rs           # Main program logic
│       │   └── state/
│       │       ├── mod.rs       # State module exports
│       │       ├── carrier.rs   # Carrier account structure
│       │       ├── package.rs   # Package account structure
│       │       ├── platform.rs  # Platform account structure
│       │       └── escrow.rs    # Escrow account structure
│       └── Cargo.toml
├── tests/
│   └── parcelchain-dapp.ts      # Test suite
├── Anchor.toml                   # Anchor configuration
└── package.json                  # Node.js dependencies
```

### Key Components

1. **Package Management**
   - Register packages with details (dimensions, weight, etc.)
   - Track package status (registered, in-transit, delivered)
   - Assign carriers to packages

2. **Carrier System**
   - Create carrier accounts
   - Accept delivery assignments
   - Complete deliveries and receive payments

3. **Escrow System**
   - Secure payment handling during delivery
   - Automatic payment distribution upon delivery completion
   - Platform fee collection

4. **Platform Management**
   - Set and update platform fees
   - Manage platform authority

### Testing

Run the test suite:
```bash
anchor test
```

## Configuration

The project uses the following versions:
- Anchor: 0.30.1
- Solana Program: 1.18.26
- Node.js: v16 or later

## License

This project is licensed under the MIT License - see the LICENSE file for details. 