import { AnchorProvider, Program } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import idl from "../idl/parcel_chain.json";
import { useMemo } from "react";

const PROGRAM_ID = new PublicKey("Dp4yxvD5d3yVsZk7H41wcPUeGmVg2VLbNrivBhHtM39d");

export const useAnchor = () => {
    const wallet = useWallet();
    const connection = new Connection("https://api.devnet.solana.com");

    const provider = useMemo(() => {
        if (!wallet || !wallet.publicKey) return null;
        return new AnchorProvider(connection, wallet as any, AnchorProvider.defaultOptions());
    }, [wallet]);

    const program = useMemo(() => {
        if (!provider) return null;
        return new Program(idl as any, PROGRAM_ID, provider);
    }, [provider]);

    return { program, provider };
};
