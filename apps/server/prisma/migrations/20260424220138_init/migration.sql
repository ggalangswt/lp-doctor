-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "token0" TEXT NOT NULL,
    "token1" TEXT NOT NULL,
    "feeTier" INTEGER NOT NULL,
    "tickSpacing" INTEGER NOT NULL,
    "hooks" TEXT,
    "tvlUsdCached" DECIMAL(38,18),
    "lastSyncBlock" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "tokenId" BIGINT NOT NULL,
    "owner" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "tickLower" INTEGER NOT NULL,
    "tickUpper" INTEGER NOT NULL,
    "liquidity" BIGINT NOT NULL,
    "depositedToken0" DECIMAL(38,18) NOT NULL,
    "depositedToken1" DECIMAL(38,18) NOT NULL,
    "collectedFees0" DECIMAL(38,18) NOT NULL,
    "collectedFees1" DECIMAL(38,18) NOT NULL,
    "createdAtBlock" BIGINT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticJob" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "reportRootHash" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "DiagnosticJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "rootHash" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "chainTxHash" TEXT NOT NULL,
    "teeSignature" TEXT NOT NULL,
    "teeOracleAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("rootHash")
);

-- CreateTable
CREATE TABLE "HookRegistry" (
    "address" TEXT NOT NULL,
    "flagsBitmap" INTEGER NOT NULL,
    "family" TEXT NOT NULL,
    "name" TEXT,
    "auditStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "sourceUrl" TEXT,
    "tvlUsdCached" DECIMAL(38,18),
    "volumeUsdCached" DECIMAL(38,18),
    "poolsCount" INTEGER,
    "firstSeenBlock" BIGINT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "HookRegistry_pkey" PRIMARY KEY ("address")
);

-- CreateIndex
CREATE INDEX "Pool_chainId_address_idx" ON "Pool"("chainId", "address");

-- CreateIndex
CREATE INDEX "Position_owner_idx" ON "Position"("owner");

-- CreateIndex
CREATE UNIQUE INDEX "Position_chainId_version_tokenId_key" ON "Position"("chainId", "version", "tokenId");

-- CreateIndex
CREATE INDEX "Report_user_idx" ON "Report"("user");

-- CreateIndex
CREATE INDEX "Report_positionId_idx" ON "Report"("positionId");

-- CreateIndex
CREATE INDEX "HookRegistry_family_idx" ON "HookRegistry"("family");

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticJob" ADD CONSTRAINT "DiagnosticJob_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
