# ParcelChain DApp

A decentralized application built on Solana for managing package deliveries with escrow functionality.

## Features

- Package registration and tracking
- Carrier management with reputation system
- SOL-based escrow system for secure payments
- Platform fee management
- Smart contract-based delivery verification

## Prerequisites

- Node.js (v16 or later)
- Rust (latest stable)
- Solana CLI tools
- Anchor framework

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/parcelchain-dapp.git
cd parcelchain-dapp
```

2. Install dependencies:
```bash
npm install
```

3. Build the program:
```bash
anchor build
```

4. Deploy the program:
```bash
anchor deploy
```

## Project Structure

```
parcelchain-dapp/
├── programs/              # Rust program source code
│   └── parcelchain-dapp/
│       ├── src/
│       │   ├── lib.rs     # Main program logic
│       │   ├── state.rs   # Program state definitions
│       │   └── errors.rs  # Custom error definitions
│       └── Cargo.toml     # Rust dependencies
├── tests/                 # Test files
│   └── parcelchain-dapp.ts
├── target/               # Build output
├── Anchor.toml          # Anchor configuration
└── package.json         # Node.js dependencies
```

## Key Components

### Package Management
- Register packages with dimensions and weight
- Track package status (Registered, InTransit, Delivered)
- Assign carriers to packages

### Carrier System
- Create carrier accounts with reputation
- Track completed deliveries
- Manage carrier performance

### Escrow System
- Create escrow accounts for package payments
- Fund escrow with SOL
- Release funds upon successful delivery
- Handle platform fees

### Platform Management
- Initialize platform with default token
- Configure platform fee rates
- Track total packages

## Testing

Run the test suite:
```bash
anchor test
```

The test suite includes:
- Platform initialization
- Package registration
- Carrier creation
- Package delivery acceptance
- Escrow creation and management

## Smart Contract Architecture

The program uses Program Derived Addresses (PDAs) for:
- Platform account
- Package accounts
- Carrier accounts
- Escrow accounts

## Security Features

- Rent exemption handling
- Proper account validation
- Secure fund transfers
- Reputation-based carrier system

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 