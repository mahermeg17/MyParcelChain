use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Platform {
    pub authority: Pubkey,          // The authority that controls the platform
    pub fee_rate: u16,              // Platform fee rate in basis points (e.g., 200 = 2%)
    pub total_packages: u64,        // Total number of packages registered
    pub reputation_increase: u8,    // Amount to increase carrier reputation after successful delivery
} 