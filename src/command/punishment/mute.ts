import { ApplicationCommandOptionType, CommandInteraction, Guild, GuildMember, Role, User, type PartialGuildMember } from 'discord.js';
import { Discord, Slash, SlashOption } from 'discordx';
import { Color } from '../../utility/color';
import { prisma } from '../..';

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
        interaction: CommandInteraction
    ) {
        try {
            const member = interaction.member;
            
            if (!(member instanceof GuildMember))
                throw new Error('The user is not in the guild!');

            const guild = interaction.guild;
            if (guild === null)
                throw new Error('The guild could not be found!');

            const targetMember = guild.members.cache.get(user.id);

            await interaction.deferReply({ flags: ['Ephemeral'] }); // It is vital to defer the reply if response will take more than a few seconds
            
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

                Mute.mute(targetMember);
            }

            await Mute.muteDB(user);
            
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
            description: 'The user to unmute.',
            required: true,
            type: ApplicationCommandOptionType.User,
        }) user: User,
        interaction: CommandInteraction
    ) {
        try {
            const member = interaction.member;
            
            if (!(member instanceof GuildMember))
                throw new Error('The user is not in the guild!');

            const guild = interaction.guild;
            if (guild === null)
                throw new Error('The guild could not be found!');

            const targetMember = guild.members.cache.get(user.id);
    
            await interaction.deferReply({ flags: ['Ephemeral'] }); // It is vital to defer the reply if response will take more than a few seconds
    
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

                Mute.unmute(targetMember);
            }

            await Mute.unmuteDB(user);
            
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
    public static mute(member: GuildMember | PartialGuildMember) {
        const mutedRoles = this.getMutedRoles(member.guild);

        mutedRoles.forEach(role => {
            if (!member.roles.cache.has(role.id))
                member.roles.add(role);
        })
    }

    /**
     * unmute
     */
    public static unmute(member: GuildMember | PartialGuildMember) {
        const mutedRoles = this.getMutedRoles(member.guild);

        mutedRoles.forEach(role => {
            if (member.roles.cache.has(role.id))
                member.roles.remove(role);
        })

    }

    /**
     * isMuted
     */
    public static isMuted(member: GuildMember | PartialGuildMember) {
        const mutedRoles = this.getMutedRoles(member.guild);

        return this.hasRole(member, mutedRoles);
    }

    /**
     * isMuted
     */
    public static async isMutedDB(member: GuildMember | PartialGuildMember) {
        const user = await prisma.user.findUnique({
            where: {
                id: member.guild.id
            }
        })

        if (!user)
            return false;

        return user.muted;
    }

    /**
     * mute
     */
    public static async muteDB(member: GuildMember | PartialGuildMember | User) {
        await prisma.user.upsert({
            where: { id: member.id },
            create: { 
                id: member.id, 
                muted: true,
            },
            update: { 
                id: member.id,
                muted: true,
            }
        })
    }

    /**
     * unmute
     */
    public static async unmuteDB(member: GuildMember | PartialGuildMember | User) {
        await prisma.user.upsert({
            where: { id: member.id },
            create: { 
                id: member.id, 
            },
            update: { 
                id: member.id,
                muted: false,
            }
        })
    }
}