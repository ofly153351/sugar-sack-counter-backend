const { PrismaClient } = require('@prisma/client');

async function checkRoles() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking roles in database...');

    const roles = await prisma.role.findMany();
    console.log('📋 Found roles:', roles);

    if (roles.length === 0) {
      console.log('❌ No roles found in database');
      console.log('🌱 Seeding database with default roles...');

      // Insert default roles
      await prisma.role.createMany({
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'admin',
            description: 'Administrator role with full access'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'user',
            description: 'Regular user role with basic access'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'operator',
            description: 'Operator role for counting operations'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: 'viewer',
            description: 'View-only role for monitoring'
          }
        ],
        skipDuplicates: true
      });

      console.log('✅ Default roles seeded successfully');

      // Check again
      const updatedRoles = await prisma.role.findMany();
      console.log('📋 Updated roles list:', updatedRoles);
    } else {
      console.log('✅ Roles found in database');
    }

  } catch (error) {
    console.error('❌ Error checking roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkRoles();
}

module.exports = checkRoles;
