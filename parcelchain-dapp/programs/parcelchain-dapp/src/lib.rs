#![feature(trivial_bounds)]
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

declare_id!("3mG95ZAAcoJdwsnufkcyo1hSivS1cD7R4rvekyoLbZzm");

/// ParcelChain program module containing all instructions
#[program]
pub mod parcelchain_dapp {
    use super::*;

    /// Initializes the platform with the given authority and fee rate
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let platform = &mut ctx.accounts.platform;
        platform.authority = ctx.accounts.authority.key();
        platform.fee_rate = 200; // 2% platform fee
        platform.total_packages = 0;
        platform.reputation_increase = 10; // Default reputation increase
        Ok(())
    }

    /// Creates a new carrier account with the specified initial reputation
    pub fn create_carrier(ctx: Context<CreateCarrier>, initial_reputation: u8) -> Result<()> {
        require!(initial_reputation <= 100, ErrorCode::InvalidReputation);
        
        let carrier = &mut ctx.accounts.carrier;
        carrier.authority = ctx.accounts.authority.key();
        carrier.reputation = initial_reputation;
        carrier.completed_deliveries = 0;
        carrier.bump = ctx.bumps.carrier;
        Ok(())
    }

    /// Registers a new package for delivery
    pub fn register_package(
        ctx: Context<RegisterPackage>,
        description: String,
        weight: u32,
        dimensions: [u32; 3],
        price: u64,
        package_id: u8,
    ) -> Result<()> {
        let package = &mut ctx.accounts.package;
        let platform = &mut ctx.accounts.platform;
        let clock = Clock::get()?;

        // Initialize package
        package.id = package_id as u64;
        package.sender = ctx.accounts.sender.key();
        package.description = description;
        package.weight = weight;
        package.dimensions = dimensions;
        package.price = price;
        package.status = PackageStatus::Registered;
        package.created_at = clock.unix_timestamp;
        package.accepted_at = 0;
        package.delivered_at = 0;

        // Update platform stats
        platform.total_packages = platform.total_packages.checked_add(1).unwrap();

        Ok(())
    }

    /// Accepts a package delivery request by a carrier
    pub fn accept_delivery(ctx: Context<AcceptDelivery>) -> Result<()> {
        let package = &mut ctx.accounts.package;
        let carrier = &mut ctx.accounts.carrier;

        require!(package.status == PackageStatus::Registered, ErrorCode::InvalidPackageStatus);
        require!(carrier.reputation >= 50, ErrorCode::InsufficientReputation);

        package.carrier = ctx.accounts.carrier.key();
        package.status = PackageStatus::InTransit;
        package.accepted_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Creates a new escrow account for the package
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let package = &mut ctx.accounts.package;
        let clock = Clock::get()?;

        escrow.package = package.key();
        escrow.sender = ctx.accounts.sender.key();
        escrow.carrier = package.carrier;
        escrow.amount = amount;
        escrow.created_at = clock.unix_timestamp;
        escrow.released_at = 0;
        escrow.status = EscrowStatus::Created;
        escrow.bump = ctx.bumps.escrow;

        Ok(())
    }

    /// Completes a package delivery and distributes payment
    pub fn complete_delivery(ctx: Context<CompleteDelivery>) -> Result<()> {
        let package = &mut ctx.accounts.package;
        let carrier = &mut ctx.accounts.carrier;
        let platform = &mut ctx.accounts.platform;
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        require!(package.status == PackageStatus::InTransit, ErrorCode::InvalidPackageStatus);
        require!(escrow.status == EscrowStatus::Created, ErrorCode::InvalidEscrowAccount);

        // Update package status
        package.status = PackageStatus::Delivered;
        package.delivered_at = clock.unix_timestamp;

        // Update carrier stats
        carrier.completed_deliveries = carrier.completed_deliveries.checked_add(1).unwrap();
        carrier.reputation = carrier.reputation.checked_add(platform.reputation_increase).unwrap();

        // Update escrow status
        escrow.status = EscrowStatus::Released;
        escrow.released_at = clock.unix_timestamp;

        Ok(())
    }
}

/// Context for initializing the platform
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 2 + 8 + 1,
        seeds = [b"platform"],
        bump
    )]
    pub platform: Account<'info, Platform>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Context for registering a new package
#[derive(Accounts)]
#[instruction(description: String, weight: u32, dimensions: [u32; 3], price: u64, package_id: u8)]
pub struct RegisterPackage<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + 32 + 32 + 300 + 4 + 12 + 8 + 1 + 8 + 8 + 8,
        seeds = [b"package", platform.key().as_ref(), &[package_id]],
        bump
    )]
    pub package: Account<'info, Package>,
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(mut)]
    pub platform: Account<'info, Platform>,
    pub system_program: Program<'info, System>,
}

/// Context for accepting a package delivery
#[derive(Accounts)]
pub struct AcceptDelivery<'info> {
    #[account(mut)]
    pub package: Account<'info, Package>,
    #[account(
        mut,
        seeds = [b"carrier", carrier.authority.as_ref()],
        bump
    )]
    pub carrier: Account<'info, Carrier>,
    pub system_program: Program<'info, System>,
}

