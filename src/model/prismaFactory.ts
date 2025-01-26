import { PrismaClient } from '@prisma/client';

export const prismaFactory = async () => {
    try {
        const prisma = new PrismaClient();
        await prisma.$connect();
        return prisma;
    } catch (error) {
        throw new Error("Failed to create prisma client!");
    }
};
export default prismaFactory;