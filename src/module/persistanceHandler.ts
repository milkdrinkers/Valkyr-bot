import type { PrismaClient } from '@prisma/client';
import { Events } from 'discord.js';
import { Client } from 'discordx';
import Ban from '../command/punishment/ban';
import Mute from '../command/punishment/mute';

export default (client: Client, prisma: PrismaClient) => {
    client.on(Events.GuildRoleDelete, async role => {
        await prisma.role.delete({
            where: { id: role.id },
        });

        console.log(`Deleted role ${role.name} (${role.id})`);
    });

    client.on(Events.GuildDelete, async guild => {
        await prisma.guild.delete({
            where: { id: guild.id },
        });

        console.log(`Left guild ${guild.name} (${guild.id})`);
    });

    client.on(Events.GuildMemberAdd, async member => {
        // Add punishment roles
        const user = await prisma.user.findUnique({
            where: { id: member.id },
        });

        if (user && user.banned) Ban.giveBanRoles(member);

        if (user && user.muted) Mute.giveMuteRoles(member);

        // Normal role restoration
        const roles = await prisma.role.findMany({
            where: {
                guildId: member.guild.id,
                users: {
                    some: { userId: member.id },
                },
            },
        });

        if (roles.length === 0) return;

        const guildRoles = await member.guild.roles.fetch();

        if (client.user === null) return;

        const botMember = await member.guild.members.fetch(client.user.id);

        const higherRoles = guildRoles.filter(role => role.position > botMember.roles.highest.position);

        const validRoles = roles
            .filter(role => !higherRoles.has(role.id))
            .filter(role => role.id !== member.guild.id)
            .map(role => role.id);

        await member.roles.add(validRoles).catch(console.error);

        console.log(`Added ${validRoles.length} roles to ${member.user.username}`);
    });

    client.on(Events.GuildMemberRemove, async member => {
        await prisma.guild.upsert({
            where: { id: member.guild.id },
            create: { id: member.guild.id },
            update: { id: member.guild.id },
        });

        await prisma.user.upsert({
            where: { id: member.id },
            create: {
                id: member.id,
                banned: Ban.isBanned(member),
                muted: Mute.isMuted(member),
            },
            update: { id: member.id },
        });

        // Clear old saved user roles (Or roles from previous leaves will also be applied)
        await prisma.userRole.deleteMany({
            where: { userId: { equals: member.id } },
        });

        // Save new user roles
        for (const role of member.roles.cache.values()) {
            await prisma.role.upsert({
                where: { id: role.id },
                create: { id: role.id, guildId: role.guild.id },
                update: { id: role.id, guildId: role.guild.id },
            });

            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: member.id, roleId: role.id } },
                create: { userId: member.id, roleId: role.id },
                update: { userId: member.id, roleId: role.id },
            });
        }

        console.log(`Saved ${member.user.username}'s ${member.roles.cache.size} roles for guild ${member.guild.name} (${member.guild.id})`);
    });
};
