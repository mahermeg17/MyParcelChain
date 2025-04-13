# ParcelChain dApp

A decentralized package delivery management system built on Solana using the Anchor framework.

## Overview

ParcelChain is a blockchain-based solution for managing package deliveries, connecting senders with carriers in a trustless environment. The platform handles package registration, delivery tracking, and secure payment processing while maintaining a reputation system for carriers.

## Features

- **Package Management**
  - Register new packages with detailed specifications
  - Track package status (Registered, In Transit, Delivered)
  - Secure payment escrow system

- **Carrier System**
  - Carrier registration and reputation management
  - Minimum reputation requirements for accepting deliveries
  - Automatic reputation updates based on successful deliveries

- **Platform Features**
  - 2% platform fee on successful deliveries
  - Global package tracking
  - Secure payment distribution

## Technical Details

### Program ID
```
3mG95ZAAcoJdwsnufkcyo1hSivS1cD7R4rvekyoLbZzm
```

### Account Structures

#### Platform Account
- Authority (owner) public key
- Fee rate (2% by default)
- Total packages counter
- Reputation increase parameter

#### Package Account
- Unique ID
- Sender and carrier public keys
- Package details (description, weight, dimensions)
- Price
- Status tracking
- Timestamps for key events

#### Carrier Account
- Authority public key
- Reputation score (0-255)
- Completed deliveries counter

### Instructions

1. **Initialize Platform**
   - Sets up the platform with initial authority and fee rate
   - Creates the platform account

2. **Create Carrier**
   - Registers new carriers with initial reputation
   - Uses PDA for carrier accounts

3. **Register Package**
   - Creates new package delivery requests
   - Validates package dimensions and price
   - Updates platform package counter

4. **Accept Delivery**
   - Allows carriers to accept package deliveries
   - Requires minimum reputation (50)
   - Updates package status to In Transit

5. **Complete Delivery**
   - Finalizes package delivery
   - Handles payment distribution
   - Updates carrier reputation

## Error Handling

The program includes comprehensive error handling with custom error codes for:
- Invalid package status
- Insufficient reputation
- Unauthorized operations
- Invalid dimensions/price
- Escrow-related issues

## Security Features

- Program Derived Addresses (PDAs) for account derivation
- Strict access controls
- Validation checks for all operations
- Secure payment handling through escrow

## Getting Started

### Prerequisites

- Rust (latest stable version)
- Solana CLI tools
- Anchor framework

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/parcelchain-dapp.git
cd parcelchain-dapp
```

2. Install dependencies
```bash
anchor build
```

3. Deploy the program
```bash
anchor deploy
```

## Testing

Run the test suite:
```bash
anchor test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Solana Foundation
- Anchor Framework
- All contributors to the project 