/// Context for creating a new escrow account
#[derive(Accounts)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + 8 + 32 + 32 + 1,
        seeds = [b"escrow", package.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(mut)]
    pub sender_token: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = sender,
        associated_token::mint = token_mint,
        associated_token::authority = escrow
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub package: Account<'info, Package>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/// Context for completing a package delivery
#[derive(Accounts)]
pub struct CompleteDelivery<'info> {
    #[account(mut)]
    pub package: Account<'info, Package>,
    #[account(
        mut,
        seeds = [b"carrier", carrier.authority.as_ref()],
        bump
    )]
    pub carrier: Account<'info, Carrier>,
    #[account(mut)]
    pub platform: Account<'info, Platform>,
    #[account(
        mut,
        seeds = [b"escrow", package.key().as_ref()],
        bump = escrow.bump,
        constraint = escrow.carrier == carrier.key()
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub carrier_token: Account<'info, TokenAccount>,
    /// CHECK: This account receives rent from closing escrow token account
    #[account(mut)]
    pub sender: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

/// Context for creating a new carrier account
#[derive(Accounts)]
pub struct CreateCarrier<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1 + 4 + 1,  // 8 (discriminator) + 32 (authority) + 1 (reputation) + 4 (completed_deliveries) + 1 (bump)
        seeds = [b"carrier", authority.key().as_ref()],
        bump
    )]
    pub carrier: Account<'info, Carrier>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Platform account state
#[account]
pub struct Platform {
    /// Public key of the platform owner/authority
    pub authority: Pubkey,
    /// Platform fee rate in basis points (e.g., 200 = 2%)
    pub fee_rate: u16,
    /// Total number of packages registered on the platform
    pub total_packages: u64,
    pub reputation_increase: u8,
}

/// Package account state
#[account]
pub struct Package {
    /// Unique identifier for the package
    pub id: u64,
    /// Public key of the package sender
    pub sender: Pubkey,
    /// Public key of the assigned carrier
    pub carrier: Pubkey,
    /// Description of the package contents
    pub description: String,
    /// Weight of the package in grams
    pub weight: u32,
    /// Package dimensions [length, width, height] in centimeters
    pub dimensions: [u32; 3],
    /// Delivery price in lamports
    pub price: u64,
    /// Current status of the package delivery
    pub status: PackageStatus,
    /// Unix timestamp when the package was registered
    pub created_at: i64,
    /// Unix timestamp when the carrier accepted the delivery
    pub accepted_at: i64,
    /// Unix timestamp when the package was delivered
    pub delivered_at: i64,
}

/// Carrier account state
#[account]
pub struct Carrier {
    /// Public key of the carrier's authority
    pub authority: Pubkey,
    /// Carrier's reputation score (0-255)
    pub reputation: u8,
    /// Number of successfully completed deliveries
    pub completed_deliveries: u32,
    /// Bump seed for the carrier PDA
    pub bump: u8,
}

/// Escrow account state
#[account]
pub struct Escrow {
    /// Public key of the package
    pub package: Pubkey,
    /// Public key of the sender
    pub sender: Pubkey,
    /// Public key of the carrier
    pub carrier: Pubkey,
    /// Amount of tokens in escrow
    pub amount: u64,
    /// Unix timestamp when the escrow was created
    pub created_at: i64,
    /// Unix timestamp when the escrow was released
    pub released_at: i64,
    /// Current status of the escrow
    pub status: EscrowStatus,
    /// Bump seed for the escrow PDA
    pub bump: u8,
}

/// Package status enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum PackageStatus {
    /// Package is registered but not yet assigned to a carrier
    Registered,
    /// Package is assigned to a carrier and in transit
    InTransit,
    /// Package has been successfully delivered
    Delivered,
}

/// Escrow status enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum EscrowStatus {
    /// Escrow account is created but not yet funded
    Created,
    /// Escrow account is funded and ready for release
    Funded,
    /// Escrow account has been released
    Released,
}

/// Error codes for the program
#[error_code]
pub enum ErrorCode {
    /// Package status is invalid for the requested operation
    #[msg("Invalid package status")]
    InvalidPackageStatus,
    /// Carrier's reputation is insufficient for the operation
    #[msg("Insufficient reputation")]
    InsufficientReputation,
    /// Operation attempted by unauthorized account
    #[msg("Unauthorized")]
    Unauthorized,
    /// Package dimensions are invalid (zero or negative)
    #[msg("Invalid dimensions")]
    InvalidDimensions,
    /// Package price is invalid (zero or negative)
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Insufficient escrow balance")]
    InsufficientEscrowBalance,
    #[msg("Invalid escrow account")]
    InvalidEscrowAccount,
    #[msg("Platform already initialized")]
    AlreadyInitialized,
    #[msg("Invalid fee rate")]
    InvalidFeeRate,
    #[msg("Invalid reputation")]
    InvalidReputation,
}

#[event]
pub struct PlatformInitialized {
    pub authority: Pubkey,
    pub fee_rate: u16,
}
