use anchor_lang::prelude::*;

declare_id!("3mG95ZAAcoJdwsnufkcyo1hSivS1cD7R4rvekyoLbZzm");


/// ParcelChain program module containing all instructions
#[program]
pub mod parcelchain_dapp {
    use super::*;

    /// Initializes the platform with the given authority and fee rate
    /// 
    /// # Arguments
    /// * `ctx` - Context containing the platform and authority accounts
    /// 
    /// # Errors
    /// Returns an error if the platform account cannot be initialized
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let platform = &mut ctx.accounts.platform;
        platform.authority = ctx.accounts.authority.key();
        platform.fee_rate = 200; // 2% platform fee
        platform.total_packages = 0;
        platform.reputation_increase = 10; // Default reputation increase
        Ok(())
    }

    /// Creates a new carrier account with the specified initial reputation
    /// 
    /// # Arguments
    /// * `ctx` - Context containing the carrier and authority accounts
    /// * `initial_reputation` - Initial reputation score for the carrier (0-255)
    /// 
    /// # Errors
    /// Returns an error if the carrier account cannot be initialized
    pub fn create_carrier(ctx: Context<CreateCarrier>, initial_reputation: u8) -> Result<()> {
        let carrier = &mut ctx.accounts.carrier;
        carrier.authority = ctx.accounts.authority.key();
        carrier.reputation = initial_reputation;
        carrier.completed_deliveries = 0;
        Ok(())
    }

    /// Registers a new package for delivery
    /// 
    /// # Arguments
    /// * `ctx` - Context containing the package, sender, and platform accounts
    /// * `description` - Description of the package contents
    /// * `weight` - Weight of the package in grams
    /// * `dimensions` - Package dimensions [length, width, height] in centimeters
    /// * `price` - Delivery price in lamports
    /// * `package_id` - Unique identifier for the package
    /// 
    /// # Errors
    /// Returns an error if the package account cannot be initialized
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

        // Validate dimensions
        require!(dimensions.iter().all(|&d| d > 0), ErrorCode::InvalidDimensions);
        // Validate price
        require!(price > 0, ErrorCode::InvalidPrice);

        package.sender = ctx.accounts.sender.key();
        package.description = description;
        package.weight = weight;
        package.dimensions = dimensions;
        package.price = price;
        package.status = PackageStatus::Registered;
        package.created_at = Clock::get()?.unix_timestamp;
        package.id = package_id as u64;

        platform.total_packages = platform.total_packages.checked_add(1).unwrap();

        Ok(())
    }

    /// Accepts a package delivery request by a carrier
    /// 
    /// # Arguments
    /// * `ctx` - Context containing the package and carrier accounts
    /// 
    /// # Errors
    /// Returns an error if:
    /// - Package status is not Registered
    /// - Carrier reputation is insufficient
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

    /// Completes a package delivery and distributes payment
    /// 
    /// # Arguments
    /// * `ctx` - Context containing the package, carrier, platform, and escrow accounts
    /// 
    /// # Errors
    /// Returns an error if:
    /// - Package status is not InTransit
    /// - Carrier is not authorized
    /// - Payment transfer fails
    pub fn complete_delivery(ctx: Context<CompleteDelivery>) -> Result<()> {
        // Get all immutable references first
        let carrier_key = ctx.accounts.carrier.key();
        let carrier_account_info = ctx.accounts.carrier.to_account_info();
        let escrow_account_info = ctx.accounts.escrow.to_account_info();
        let platform_account_info = ctx.accounts.platform.to_account_info();
        let system_program_info = ctx.accounts.system_program.to_account_info();

        // Now get mutable references
        let package = &mut ctx.accounts.package;
        let carrier = &mut ctx.accounts.carrier;
        let platform = &mut ctx.accounts.platform;

        require!(package.status == PackageStatus::InTransit, ErrorCode::InvalidPackageStatus);
        require!(package.carrier == carrier_key, ErrorCode::Unauthorized);

        let platform_fee = package.price.checked_mul(platform.fee_rate as u64).unwrap()
            .checked_div(10000).unwrap();
        let carrier_payment = package.price.checked_sub(platform_fee).unwrap();

        // Transfer payment to carrier
        let cpi_context = CpiContext::new(
            system_program_info.clone(),
            anchor_lang::system_program::Transfer {
                from: escrow_account_info.clone(),
                to: carrier_account_info,
            },
        );
        anchor_lang::system_program::transfer(cpi_context, carrier_payment)?;

        // Transfer platform fee
        let cpi_context = CpiContext::new(
            system_program_info,
            anchor_lang::system_program::Transfer {
                from: escrow_account_info,
                to: platform_account_info,
            },
        );
        anchor_lang::system_program::transfer(cpi_context, platform_fee)?;

        package.status = PackageStatus::Delivered;
        package.delivered_at = Clock::get()?.unix_timestamp;
        carrier.completed_deliveries = carrier.completed_deliveries.checked_add(1).unwrap();
        carrier.reputation = carrier.reputation.checked_add(10).unwrap();

        Ok(())
    }
}

/// Context for initializing the platform
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 2 + 8 + 1,  // 8 (discriminator) + 32 (authority) + 2 (fee_rate) + 8 (total_packages) + 1 (reputation_increase)
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
    /// CHECK: This is the escrow account that holds the payment funds
    #[account(
        mut,
        signer,
        constraint = escrow.lamports() >= package.price
    )]
    pub escrow: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

/// Context for creating a new carrier
#[derive(Accounts)]
pub struct CreateCarrier<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1 + 4,
        seeds = [b"carrier", authority.key().as_ref()],
        bump
    )]
    pub carrier: Account<'info, Carrier>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Platform account that stores global platform state
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

/// Package account that stores information about a specific delivery
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

/// Carrier account that stores information about a delivery carrier
#[account]
pub struct Carrier {
    /// Public key of the carrier's authority
    pub authority: Pubkey,
    /// Carrier's reputation score (0-255)
    pub reputation: u8,
    /// Number of successfully completed deliveries
    pub completed_deliveries: u32,
}

/// Enum representing the possible states of a package delivery
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PackageStatus {
    /// Package is registered but not yet assigned to a carrier
    Registered,
    /// Package is assigned to a carrier and in transit
    InTransit,
    /// Package has been successfully delivered
    Delivered,
}

/// Custom error codes for the program
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
}

#[event]
pub struct PlatformInitialized {
    pub authority: Pubkey,
    pub fee_rate: u16,
}
