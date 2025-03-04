import type { PrismaClient } from '@prisma/client';
import { AuditLogEvent, Events, GuildMember, Role } from 'discord.js';
import { Client } from 'discordx';

export default (client: Client, _prisma: PrismaClient) => {
    /**
     * There are two ways to counter patreons Discord integration.
     *
     * 1. (Risky)
     * That which is implemented in this file is a complex fix,
     * which relies on generally risky assumptions.
     *
     * When the Patreon Bot removes a role,
     * we schedule it to be re-added to the user after a specific amount of time.
     *
     * 2. (Smarter)
     * For each rank you wish to sync to a role, create a throw-away Patreon version of the role.
     *
     * When Patreon adds users to the throw-away role,
     * react to the event and add them to the equivalent discord role.
     *
     */

    function _implementationOne() {
        const SLEEP_DURATION = 10;
        const PATREON_DISCORD_BOT = '216303189073461248';
        const userRoleCache = new Map<string, Role[]>();

        /**
         * This event is triggered when the Patreon Discord Bot removes a users server role
         */
        client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
            if (entry.executor?.id !== PATREON_DISCORD_BOT) return;

            if (entry.action !== AuditLogEvent.MemberRoleUpdate) return;

            if (entry.changes.length !== 1)
                // Role was removed rather than added
                return;

            if (entry.changes[0].key !== '$remove')
                // On role removal
                return;

            if (entry.changes[0].old?.length !== 1)
                // Ensure that a role was removed
                return;

            const member = entry.target;
            if (!(member instanceof GuildMember)) return;

            const roleId = entry.changes[0].old[0].id;
            const removedRole = guild.roles.cache.get(roleId);
            if (removedRole === undefined) return;

            if (!isScheduled(member)) {
                schedule(member, [removedRole]);
                return await waitAndCheck(member);
            }

            schedule(member, [removedRole]);
        });

        function schedule(member: GuildMember, roles: Role[]) {
            console.log(`Scheduled Patreon fix for ${member.user.username}'s in guild ${member.guild.name} (${member.guild.id}).`);
            userRoleCache.set(member.id, [...(userRoleCache.get(member.id) ?? []), ...roles]); // Merge already scheduled roles with new entries
        }

        function isScheduled(member: GuildMember) {
            return userRoleCache.has(member.id);
        }

        function unschedule(member: GuildMember) {
            console.log(`Completed scheduled Patreon fix for ${member.user.username}'s in guild ${member.guild.name} (${member.guild.id}).`);
            return userRoleCache.delete(member.id);
        }

        function getScheduled(member: GuildMember) {
            return userRoleCache.get(member.id) ?? [];
        }

        async function waitAndCheck(member: GuildMember) {
            // Wait for all roles to be removed
            await new Promise(resolve => setTimeout(resolve, SLEEP_DURATION));

            // Check if Patreon role was removed
            // if (removedRoleIds.includes(PATREON_ROLE_ID)) { // Uncomment this to allow patreon removing old patrons
            //     return;
            // }

            // Add back removed roles
            for (const role of getScheduled(member)) {
                await member.roles.add(role, 'Overriding Patreon bot removing roles.');
            }

            // Remove member from role update cache
            unschedule(member);
        }
    }

    function implementationTwo() {
        const syncRoles = new Map<string, string[]>(); // Adds from, to
        syncRoles.set('1332936790419701921', ['1078858924612145234', '857750554713391115']); // Simp
        syncRoles.set('1332936661872414865', ['1078858924612145234', '857750502833258517']); // Diamond
        syncRoles.set('1332936618864148491', ['1078858924612145234', '857750459664826428']); // Gold
        syncRoles.set('1332936510286336000', ['1078858924612145234', '857750334629478410']); // Iron

        client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
            // Iterate through the roles we want to sync
            for (const [triggerRoleId, syncedRolesIds] of syncRoles) {
                // Check if member was added to the trigger role
                if (!oldMember.roles.cache.has(triggerRoleId) && newMember.roles.cache.has(triggerRoleId)) {
                    try {
                        await newMember.roles.add(syncedRolesIds, 'Custom Patreon Role Synchronization');
                    } catch (error) {
                        console.error(`Failed to sync patreon roles for ${newMember.displayName}:`, error);
                    }
                }
            }
        });
    }

    implementationTwo();
};
