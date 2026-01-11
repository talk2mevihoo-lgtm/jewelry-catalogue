const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'gold' },
        update: {},
        create: {
            slug: 'gold',
            name: 'Gold Corp',
            // Default gold/ivory theme
            primaryColor: '#D4AF36',
            secondaryColor: '#F4F1EA',
            fontFamily: 'Outfit'
        },
    });
    console.log('Created tenant:', tenant);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
