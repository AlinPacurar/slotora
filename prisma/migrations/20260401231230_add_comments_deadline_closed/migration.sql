-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "closed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "comments" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "deadline" TIMESTAMP(3);
