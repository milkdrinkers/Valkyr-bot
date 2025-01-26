import { ApplicationCommandOptionType, CommandInteraction, GuildMember, Role, User } from 'discord.js';
import { Discord, Slash, SlashChoice, SlashOption } from 'discordx';
import { Color } from '../../utility/color';

enum ApproveTypes {
    Leader = 'Nation/Town Leader',
    Mapper = 'Mapper',
    Character = 'Character',
}

@Discord()
export default abstract class Approval {
    @Slash({ description: "Give a user a approved role." })
    private async approve(
        @SlashChoice(
            {
                name: ApproveTypes.Leader,
                value: ApproveTypes.Leader,
            },
            {
                name: ApproveTypes.Mapper,
                value: ApproveTypes.Mapper,
            },
            {
                name: ApproveTypes.Character,
                value: ApproveTypes.Character,
            },
        ) 
        @SlashOption({
            description: "What role are you handling?",
            name: "type",
            required: true,
            type: ApplicationCommandOptionType.String,
        }) type: string,
        @SlashOption({
            name: 'user',
            description: 'The user to approve.',
            required: true,
            type: ApplicationCommandOptionType.User,
        }) user: User,
        interaction: CommandInteraction
    ) {
        try {
            const member = interaction.member;
            
            if (!(member instanceof GuildMember))
                throw new Error('The guild user not be found!');

            const guild = interaction.guild;
            if (guild === null)
                throw new Error('The guild could not be found!');

            const targetMember = guild.members.cache.get(user.id);
            if (targetMember === undefined)
                throw new Error('The specified user could not be found!');

            await interaction.deferReply({ flags: ['Ephemeral'] }); // It is vital to defer the reply if response will take more than a few seconds
            
            let originalApprovalRoles;
            let originalApprovedRoles;
            switch (type) {
                case ApproveTypes.Leader:
                    originalApprovalRoles = process.env['APPROVAL_LEADER_ROLES'] ?? '';
                    originalApprovedRoles = process.env['APPROVED_LEADER_ROLES'] ?? '';
                    break;
                case ApproveTypes.Mapper:
                    originalApprovalRoles = process.env['APPROVAL_MAPPER_ROLES'] ?? '';
                    originalApprovedRoles = process.env['APPROVED_MAPPER_ROLES'] ?? '';
                    break;
                case ApproveTypes.Character:
                    originalApprovalRoles = process.env['APPROVAL_CHARACTER_ROLES'] ?? '';
                    originalApprovedRoles = process.env['APPROVED_CHARACTER_ROLES'] ?? '';
                    break;
                default:
                    throw new Error('The approval type is wrong!');
            }

            const approvalRoles: Role[] = originalApprovalRoles
                .split(',')
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(role => role !== undefined);

            const approvedRoles = originalApprovedRoles
                .split(',')
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(role => role !== undefined);

            const hasApproverRole = this.hasRole(member, approvalRoles);

            if (!hasApproverRole)
                throw new Error('You do not have the required permissions to execute this command!');
                
            // Give roles
            approvedRoles.forEach(role => {
                if (!targetMember.roles.cache.has(role.id))
                    targetMember.roles.add(role);
            })
            
            await interaction.followUp({
                embeds: [
                    {
                        description: `Granted ${targetMember} approved role.`,
                        color: Color.GREEN
                    }
                ],
                flags: ['Ephemeral']
            })
        } catch(error) {
            await interaction.followUp({
                embeds: [
                    {
                        description: `Failed to grant approved role. ${(error as Error).message}`,
                        color: Color.RED
                    }
                ],
                flags: ['Ephemeral']
            })
        }
    }

    @Slash({ description: "Remove a users approved role." })
    private async disapprove(
        @SlashChoice(
            {
                name: ApproveTypes.Leader,
                value: ApproveTypes.Leader,
            },
            {
                name: ApproveTypes.Mapper,
                value: ApproveTypes.Mapper,
            },
            {
                name: ApproveTypes.Character,
                value: ApproveTypes.Character,
            },
        )
        @SlashOption({
            description: "What role are you handling?",
            name: "type",
            required: true,
            type: ApplicationCommandOptionType.String,
        }) type: string,
        @SlashOption({
            name: 'user',
            description: 'The user to disapprove.',
            required: true,
            type: ApplicationCommandOptionType.User,
        }) user: User,
        interaction: CommandInteraction
    ) {
        try {
            const member = interaction.member;
            
            if (!(member instanceof GuildMember))
                throw new Error('The guild user not be found!');

            const guild = interaction.guild;
            if (guild === null)
                throw new Error('The guild could not be found!');

            const targetMember = guild.members.cache.get(user.id);
            if (targetMember === undefined)
                throw new Error('The specified user could not be found!');
    
            await interaction.deferReply({ flags: ['Ephemeral'] }); // It is vital to defer the reply if response will take more than a few seconds
    
            let originalApprovalRoles;
            let originalApprovedRoles;
            switch (type) {
                case ApproveTypes.Leader:
                    originalApprovalRoles = process.env['APPROVAL_LEADER_ROLES'] ?? '';
                    originalApprovedRoles = process.env['APPROVED_LEADER_ROLES'] ?? '';
                    break;
                case ApproveTypes.Mapper:
                    originalApprovalRoles = process.env['APPROVAL_MAPPER_ROLES'] ?? '';
                    originalApprovedRoles = process.env['APPROVED_MAPPER_ROLES'] ?? '';
                    break;
                case ApproveTypes.Character:
                    originalApprovalRoles = process.env['APPROVAL_CHARACTER_ROLES'] ?? '';
                    originalApprovedRoles = process.env['APPROVED_CHARACTER_ROLES'] ?? '';
                    break;
                default:
                    throw new Error('The approval type is wrong!');
            }

            const approvalRoles: Role[] = originalApprovalRoles
                .split(',')
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(role => role !== undefined);

            const approvedRoles = originalApprovedRoles
                .split(',')
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(role => role !== undefined);
    
            const hasApproverRole = this.hasRole(member, approvalRoles);
    
            if (!hasApproverRole)
                throw new Error('You do not have the required permissions to execute this command!');
        
            // Remove roles
            approvedRoles.forEach(role => {
                if (targetMember.roles.cache.has(role.id))
                    targetMember.roles.remove(role);
            })
            
            await interaction.followUp({
                embeds: [
                    {
                        description: `Removed ${targetMember} approved role.`,
                        color: Color.GREEN
                    }
                ],
                flags: ['Ephemeral']
            })
        } catch(error) {
            await interaction.followUp({
                embeds: [
                    {
                        description: `Failed to remove approved role. ${(error as Error).message}`,
                        color: Color.RED
                    }
                ],
                flags: ['Ephemeral']
            })
        }
    }

    private hasRole(member: GuildMember, requiredRoles: Role[]) {
        return member.roles.cache.some(r => requiredRoles.includes(r));
    }
}