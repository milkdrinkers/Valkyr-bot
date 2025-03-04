import type { Guild, GuildMember, PartialGuildMember, User } from 'discord.js';
import { prisma } from '..';
import type { PunishmentDuration } from '../command/punishment/util';

export class ModerationActionService {
    // Ban a user
    public static async banUser(
        member: GuildMember | PartialGuildMember | User,
        duration: PunishmentDuration | null = null,
        moderator?: GuildMember | PartialGuildMember | User,
        guild?: Guild,
        reason: string = 'Unknown reason',
    ) {
        // Update user in database
        await prisma.user.upsert({
            where: { id: member.id },
            create: {
                id: member.id,
                banned: true,
                banStartTime: duration?.startTime ?? null,
                banEndTime: duration?.endTime ?? null,
                banReason: reason,
            },
            update: {
                banned: true,
                banStartTime: duration?.startTime ?? null,
                banEndTime: duration?.endTime ?? null,
                banReason: reason,
            },
        });

        // Log moderation action
        await prisma.moderationAction.create({
            data: {
                actionType: 'BAN',
                targetUserId: member.id,
                moderatorId: moderator?.id ?? '',
                guildId: guild?.id ?? '',
                reason: reason,
                duration: duration?.duration,
                createdAt: duration?.startTime ?? new Date(),
                expiresAt: duration?.endTime ?? null,
            },
        });
    }

    // Unban a user
    public static async unbanUser(
        member: GuildMember | PartialGuildMember | User,
        moderator?: GuildMember | PartialGuildMember | User,
        guild?: Guild,
        reason: string = 'Unknown reason',
    ) {
        // Update user in database
        await prisma.user.upsert({
            where: { id: member.id },
            create: {
                id: member.id,
            },
            update: {
                banned: false,
                banStartTime: null,
                banEndTime: null,
                banReason: null,
            },
        });

        // Log moderation action
        await prisma.moderationAction.create({
            data: {
                actionType: 'UNBAN',
                targetUserId: member.id,
                moderatorId: moderator?.id ?? '',
                guildId: guild?.id ?? '',
                reason: reason,
            },
        });
    }

    public static async isBanned(member: GuildMember | PartialGuildMember) {
        const user = await prisma.user.findUnique({
            where: {
                id: member.guild.id,
            },
        });

        if (!user) return false;

        return user.banned;
    }

    // Mute a user
    public static async muteUser(
        member: GuildMember | PartialGuildMember | User,
        duration: PunishmentDuration | null = null,
        moderator?: GuildMember | PartialGuildMember | User,
        guild?: Guild,
        reason: string = 'Unknown reason',
    ) {
        // Update user in database
        await prisma.user.upsert({
            where: { id: member.id },
            create: {
                id: member.id,
                muted: true,
                muteStartTime: duration?.startTime ?? null,
                muteEndTime: duration?.endTime ?? null,
                muteReason: reason,
            },
            update: {
                muted: true,
                muteStartTime: duration?.startTime ?? null,
                muteEndTime: duration?.endTime ?? null,
                muteReason: reason,
            },
        });

        // Log moderation action
        await prisma.moderationAction.create({
            data: {
                actionType: 'MUTE',
                targetUserId: member.id,
                moderatorId: moderator?.id ?? '',
                guildId: guild?.id ?? '',
                reason: reason,
                duration: duration?.duration,
                createdAt: duration?.startTime ?? new Date(),
                expiresAt: duration?.endTime ?? null,
            },
        });
    }

    // Unmute a user
    public static async unmuteUser(
        member: GuildMember | PartialGuildMember | User,
        moderator?: GuildMember | PartialGuildMember | User,
        guild?: Guild,
        reason: string = 'Unknown reason',
    ) {
        // Update user in database
        await prisma.user.upsert({
            where: { id: member.id },
            create: {
                id: member.id,
            },
            update: {
                muted: false,
                muteStartTime: null,
                muteEndTime: null,
                muteReason: null,
            },
        });

        // Log moderation action
        await prisma.moderationAction.create({
            data: {
                actionType: 'UNMUTE',
                targetUserId: member.id,
                moderatorId: moderator?.id ?? '',
                guildId: guild?.id ?? '',
                reason: reason,
            },
        });
    }

    public static async isMuted(member: GuildMember | PartialGuildMember) {
        const user = await prisma.user.findUnique({
            where: {
                id: member.guild.id,
            },
        });

        if (!user) return false;

        return user.muted;
    }
}
