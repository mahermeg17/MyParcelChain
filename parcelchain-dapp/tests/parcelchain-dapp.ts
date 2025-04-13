import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ParcelchainDapp } from "../target/types/parcelchain_dapp";
import { SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("parcelchain-dapp", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ParcelchainDapp as Program<ParcelchainDapp>;

  // Define platform PDA at the top level
  const [platformPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform")],
    program.programId
  );

  it("Is initialized!", async () => {
    // Generate a new keypair for the platform account
    const [platform] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("platform")],
      program.programId
    );

    // Call the initialize instruction - Anchor will handle account creation
    const tx = await program.methods
      .initialize()
      .accounts({
        platform: platform,
        authority: provider.wallet.publicKey,
        system_program: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Your transaction signature", tx);

    // Fetch the platform account to verify initialization
    const platformAccount = await program.account.platform.fetch(platform);
    console.log("Platform authority:", platformAccount.authority.toString());
    console.log("Platform fee rate:", platformAccount.fee_rate);
    console.log("Total packages:", platformAccount.total_packages);
  });

  it("registers a package successfully", async () => {
    // Generate a new package PDA
    const packageId = new anchor.BN(1);
    const [packagePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("package"), platformPDA.toBuffer(), Buffer.from([1])],
      program.programId
    );

    // Register a package with valid parameters
    const description = "Test Package";
    const weight = new anchor.BN(1000); // 1kg
    const dimensions = new Uint8Array([30, 20, 10]); // 30x20x10 cm as u8 array
    const price = new anchor.BN(1000000); // 0.001 SOL

    const tx = await program.methods
      .registerPackage(
        description,
        weight,
        dimensions,
        price,
        packageId
      )
      .accounts({
        package: packagePDA,
        sender: provider.wallet.publicKey,
        platform: platformPDA,
        system_program: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Verify package state
    const packageAccount = await program.account.package.fetch(packagePDA);
    expect(packageAccount.sender.toString()).to.eql(provider.wallet.publicKey.toString());
    expect(packageAccount.description).to.eql(description);
    expect(packageAccount.weight.toString()).to.eql(weight.toString());
    expect(packageAccount.dimensions).to.eql(Array.from(dimensions));
    expect(packageAccount.price.toString()).to.eql(price.toString());
    expect(packageAccount.status).to.eql({ registered: {} }); // Assuming PackageStatus is an enum
    expect(packageAccount.id.toString()).to.eql(packageId.toString());
  });

  it("creates a carrier successfully", async () => {
    // Generate a new carrier PDA
    const [carrierPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("carrier"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    // Create carrier with valid parameters
    const initialReputation = 100; // Starting reputation

    const tx = await program.methods
      .createCarrier(initialReputation)
      .accounts({
        carrier: carrierPDA,
        authority: provider.wallet.publicKey,
        system_program: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Verify carrier state
    const carrierAccount = await program.account.carrier.fetch(carrierPDA);
    expect(carrierAccount.authority.toString()).to.eql(provider.wallet.publicKey.toString());
    expect(carrierAccount.reputation).to.eql(initialReputation);
    expect(carrierAccount.completedDeliveries).to.eql(0);
  });
});
