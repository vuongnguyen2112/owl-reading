require('dotenv/config');

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { createHash } = require('node:crypto');

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to run the development seed script in production.');
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the Prisma seed script.');
}

const databaseUrl = new URL(connectionString);
const schema = databaseUrl.searchParams.get('schema') ?? undefined;

const prisma = new PrismaClient({
  adapter: new PrismaPg(connectionString, { schema }),
  log: ['warn', 'error'],
});

const testUser = {
  email: 'reader@example.com',
  displayName: 'Test Reader',
  passwordHash: `sha256:${createHash('sha256')
    .update('password123')
    .digest('hex')}`,
};

const novels = [
  {
    title: 'The Clockwork Owl',
    slug: 'the-clockwork-owl',
    description:
      'A young archivist follows a mechanical owl through a city of hidden libraries.',
    coverImageUrl: 'https://example.com/covers/the-clockwork-owl.jpg',
    status: 'PUBLISHED',
    chapters: [
      'The Brass Feather',
      'Maps Beneath Midnight',
      'The Library That Moved',
      'A Promise in Gears',
      'The Dawn Mechanism',
    ],
  },
  {
    title: 'Lanterns Over Briarfall',
    slug: 'lanterns-over-briarfall',
    description:
      'When the valley lanterns go dark, a reluctant courier carries the last flame home.',
    coverImageUrl: 'https://example.com/covers/lanterns-over-briarfall.jpg',
    status: 'PUBLISHED',
    chapters: [
      'The Last Lit Window',
      'Roads Through the Thicket',
      'A Courier in the Rain',
      'The Bell at Briarfall',
      'Flame Before Sunrise',
    ],
  },
  {
    title: 'Sea of Sleeping Stars',
    slug: 'sea-of-sleeping-stars',
    description:
      'A navigator crosses an impossible ocean where constellations sleep beneath the waves.',
    coverImageUrl: 'https://example.com/covers/sea-of-sleeping-stars.jpg',
    status: 'DRAFT',
    chapters: [
      'The Tide Above',
      'Charts of Silver Water',
      'The Star Beneath the Hull',
      'An Island Without Shadow',
      'Wake the Northern Light',
    ],
  },
];

function chapterContent(novelTitle, chapterNumber, chapterTitle) {
  return [
    `${chapterTitle}`,
    '',
    `This development chapter belongs to ${novelTitle}. It provides enough sample prose for reader layouts, pagination experiments, and API smoke tests without introducing production content.`,
    '',
    `Chapter ${chapterNumber} follows the characters through a focused scene, leaving clear room for later editorial replacement when real content management features are implemented.`,
  ].join('\n');
}

async function seedUser() {
  await prisma.user.upsert({
    where: { email: testUser.email },
    update: {
      displayName: testUser.displayName,
      passwordHash: testUser.passwordHash,
    },
    create: testUser,
  });
}

async function seedNovels() {
  for (const novel of novels) {
    const createdNovel = await prisma.novel.upsert({
      where: { slug: novel.slug },
      update: {
        title: novel.title,
        description: novel.description,
        coverImageUrl: novel.coverImageUrl,
        status: novel.status,
      },
      create: {
        title: novel.title,
        slug: novel.slug,
        description: novel.description,
        coverImageUrl: novel.coverImageUrl,
        status: novel.status,
      },
    });

    for (const [index, title] of novel.chapters.entries()) {
      const chapterNumber = index + 1;

      await prisma.chapter.upsert({
        where: {
          novelId_chapterNumber: {
            novelId: createdNovel.id,
            chapterNumber,
          },
        },
        update: {
          title,
          content: chapterContent(novel.title, chapterNumber, title),
        },
        create: {
          novelId: createdNovel.id,
          chapterNumber,
          title,
          content: chapterContent(novel.title, chapterNumber, title),
        },
      });
    }
  }
}

async function main() {
  await seedUser();
  await seedNovels();

  const [userCount, novelCount, chapterCount] = await Promise.all([
    prisma.user.count({ where: { email: testUser.email } }),
    prisma.novel.count({
      where: { slug: { in: novels.map((novel) => novel.slug) } },
    }),
    prisma.chapter.count({
      where: { novel: { slug: { in: novels.map((novel) => novel.slug) } } },
    }),
  ]);

  console.log(
    `Seeded ${userCount} test user, ${novelCount} novels, and ${chapterCount} chapters.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
