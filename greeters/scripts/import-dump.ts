import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as fs from 'fs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL est manquante.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface DumpData {
  users: { rows: any[] };
  sessions: { rows: any[] };
  pages: { rows: any[] };
  ai_chat_sessions?: { rows: any[] };
  ai_chat_messages?: { rows: any[] };
}

async function main() {
  const dumpFile = process.argv[2] || '/app/dump.json';
  const data: DumpData = JSON.parse(fs.readFileSync(dumpFile, 'utf-8'));

  console.log('Starting data import...');

  // Import users
  if (data.users?.rows) {
    console.log(`Importing ${data.users.rows.length} users...`);
    for (const user of data.users.rows) {
      try {
        await prisma.user.upsert({
          where: { id: user.id },
          update: {},
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            passwordHash: user.password_hash,
            role: user.role === 'super_admin' ? 'SUPER_ADMIN' : user.role === 'admin' ? 'ADMIN' : 'EDITOR',
            createdBy: user.created_by,
            createdAt: new Date(user.created_at),
          },
        });
      } catch (err) {
        console.error(`Error importing user ${user.email}:`, err);
      }
    }
  }

  // Import pages
  if (data.pages?.rows) {
    console.log(`Importing ${data.pages.rows.length} pages...`);
    for (const page of data.pages.rows) {
      try {
        // Find a valid user ID for createdBy
        const firstUser = await prisma.user.findFirst();
        const createdBy = page.created_by || firstUser?.id;
        
        if (!createdBy) {
          console.error(`No user found for page ${page.title}, skipping...`);
          continue;
        }

        await prisma.page.upsert({
          where: { 
            id: page.id 
          },
          update: {},
          create: {
            id: page.id,
            locale: page.locale || 'fr',
            title: page.title,
            slug: page.slug,
            metaTitle: page.meta_title,
            metaDescription: page.meta_description,
            metaKeywords: page.meta_keywords,
            canonicalUrl: page.canonical_url,
            robotsDirective: page.robots_directive,
            ogTitle: page.og_title,
            ogDescription: page.og_description,
            ogImageUrl: page.og_image_url,
            ogImageAlt: page.og_image_alt,
            twitterTitle: page.twitter_title,
            twitterDescription: page.twitter_description,
            twitterImageUrl: page.twitter_image_url,
            focusKeyword: page.focus_keyword,
            secondaryKeywords: page.secondary_keywords,
            schemaOrgJson: page.schema_org_json,
            imageRecommendations: page.image_recommendations,
            sitemapPriority: page.sitemap_priority,
            sitemapChangeFreq: page.sitemap_change_freq,
            sections: page.sections || [],
            status: page.status === 'published' ? 'PUBLISHED' : page.status === 'draft' ? 'DRAFT' : page.status === 'pending' ? 'PENDING' : 'ARCHIVED',
            isInMenu: page.is_in_menu || false,
            menuOrder: page.menu_order || 0,
            menuLabel: page.menu_label,
            currentVersion: page.current_version || 1,
            publishedVersion: page.published_version,
            createdBy: createdBy,
            createdAt: new Date(page.created_at),
            updatedBy: page.updated_by,
            updatedAt: page.updated_at ? new Date(page.updated_at) : null,
          },
        });
      } catch (err: any) {
        // Handle unique constraint violation for locale+slug
        if (err.code === 'P2002') {
          console.log(`Page with slug "${page.slug}" already exists, skipping...`);
        } else {
          console.error(`Error importing page ${page.title}:`, err.message);
        }
      }
    }
  }

  // Import AI chat sessions
  if (data.ai_chat_sessions?.rows) {
    console.log(`Importing ${data.ai_chat_sessions.rows.length} AI chat sessions...`);
    for (const session of data.ai_chat_sessions.rows) {
      try {
        await prisma.aiChatSession.upsert({
          where: { id: session.id },
          update: {},
          create: {
            id: session.id,
            createdBy: session.created_by,
            locale: session.locale || 'fr',
            title: session.title,
            latestDraft: session.latest_draft,
            createdAt: new Date(session.created_at),
            updatedAt: new Date(session.updated_at || session.created_at),
          },
        });
      } catch (err) {
        console.error(`Error importing AI session:`, err);
      }
    }
  }

  // Import AI chat messages
  if (data.ai_chat_messages?.rows) {
    console.log(`Importing ${data.ai_chat_messages.rows.length} AI chat messages...`);
    for (const msg of data.ai_chat_messages.rows) {
      try {
        await prisma.aiChatMessage.upsert({
          where: { id: msg.id },
          update: {},
          create: {
            id: msg.id,
            sessionId: msg.session_id,
            role: msg.role === 'user' ? 'USER' : 'ASSISTANT',
            content: msg.content,
            generatedPage: msg.generated_page,
            createdAt: new Date(msg.created_at),
          },
        });
      } catch (err) {
        console.error(`Error importing AI message:`, err);
      }
    }
  }

  console.log('Import completed!');
  
  // Print summary
  const usersCount = await prisma.user.count();
  const pagesCount = await prisma.page.count();
  const aiSessionsCount = await prisma.aiChatSession.count();
  const aiMessagesCount = await prisma.aiChatMessage.count();
  
  console.log('\n=== Import Summary ===');
  console.log(`Users: ${usersCount}`);
  console.log(`Pages: ${pagesCount}`);
  console.log(`AI Sessions: ${aiSessionsCount}`);
  console.log(`AI Messages: ${aiMessagesCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
