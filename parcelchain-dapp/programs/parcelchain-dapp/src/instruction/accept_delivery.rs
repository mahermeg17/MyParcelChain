use anchor_lang::prelude::*;
use crate::state::package::{Package, PackageStatus};
use crate::state::escrow::Escrow;

#[derive(Accounts)]
pub struct AcceptDelivery<'info> {
    #[account(mut)]
    pub package: Account<'info, Package>,
    #[account(
        init,
        payer = carrier,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 1
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub carrier: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AcceptDelivery>) -> Result<()> {
    let package = &mut ctx.accounts.package;
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;

    // Verify package is in correct state
    require!(
        package.status == PackageStatus::Registered,
        ErrorCode::InvalidPackageStatus
    );

    // Initialize escrow
    escrow.package = package.key();
    escrow.shipper = package.shipper;
    escrow.carrier = ctx.accounts.carrier.key();
    escrow.amount = package.price;
    escrow.created_at = clock.unix_timestamp;
    escrow.released_at = 0;
    escrow.status = crate::state::escrow::EscrowStatus::Created;

    // Update package status
    package.carrier = ctx.accounts.carrier.key();
    package.status = PackageStatus::InTransit;
    package.accepted_at = clock.unix_timestamp;

    Ok(())
} 