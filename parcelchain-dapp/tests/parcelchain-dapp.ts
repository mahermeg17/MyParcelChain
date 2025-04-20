import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ParcelchainDapp } from "../target/types/parcelchain_dapp";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
  createInitializeAccountInstruction,
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";

describe("parcelchain-dapp", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ParcelchainDapp as Program<ParcelchainDapp>;
  const programId = new PublicKey("3mG95ZAAcoJdwsnufkcyo1hSivS1cD7R4rvekyoLbZzm");

  // Store keypairs that will be used across tests
  let carrier: anchor.web3.Keypair;
  let carrierAccount: PublicKey;
  let defaultToken: PublicKey;
  let senderTokenAccount: PublicKey;
  let escrowTokenAccount: PublicKey;
  let carrierTokenAccount: PublicKey;
  let platformTokenAccount: PublicKey;

  // Derive platform PDA using the same seed as the Rust program
  const [platform] = PublicKey.findProgramAddressSync(
    [Buffer.from("platform")],
    programId
  );

  const authority = provider.wallet.publicKey;

  // Fund platform account with SOL and initialize it
  before(async () => {
    // Fund platform account
    const platformAirdropSig = await provider.connection.requestAirdrop(
      platform,
      2 * LAMPORTS_PER_SOL
    );
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature: platformAirdropSig,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    // Create default token mint
    defaultToken = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      9
    );

    // Initialize platform with default token
    const tx = await program.methods
      .initialize()
      .accounts({
        platform: platform,
        authority: authority,
        defaultToken: defaultToken,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Platform initialization transaction:", tx);
    console.log("Platform account:", platform.toString());
  });

  it("Initializes the platform", async () => {
    // Fetch and verify platform account
    const platformAccount = await program.account.platform.fetch(platform);

    // Verify platform authority
    assert.ok(
      platformAccount.authority.equals(authority),
      "Platform authority should match provider wallet"
    );

    // Verify initial fee rate
    assert.equal(
      platformAccount.feeRate,
      200,
      "Initial fee rate should be 200 (2%)"
    );

    // Verify initial total packages
    assert.equal(
      platformAccount.totalPackages.toNumber(),
      0,
      "Initial total packages should be 0"
    );

    // Verify default token
    assert.ok(
      platformAccount.defaultToken.equals(defaultToken),
      "Default token should be set"
    );
  });

  it("Registers a package", async () => {
    // Generate keypairs for accounts
    const shipper = anchor.web3.Keypair.generate();
    const recipient = anchor.web3.Keypair.generate();
    const packageId = 1; // Unique identifier for the package (u8)

    // Derive package PDA using the same seeds as the Rust program
    const [packageAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("package"),
        platform.toBuffer(),
        Buffer.from([packageId])
      ],
      programId
    );

    // Fund accounts with SOL
    const shipperAirdropSig = await provider.connection.requestAirdrop(
      shipper.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature: shipperAirdropSig,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    // Register package
    const tx = await program.methods
      .registerPackage(
        "Test Package", // description
        new anchor.BN(1), // weight
        new Uint32Array([10, 10, 10]), // dimensions
        new anchor.BN(LAMPORTS_PER_SOL), // price
        packageId // package_id
      )
      .accounts({
        package: packageAccount,
        sender: shipper.publicKey,
        platform: platform,
        systemProgram: SystemProgram.programId,
      })
      .signers([shipper])
      .rpc({ commitment: "confirmed", skipPreflight: true });

    // Fetch and verify package account
    const packageData = await program.account.package.fetch(packageAccount);

    // Verify package status
    assert.deepEqual(
      packageData.status,
      { registered: {} },
      "Package status should be Registered"
    );

    // Verify sender
    assert.ok(
      packageData.sender.equals(shipper.publicKey),
      "Package sender should match"
    );

    // Verify dimensions
    assert.deepEqual(
      Array.from(packageData.dimensions),
      [10, 10, 10],
      "Package dimensions should match"
    );

    // Verify weight
    assert.equal(
      packageData.weight,
      1,
      "Package weight should be 1"
    );

    // Verify price
    assert.equal(
      packageData.price.toString(16),
      LAMPORTS_PER_SOL.toString(16),
      "Package price should match"
    );
  });

  it("Creates a carrier", async () => {
    // Generate keypair for carrier
    carrier = anchor.web3.Keypair.generate();

    // Derive carrier PDA using the same seeds as the Rust program
    [carrierAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("carrier"),
        carrier.publicKey.toBuffer()
      ],
      programId
    );

    // Create carrier token account
    carrierTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      defaultToken,
      carrierAccount,
      true
    );

    // Fund carrier account with SOL
    const carrierAirdropSig = await provider.connection.requestAirdrop(
      carrier.publicKey,
      LAMPORTS_PER_SOL
    );
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature: carrierAirdropSig,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    // Create carrier
    const tx = await program.methods
      .createCarrier(100) // initial reputation
      .accounts({
        carrier: carrierAccount,
        authority: carrier.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([carrier])
      .rpc({ commitment: "confirmed", skipPreflight: true });

    // Fetch and verify carrier account
    const carrierData = await program.account.carrier.fetch(carrierAccount);

    // Verify carrier authority
    assert.ok(
      carrierData.authority.equals(carrier.publicKey),
      "Carrier authority should match"
    );

    // Verify initial reputation
    assert.equal(
      carrierData.reputation,
      100,
      "Carrier reputation should match initial value"
    );

    // Verify delivery count
    assert.equal(
      carrierData.completedDeliveries,
      0,
      "Initial delivery count should be 0"
    );

    // Verify account bump
    assert.ok(
      carrierData.bump > 0,
      "Account bump should be set"
    );
  });

  it("Accepts a package delivery", async () => {
    // Use the existing package and carrier
    const packageId = 1;
    const [packageAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("package"),
        platform.toBuffer(),
        Buffer.from([packageId])
      ],
      programId
    );

    // Accept the package delivery
    const tx = await program.methods
      .acceptDelivery()
      .accounts({
        package: packageAccount,
        carrier: carrierAccount,
        authority: carrier.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([carrier])
      .rpc({ commitment: "confirmed", skipPreflight: true });

    // Fetch and verify package account
    const packageData = await program.account.package.fetch(packageAccount);

    // Verify package status changed to InTransit
    assert.deepEqual(
      packageData.status,
      { inTransit: {} },
      "Package status should be InTransit"
    );

    // Verify carrier assignment
    assert.ok(
      packageData.carrier.equals(carrierAccount),
      "Package carrier should be assigned"
    );

    // Verify accepted timestamp
    assert.ok(
      packageData.acceptedAt.toNumber() > 0,
      "Accepted timestamp should be set"
    );
  });

  it("Creates an escrow for package delivery", async () => {
    const sender = anchor.web3.Keypair.generate();
    const recipient = anchor.web3.Keypair.generate();
    const packageId = 2;

    const [packageAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("package"),
        platform.toBuffer(),
        Buffer.from([packageId])
      ],
      programId
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(sender.publicKey, 3 * LAMPORTS_PER_SOL)
    );

    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      defaultToken,
      sender.publicKey
    );

    await program.methods
      .registerPackage(
        "Test Package",
        new anchor.BN(1),
        new Uint32Array([10, 10, 10]),
        new anchor.BN(LAMPORTS_PER_SOL),
        packageId
      )
      .accounts({
        package: packageAccount,
        sender: sender.publicKey,
        platform: platform,
        systemProgram: SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    await program.methods
      .acceptDelivery()
      .accounts({
        package: packageAccount,
        carrier: carrierAccount,
        authority: carrier.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([carrier])
      .rpc();

    const [escrowAccount, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        packageAccount.toBuffer()
      ],
      programId
    );

    try {
      await program.methods
        .initializeEscrow()
        .accounts({
          escrow: escrowAccount,
          sender: sender.publicKey,
          package: packageAccount,
          system_program: SystemProgram.programId,
        })
        .signers([sender])
        .rpc();

      await program.methods
        .createEscrow(new anchor.BN(LAMPORTS_PER_SOL))
        .accounts({
          escrow: escrowAccount,
          sender: sender.publicKey,
          package: packageAccount,
          platform: platform,
          system_program: SystemProgram.programId,
        })
        .signers([sender])
        .rpc();

      const escrowData = await program.account.escrow.fetch(escrowAccount);
      assert.equal(escrowData.amount.toString(), LAMPORTS_PER_SOL.toString());
      assert.deepEqual(escrowData.status, { funded: {} });
      assert.equal(escrowData.sender.toBase58(), sender.publicKey.toBase58());
      assert.equal(escrowData.package.toBase58(), packageAccount.toBase58());
      assert.equal(escrowData.carrier.toBase58(), carrierAccount.toBase58());
      assert.equal(escrowData.bump, bump);
      assert.equal(escrowData.releasedAt.toString(), "0");

      const finalEscrowBalance = await provider.connection.getBalance(escrowAccount);
      const rentExempt = await provider.connection.getMinimumBalanceForRentExemption(165);
      const expectedEscrowBalance = new anchor.BN(LAMPORTS_PER_SOL).add(new anchor.BN(rentExempt));
      
      const DELTA = 300_000;
      assert.ok(
        Math.abs(finalEscrowBalance - expectedEscrowBalance.toNumber()) <= DELTA,
        `Escrow SOL balance not within expected range: ${finalEscrowBalance} ≠ ${expectedEscrowBalance.toString()}`
      );

    } catch (error) {
      console.error("Error creating escrow:", error);
      if (error instanceof anchor.AnchorError) {
        console.error("Error code:", error.error.errorCode.code);
        console.error("Error message:", error.error.errorMessage);
        console.error("Error logs:", error.logs);
      } else if (error.logs) {
        console.error("Transaction logs:", error.logs);
      }
      throw error;
    }
  });
});
