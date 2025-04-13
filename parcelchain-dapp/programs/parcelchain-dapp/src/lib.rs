use anchor_lang::prelude::*;

declare_id!("3mG95ZAAcoJdwsnufkcyo1hSivS1cD7R4rvekyoLbZzm");

#[program]
pub mod parcelchain_dapp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
