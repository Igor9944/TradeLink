CREATE TYPE "ParticipantStatus" AS ENUM ('WAITING', 'ADMITTED', 'REJECTED', 'LEFT');

ALTER TYPE "ParticipantRole" ADD VALUE 'MODERATOR';

ALTER TABLE "rooms"
ADD COLUMN "inviteExpiresAt" TIMESTAMP(3),
ADD COLUMN "notes" TEXT;

ALTER TABLE "room_participants"
ADD COLUMN "status" "ParticipantStatus" NOT NULL DEFAULT 'ADMITTED';

ALTER TABLE "room_chat_messages"
ADD CONSTRAINT "room_chat_messages_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "room_participants_roomId_status_idx"
ON "room_participants"("roomId", "status");

CREATE INDEX "room_chat_messages_roomId_sentAt_idx"
ON "room_chat_messages"("roomId", "sentAt");
