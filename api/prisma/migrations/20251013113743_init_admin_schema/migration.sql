-- CreateTable
CREATE TABLE "admins" (
    "admin_id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status_id" INTEGER NOT NULL,
    "otp_code" TEXT,
    "otp_expired_at" TIMESTAMPTZ,
    "otp_failure_count" INTEGER NOT NULL DEFAULT 0,
    "login_failure_count" INTEGER NOT NULL DEFAULT 0,
    "last_login_failed_at" TIMESTAMPTZ,
    "last_login_at" TIMESTAMPTZ,
    "is_deleted" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "admin_statuses" (
    "status_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admin_statuses_pkey" PRIMARY KEY ("status_id")
);

-- CreateTable
CREATE TABLE "Admin_login_logs" (
    "log_id" BIGSERIAL NOT NULL,
    "admin_id" BIGINT,
    "email" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "status" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Admin_login_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_display_name_idx" ON "admins"("display_name");

-- CreateIndex
CREATE INDEX "admins_status_id_idx" ON "admins"("status_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_statuses_status_key" ON "admin_statuses"("status");

-- CreateIndex
CREATE INDEX "Admin_login_logs_admin_id_idx" ON "Admin_login_logs"("admin_id");

-- CreateIndex
CREATE INDEX "Admin_login_logs_email_idx" ON "Admin_login_logs"("email");

-- CreateIndex
CREATE INDEX "Admin_login_logs_ip_address_idx" ON "Admin_login_logs"("ip_address");

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "admin_statuses"("status_id") ON DELETE RESTRICT ON UPDATE CASCADE;
