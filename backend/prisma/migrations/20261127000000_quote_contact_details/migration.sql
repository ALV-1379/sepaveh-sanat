ALTER TABLE "Inquiry"
  ALTER COLUMN "email" DROP NOT NULL,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "channel" TEXT;
