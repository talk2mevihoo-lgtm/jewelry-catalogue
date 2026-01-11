const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding demo users...');

    // 1. Super Admin
    await prisma.user.upsert({
        where: { email: 'super@admin.com' },
        update: { password: 'Super@123', role: 'SUPER_ADMIN' },
        create: {
            email: 'super@admin.com',
            password: 'Super@123', // Plaintext as per current auth.ts
            role: 'SUPER_ADMIN'
        }
    });

    // 2. Admin
    await prisma.user.upsert({
        where: { email: 'admin@company.com' },
        update: { password: 'Admin@123', role: 'ADMIN' },
        create: {
            email: 'admin@company.com',
            password: 'Admin@123',
            role: 'ADMIN' // Maps to ADMIN role in app
        }
    });

    // 3. Generic Distributor
    const distUser = await prisma.user.upsert({
        where: { email: 'distributor@company.com' },
        update: { password: 'Dist@123', role: 'DISTRIBUTOR' },
        create: {
            email: 'distributor@company.com',
            password: 'Dist@123',
            role: 'DISTRIBUTOR'
        }
    });

    // Create Profile if needed
    await prisma.distributorProfile.upsert({
        where: { userId: distUser.id },
        update: {},
        create: {
            userId: distUser.id,
            distributorCode: 'DIST-001',
            companyName: 'General Traders',
            contactPerson: 'Gen Dist',
            contactNo: '1111111111',
            address: '123 Main St',
            region: 'General'
        }
    });

    // 4. Gold Tenant Distributor
    // Check if tenant exists
    const goldTenant = await prisma.tenant.findUnique({ where: { slug: 'gold' } });
    if (goldTenant) {
        const goldUser = await prisma.user.upsert({
            where: { email: 'gold@distributor.com' },
            update: { password: 'Gold@123', role: 'DISTRIBUTOR', tenantId: goldTenant.id },
            create: {
                email: 'gold@distributor.com',
                password: 'Gold@123',
                role: 'DISTRIBUTOR',
                tenantId: goldTenant.id
            }
        });

        await prisma.distributorProfile.upsert({
            where: { userId: goldUser.id },
            update: {},
            create: {
                userId: goldUser.id,
                distributorCode: 'GOLD-001',
                companyName: 'Gold Corp Retail',
                contactPerson: 'Goldie',
                contactNo: '9999999999',
                address: 'Gold St',
                region: 'Premium'
            }
        });
    }

    console.log('Demo users created successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
