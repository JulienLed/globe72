-- CreateTable
CREATE TABLE "SignageIdea" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "suggestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignageIdea_pkey" PRIMARY KEY ("id")
);
