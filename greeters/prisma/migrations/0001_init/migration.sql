-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'editor');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('draft', 'pending', 'published', 'archived');

-- CreateEnum
CREATE TYPE "PreviewStatus" AS ENUM ('pending', 'validated', 'rejected', 'expired');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'editor',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "meta_description" TEXT,
    "meta_keywords" TEXT,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "status" "PageStatus" NOT NULL DEFAULT 'draft',
    "is_in_menu" BOOLEAN NOT NULL DEFAULT false,
    "menu_order" INTEGER NOT NULL DEFAULT 0,
    "menu_label" TEXT,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "published_version" INTEGER,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_versions" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "status" "PageStatus" NOT NULL DEFAULT 'draft',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,

    CONSTRAINT "page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_sections" (
    "id" UUID NOT NULL,
    "section_type" TEXT NOT NULL,
    "content" JSONB,
    "items" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_contents" (
    "id" UUID NOT NULL,
    "page_id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_previews" (
    "id" UUID NOT NULL,
    "page_id" TEXT NOT NULL,
    "new_content" JSONB NOT NULL,
    "status" "PreviewStatus" NOT NULL DEFAULT 'pending',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_previews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_edits" (
    "id" UUID NOT NULL,
    "page_id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "changes_summary" TEXT,
    "editor_id" UUID,
    "editor_name" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_edits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_hash_key" ON "password_resets"("token_hash");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- CreateIndex
CREATE INDEX "pages_slug_idx" ON "pages"("slug");

-- CreateIndex
CREATE INDEX "pages_status_idx" ON "pages"("status");

-- CreateIndex
CREATE INDEX "pages_is_in_menu_menu_order_idx" ON "pages"("is_in_menu", "menu_order");

-- CreateIndex
CREATE INDEX "page_versions_status_idx" ON "page_versions"("status");

-- CreateIndex
CREATE INDEX "page_versions_created_at_idx" ON "page_versions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "page_versions_page_id_version_number_key" ON "page_versions"("page_id", "version_number");

-- CreateIndex
CREATE INDEX "documents_category_idx" ON "documents"("category");

-- CreateIndex
CREATE INDEX "documents_created_at_idx" ON "documents"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "home_sections_section_type_key" ON "home_sections"("section_type");

-- CreateIndex
CREATE INDEX "home_sections_order_idx" ON "home_sections"("order");

-- CreateIndex
CREATE UNIQUE INDEX "page_contents_page_id_key" ON "page_contents"("page_id");

-- CreateIndex
CREATE INDEX "page_previews_page_id_idx" ON "page_previews"("page_id");

-- CreateIndex
CREATE INDEX "page_previews_status_idx" ON "page_previews"("status");

-- CreateIndex
CREATE INDEX "page_edits_page_id_idx" ON "page_edits"("page_id");

-- CreateIndex
CREATE INDEX "page_edits_created_at_idx" ON "page_edits"("created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
