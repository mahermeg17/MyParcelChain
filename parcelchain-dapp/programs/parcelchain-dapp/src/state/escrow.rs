use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum EscrowStatus {
    Active,
    Released,
    Cancelled,
}

impl Default for EscrowStatus {
    fn default() -> Self {
        EscrowStatus::Active
    }
}

#[account]
pub struct Escrow {
    pub amount: u64,
    pub package: Pubkey,
    pub carrier: Pubkey,
    pub bump: u8,
} 