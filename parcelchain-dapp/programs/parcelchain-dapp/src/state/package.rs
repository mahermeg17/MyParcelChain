use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum PackageStatus {
    Registered,
    InTransit,
    DeliveredPendingConfirmation,
    Delivered,
    Disputed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Dimensions {
    pub length: u32,
    pub width: u32,
    pub height: u32,
}

impl Default for Dimensions {
    fn default() -> Self {
        Self {
            length: 0,
            width: 0,
            height: 0,
        }
    }
}

#[account]
pub struct Package {
    pub shipper: Pubkey,
    pub recipient: Pubkey,
    pub carrier: Pubkey,
    pub description: String,
    pub dimensions: Dimensions,
    pub weight: u32,
    pub price: u64,
    pub status: PackageStatus,
    pub registered_at: i64,
    pub accepted_at: i64,
    pub delivered_at: i64,
    pub recipient_confirmed_at: i64,
}

impl Default for Package {
    fn default() -> Self {
        Self {
            shipper: Pubkey::default(),
            recipient: Pubkey::default(),
            carrier: Pubkey::default(),
            description: String::new(),
            dimensions: Dimensions::default(),
            weight: 0,
            price: 0,
            status: PackageStatus::Registered,
            registered_at: 0,
            accepted_at: 0,
            delivered_at: 0,
            recipient_confirmed_at: 0,
        }
    }
} 