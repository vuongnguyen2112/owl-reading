-- Allow one bookmark row to target either a novel or a chapter.
ALTER TABLE "Bookmark" ADD COLUMN "novelId" TEXT;
ALTER TABLE "Bookmark" ALTER COLUMN "chapterId" DROP NOT NULL;

CREATE UNIQUE INDEX "Bookmark_userId_novelId_key" ON "Bookmark"("userId", "novelId");
CREATE INDEX "Bookmark_novelId_idx" ON "Bookmark"("novelId");

ALTER TABLE "Bookmark"
ADD CONSTRAINT "Bookmark_novelId_fkey"
FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Bookmark"
ADD CONSTRAINT "Bookmark_single_target_check"
CHECK (
  (CASE WHEN "novelId" IS NULL THEN 0 ELSE 1 END) +
  (CASE WHEN "chapterId" IS NULL THEN 0 ELSE 1 END) = 1
);
