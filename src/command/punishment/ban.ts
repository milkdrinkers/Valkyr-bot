import { ApplicationCommandOptionType, CommandInteraction, Guild, GuildMember, Role, User, type PartialGuildMember } from 'discord.js';
import { Discord, Slash, SlashChoice, SlashOption } from 'discordx';
import { Color } from '../../utility/color';
import { prisma } from '../..';

@Discord()
export default abstract class Ban {
    @Slash({ description: "Ban a player from the discord" })
    private async ban(
        @SlashOption({
            name: 'user',
            description: 'The user to ban.',
            required: true,
            type: ApplicationCommandOptionType.User,
        }) user: User,
        interaction: CommandInteraction
    ) {
        try {
            const member = interaction.member;
            
            if (!(member instanceof GuildMember))
                throw new Error('The user is not in the guild');

            const guild = interaction.guild;
            if (guild === null)
                throw new Error('The guild could not be found!');

            const targetMember = guild.members.cache.get(user.id);

            await interaction.deferReply({ flags: ['Ephemeral'] }); // It is vital to defer the reply if response will take more than a few seconds
            
            const originalApprovalRoles = process.env['ALLOW_BAN_ROLES'] ?? '';

            const approvalRoles: Role[] = originalApprovalRoles
                .split(',')
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(role => role !== undefined);

            const hasApproverRole = Ban.hasRole(member, approvalRoles);

            if (!hasApproverRole)
                throw new Error('You do not have the required permissions to execute this command!');
                
            if (targetMember !== undefined) {
                const targetHasHigherRole = targetMember.roles.highest.position >= member.roles.highest.position;
                if (targetHasHigherRole)
                    throw new Error('The target user has greater or equal permissions to you!');

                Ban.ban(targetMember);
            }

            await Ban.banDB(user);
            
            await interaction.followUp({
                embeds: [
                    {
                        description: `Banned ${targetMember ?? user}.`,
                        color: Color.GREEN
                    }
                ],
                flags: ['Ephemeral']
            })
        } catch(error) {
            await interaction.followUp({
                embeds: [
                    {
                        description: `Failed to ban. ${(error as Error).message}`,
                        color: Color.RED
                    }
                ],
                flags: ['Ephemeral']
            })
        }
    }

    @Slash({ description: "Unban a player from the discord." })
    private async unban(
        @SlashOption({
            name: 'user',
            description: 'The user to unban.',
            required: true,
            type: ApplicationCommandOptionType.User,
        }) user: User,
        interaction: CommandInteraction
    ) {
        try {
            const member = interaction.member;
            
            if (!(member instanceof GuildMember))
                throw new Error('The user is not in the guild');

            const guild = interaction.guild;
            if (guild === null)
                throw new Error('The guild could not be found!');

            const targetMember = guild.members.cache.get(user.id);
    
            await interaction.deferReply({ flags: ['Ephemeral'] }); // It is vital to defer the reply if response will take more than a few seconds
    
            const originalApprovalRoles = process.env['ALLOW_BAN_ROLES'] ?? '';

            const approvalRoles: Role[] = originalApprovalRoles
                .split(',')
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(role => role !== undefined);

            const hasApproverRole = Ban.hasRole(member, approvalRoles);
    
            if (!hasApproverRole)
                throw new Error('You do not have the required permissions to execute this command!');
                
            if (targetMember !== undefined) {
                const targetHasHigherRole = targetMember.roles.highest.position >= member.roles.highest.position;
                if (targetHasHigherRole)
                    throw new Error('The target user has greater or equal permissions to you!');

                Ban.unban(targetMember);
            }

            await Ban.unbanDB(user);
            
            await interaction.followUp({
                embeds: [
                    {
                        description: `Unbanned ${targetMember ?? user}.`,
                        color: Color.GREEN
                    }
                ],
                flags: ['Ephemeral']
            })
        } catch(error) {
            await interaction.followUp({
                embeds: [
                    {
                        description: `Failed to unban. ${(error as Error).message}`,
                        color: Color.RED
                    }
                ],
                flags: ['Ephemeral']
            })
        }
    }

    private static hasRole(member: GuildMember | PartialGuildMember, requiredRoles: Role[]) {
        return member.roles.cache.some(role => requiredRoles.includes(role));
    }

    public static getBannedRoles(guild: Guild) {
        return (process.env['BANNED_ROLES'] ?? '')
            .split(',')
            .map(roleId => guild.roles.cache.get(roleId))
            .filter(role => role !== undefined);
    }

    /**
     * ban
     */
    public static ban(member: GuildMember | PartialGuildMember) {
        const bannedRoles = this.getBannedRoles(member.guild);

        bannedRoles.forEach(role => {
            if (!member.roles.cache.has(role.id))
                member.roles.add(role);
        })
    }

    /**
     * unban
     */
    public static unban(member: GuildMember | PartialGuildMember) {
        const bannedRoles = this.getBannedRoles(member.guild);

        bannedRoles.forEach(role => {
            if (member.roles.cache.has(role.id))
                member.roles.remove(role);
        })
    }

    /**
     * isBanned
     */
    public static isBanned(member: GuildMember | PartialGuildMember) {
        const bannedRoles = this.getBannedRoles(member.guild);

        return this.hasRole(member, bannedRoles);
    }

    /**
     * isBanned
     */
    public static async isBannedDB(member: GuildMember | PartialGuildMember) {
        const user = await prisma.user.findUnique({
            where: {
                id: member.guild.id
            }
        })

        if (!user)
            return false;

        return user.banned;
    }

    /**
     * ban
     */
    public static async banDB(member: GuildMember | PartialGuildMember | User) {
        await prisma.user.upsert({
            where: { id: member.id },
            create: { 
                id: member.id, 
                banned: true,
            },
            update: { 
                id: member.id,
                banned: true,
            }
        })
    }

    /**
     * unban
     */
    public static async unbanDB(member: GuildMember | PartialGuildMember | User) {
        await prisma.user.upsert({
            where: { id: member.id },
            create: { 
                id: member.id, 
            },
            update: { 
                id: member.id,
                banned: false,
            }
        })
    }
}