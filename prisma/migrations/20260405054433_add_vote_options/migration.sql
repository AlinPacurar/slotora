-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "voteOptions" TEXT[] DEFAULT ARRAY[]::TEXT[];
