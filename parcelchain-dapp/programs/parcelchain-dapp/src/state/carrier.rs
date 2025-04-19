use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Carrier {
    pub authority: Pubkey,          // The authority that owns this carrier account
    pub reputation: u8,             // Carrier's reputation score (0-255)
    pub completed_deliveries: u32,  // Number of completed deliveries
} 