use anchor_lang::prelude::*;
use crate::state::package::{Package, PackageStatus, Dimensions};

#[derive(Accounts)]
pub struct RegisterPackage<'info> {
    #[account(
        init,
        payer = shipper,
        space = 8 + 32 + 32 + 32 + 4 + 4 + 4 + 4 + 4 + 8 + 1 + 8 + 8 + 8 + 8
    )]
    pub package: Account<'info, Package>,
    #[account(mut)]
    pub shipper: Signer<'info>,
    pub recipient: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterPackage>,
    description: String,
    dimensions: Dimensions,
    weight: u32,
    price: u64,
) -> Result<()> {
    let package = &mut ctx.accounts.package;
    let clock = Clock::get()?;

    package.shipper = ctx.accounts.shipper.key();
    package.recipient = ctx.accounts.recipient.key();
    package.description = description;
    package.dimensions = dimensions;
    package.weight = weight;
    package.price = price;
    package.status = PackageStatus::Registered;
    package.registered_at = clock.unix_timestamp;
    package.accepted_at = 0;
    package.delivered_at = 0;
    package.recipient_confirmed_at = 0;

    Ok(())
} 