import { ApplicationCommandOptionType, CommandInteraction, Guild, GuildMember, Role, User, type PartialGuildMember } from 'discord.js';
import { Discord, Slash, SlashOption } from 'discordx';
import { Color } from '../../utility/color';
import { prisma } from '../..';
import { ModerationActionService } from '../../service/moderationService';
import { parseDuration } from './util';

@Discord()
export default abstract class Mute {
    @Slash({ description: "Mute a player in the discord" })
    private async mute(
        @SlashOption({
            name: 'user',
            description: 'The user to mute.',
            required: true,
            type: ApplicationCommandOptionType.User,
        }) user: User,

        @SlashOption({
            name: 'reason',
            description: 'What is the user being punished for?',
            required: false,
            type: ApplicationCommandOptionType.String,
        }) reason: string = 'No reason provided.',
        
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
                throw new Error('The user is not in the guild!');

            const guild = interaction.guild;
            if (guild === null)
                throw new Error('The guild could not be found!');

            const targetMember = guild.members.cache.get(user.id);
            
            const originalApprovalRoles = process.env['ALLOW_MUTE_ROLES'] ?? '';

            const approvalRoles: Role[] = originalApprovalRoles
                .split(',')
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(role => role !== undefined);

            const hasApproverRole = Mute.hasRole(member, approvalRoles);

            if (!hasApproverRole)
                throw new Error('You do not have the required permissions to execute this command!');

            // Parse duration
            const punishmentDuration = parseDuration(duration);

            if (targetMember !== undefined) {
                const targetHasHigherRole = targetMember.roles.highest.position >= member.roles.highest.position;
                if (targetHasHigherRole)
                    throw new Error('The target user has greater or equal permissions to you!');

                Mute.giveMuteRoles(targetMember);
            }

            await ModerationActionService.muteUser(user, punishmentDuration, member, guild, reason)
            
            await interaction.followUp({
                embeds: [
                    {
                        description: `Muted ${targetMember ?? user}.`,
                        color: Color.GREEN
                    }
                ],
                flags: ['Ephemeral']
            })
        } catch(error) {
            await interaction.followUp({
                embeds: [
                    {
                        description: `Failed to mute. ${(error as Error).message}`,
                        color: Color.RED
                    }
                ],
                flags: ['Ephemeral']
            })
        }
    }

    @Slash({ description: "Unmute a player in the discord." })
    private async unmute(
        @SlashOption({
            name: 'user',
            description: 'The user to unmute',
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
                throw new Error('The user is not in the guild!');

            const guild = interaction.guild;
            if (guild === null)
                throw new Error('The guild could not be found!');

            const targetMember = guild.members.cache.get(user.id);
    
            const originalApprovalRoles = process.env['ALLOW_MUTE_ROLES'] ?? '';

            const approvalRoles: Role[] = originalApprovalRoles
                .split(',')
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(role => role !== undefined);

            const hasApproverRole = Mute.hasRole(member, approvalRoles);
    
            if (!hasApproverRole)
                throw new Error('You do not have the required permissions to execute this command!');
                
            if (targetMember !== undefined) {
                const targetHasHigherRole = targetMember.roles.highest.position >= member.roles.highest.position;
                if (targetHasHigherRole)
                    throw new Error('The target user has greater or equal permissions to you!');

                Mute.takeMuteRoles(targetMember);
            }

            await ModerationActionService.unmuteUser(user, member, guild, reason);
            
            await interaction.followUp({
                embeds: [
                    {
                        description: `Unmuted ${targetMember ?? user}.`,
                        color: Color.GREEN
                    }
                ],
                flags: ['Ephemeral']
            })
        } catch(error) {
            await interaction.followUp({
                embeds: [
                    {
                        description: `Failed to unmute. ${(error as Error).message}`,
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

    public static getMutedRoles(guild: Guild) {
        return (process.env['MUTED_ROLES'] ?? '')
            .split(',')
            .map(roleId => guild.roles.cache.get(roleId))
            .filter(role => role !== undefined);
    }

    /**
     * mute
     */
    public static giveMuteRoles(member: GuildMember | PartialGuildMember, reason: string = 'Unknown reason') {
        const mutedRoles = this.getMutedRoles(member.guild);

        mutedRoles.forEach(role => {
            if (!member.roles.cache.has(role.id))
                member.roles.add(role, reason);
        })
    }

    /**
     * unmute
     */
    public static takeMuteRoles(member: GuildMember | PartialGuildMember, reason: string = 'Unknown reason') {
        const mutedRoles = this.getMutedRoles(member.guild);

        mutedRoles.forEach(role => {
            if (member.roles.cache.has(role.id))
                member.roles.remove(role, reason);
        })

    }

    /**
     * isMuted
     */
    public static isMuted(member: GuildMember | PartialGuildMember) {
        const mutedRoles = this.getMutedRoles(member.guild);

        return this.hasRole(member, mutedRoles);
    }
}