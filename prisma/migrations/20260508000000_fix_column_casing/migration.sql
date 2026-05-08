-- Migration: 20260508000000_fix_column_casing
-- Fix column name from lowercase to camelCase to match Prisma expectations

BEGIN;

ALTER TABLE "users" RENAME COLUMN "profilepicture" TO "profilePicture";

COMMIT;