import { ApplicationCommandOptionType, CommandInteraction, Guild, GuildMember, Role, User, type PartialGuildMember } from 'discord.js';
import { Discord, Slash, SlashChoice, SlashOption } from 'discordx';
import { Color } from '../../utility/color';
import { prisma } from '../..';
import { ModerationActionService } from '../../service/moderationService';
import { parseDuration } from './util';

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

        @SlashOption({
            name: 'reason',
            description: 'What is the user being punished for?',
            required: false,
            type: ApplicationCommandOptionType.String,
        }) reason: string = 'No reason provided',
        
        @SlashOption({
            name: 'duration',
            description: 'How long this punishment will last, format as (3mo 1d 2h 4m 5s).',
            required: false,
            type: ApplicationCommandOptionType.String,
        }) duration: string,
        
        interaction: CommandInteraction
    ) {
        await interaction.deferReply({ flags: ['Ephemeral'] }); // It is vital to defer the reply if response will take more than a few seconds
        
        try {
            const member = interaction.member;
            
            if (!(member instanceof GuildMember))
                throw new Error('The user is not in the guild');

            const guild = interaction.guild;
            if (guild === null)
                throw new Error('The guild could not be found!');

            const targetMember = guild.members.cache.get(user.id);

            const originalApprovalRoles = process.env['ALLOW_BAN_ROLES'] ?? '';

            const approvalRoles: Role[] = originalApprovalRoles
                .split(',')
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(role => role !== undefined);

            const hasApproverRole = Ban.hasRole(member, approvalRoles);

            if (!hasApproverRole)
                throw new Error('You do not have the required permissions to execute this command!');
                
            // Parse duration
            const punishmentDuration = parseDuration(duration);

            if (targetMember !== undefined) {
                const targetHasHigherRole = targetMember.roles.highest.position >= member.roles.highest.position;
                if (targetHasHigherRole)
                    throw new Error('The target user has greater or equal permissions to you!');

                Ban.giveBanRoles(targetMember);
            }

            await ModerationActionService.banUser(user, punishmentDuration, member, guild, reason);
            
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

        @SlashOption({
            name: 'reason',
            description: 'What is the user being punished for?',
            required: false,
            type: ApplicationCommandOptionType.String,
        }) reason: string = 'No reason provided',
        
        interaction: CommandInteraction
    ) {
        await interaction.deferReply({ flags: ['Ephemeral'] }); // It is vital to defer the reply if response will take more than a few seconds
        
        try {
            const member = interaction.member;
            
            if (!(member instanceof GuildMember))
                throw new Error('The user is not in the guild');

            const guild = interaction.guild;
            if (guild === null)
                throw new Error('The guild could not be found!');

            const targetMember = guild.members.cache.get(user.id);
    
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

                Ban.takeBanRoles(targetMember);
            }

            await ModerationActionService.unbanUser(user, member, guild, reason);
            
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
    public static giveBanRoles(member: GuildMember | PartialGuildMember, reason: string = 'Unknown reason') {
        const bannedRoles = this.getBannedRoles(member.guild);

        bannedRoles.forEach(role => {
            if (!member.roles.cache.has(role.id))
                member.roles.add(role, reason);
        })
    }

    /**
     * unban
     */
    public static takeBanRoles(member: GuildMember | PartialGuildMember, reason: string = 'Unknown reason') {
        const bannedRoles = this.getBannedRoles(member.guild);

        bannedRoles.forEach(role => {
            if (member.roles.cache.has(role.id))
                member.roles.remove(role, reason);
        })
    }

    /**
     * isBanned
     */
    public static isBanned(member: GuildMember | PartialGuildMember) {
        const bannedRoles = this.getBannedRoles(member.guild);

        return this.hasRole(member, bannedRoles);
    }
}