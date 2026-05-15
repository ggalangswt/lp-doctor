import type { Request, Response } from "express";
import { hashTypedData, recoverTypedDataAddress, type Hex } from "viem";
import { logger } from "../logger.js";
import { ogChain } from "../services/ogChain.js";

// POST /api/migrate/:tokenId/recorded
//
// Frontend posts the EIP-712 typed data + signature it just produced
// in the migration modal. We:
//   1. recover the signer from the signature against the typed data
//      and confirm it matches the claimed signer
//   2. compute the typed-data digest (the hash that was actually signed)
//   3. call LPDoctorAgent.recordMigration(tokenId, digest) on 0G Galileo
//      so the iNFT's `migrationsTriggered` counter advances
//
// `tokenId` is the Uniswap LP NFT id the agent diagnosed; the digest
// goes onto the LPDoctorAgent iNFT identified by LPDOCTOR_AGENT_TOKEN_ID
// env. We log both so a verifier can correlate the two.

interface MigratePayload {
  tokenId: string;
  signer: string;
  signature: Hex;
  domain: {
    name: string;
    chainId: number;
    verifyingContract: Hex;
  };
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, unknown>;
}

export async function migrateRecordedHandler(
  req: Request<{ tokenId: string }, unknown, MigratePayload>,
  res: Response,
): Promise<void> {
  const lpTokenId = req.params.tokenId;
  const body = req.body;

  if (!body?.signature || !body?.signer || !body?.domain || !body?.message) {
    res.status(400).json({ error: "missing signature, signer, domain, or message" });
    return;
  }

  try {
    const recovered = await recoverTypedDataAddress({
      domain: body.domain,
      types: body.types,
      primaryType: body.primaryType,
      message: body.message,
      signature: body.signature,
    });
    if (recovered.toLowerCase() !== body.signer.toLowerCase()) {
      res.status(400).json({
        error: "signer does not match recovered address",
        recovered,
        claimed: body.signer,
      });
      return;
    }

    const digest = hashTypedData({
      domain: body.domain,
      types: body.types,
      primaryType: body.primaryType,
      message: body.message,
    });

    logger.info(
      `migrate recorded lpTokenId=${lpTokenId} signer=${recovered} digest=${digest}`,
    );

    const receipt = await ogChain.recordMigration(digest);
    res.json({
      lpTokenId,
      signer: recovered,
      digest,
      receipt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`migrate recorded failed: ${msg}`);
    res.status(500).json({ error: msg });
  }
}
