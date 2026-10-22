-- Preserve existing messages while making the unread state explicit.
ALTER TYPE "MessageStatus" RENAME VALUE 'NEW' TO 'UNREAD';
