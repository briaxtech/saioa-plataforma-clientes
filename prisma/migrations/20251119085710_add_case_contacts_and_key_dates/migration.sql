-- DropForeignKey
ALTER TABLE "case_events" DROP CONSTRAINT "case_events_case_id_fkey";

-- DropForeignKey
ALTER TABLE "case_events" DROP CONSTRAINT "case_events_created_by_fkey";

-- DropIndex
DROP INDEX "case_events_case_id_idx";

-- AlterTable
ALTER TABLE "case_events" ALTER COLUMN "occurred_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "case_contacts" (
    "id" SERIAL NOT NULL,
    "case_id" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "organization" TEXT,
    "notes" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_key_dates" (
    "id" SERIAL NOT NULL,
    "case_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "occurs_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT,
    "duration_minutes" INTEGER,
    "location" TEXT,
    "sync_to_calendar" BOOLEAN NOT NULL DEFAULT false,
    "google_calendar_event_id" TEXT,
    "google_calendar_html_link" TEXT,
    "notify_by_email" BOOLEAN NOT NULL DEFAULT false,
    "notify_emails" JSONB,
    "remind_minutes_before" INTEGER,
    "email_subject" TEXT,
    "email_body" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_key_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_key_date_reminders" (
    "id" SERIAL NOT NULL,
    "key_date_id" INTEGER NOT NULL,
    "case_id" INTEGER NOT NULL,
    "send_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "send_to" JSONB,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "sent_at" TIMESTAMP(3),
    "provider_message_id" TEXT,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_key_date_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "case_key_date_reminders_key_date_id_key" ON "case_key_date_reminders"("key_date_id");

-- AddForeignKey
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_contacts" ADD CONSTRAINT "case_contacts_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_key_dates" ADD CONSTRAINT "case_key_dates_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_key_date_reminders" ADD CONSTRAINT "case_key_date_reminders_key_date_id_fkey" FOREIGN KEY ("key_date_id") REFERENCES "case_key_dates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_key_date_reminders" ADD CONSTRAINT "case_key_date_reminders_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
