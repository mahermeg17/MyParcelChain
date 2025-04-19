use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PackageStatus {
    Registered,
    InTransit,
    Delivered,
    Cancelled,
}

impl Default for PackageStatus {
    fn default() -> Self {
        PackageStatus::Registered
    }
}

#[account]
#[derive(Default)]
pub struct Package {
    pub sender: Pubkey,             // The sender of the package
    pub carrier: Option<Pubkey>,    // The carrier assigned to deliver the package
    pub description: String,        // Description of the package contents
    pub weight: u32,                // Weight in grams
    pub dimensions: [u32; 3],       // Dimensions [length, width, height] in cm
    pub price: u64,                 // Delivery price in lamports
    pub status: PackageStatus,      // Current status of the package
    pub created_at: i64,            // Timestamp when the package was created
    pub accepted_at: Option<i64>,   // Timestamp when the package was accepted
    pub delivered_at: Option<i64>,  // Timestamp when the package was delivered
    pub id: u64,                    // Unique identifier for the package
} 