import { client, prisma } from '..';
import Ban from '../command/punishment/ban';
import Mute from '../command/punishment/mute';
import { ModerationActionService } from './moderationService';

export class PunishmentService {
    /**
     * Clears expired punishments
     */
    static async checkExpiredPunishments() {
        console.log(`Checking for expired punishments`);

        const now = new Date();

        // Check for expired bans
        const expiredBans = await prisma.user.findMany({
            where: {
                banned: true,
                banEndTime: {
                    lt: now
                }
            }
        });

        for (const user of expiredBans) {
            const dUser = client.users.cache.get(user.id);
            if (!dUser)
                continue;

            await ModerationActionService.unbanUser(dUser, undefined, undefined, "Expired");

            // go through all guilds and try to unban
            for (const guild of client.guilds.cache.values()) {
                try {
                    const member = guild.members.cache.get(dUser.id);
                    if (!member)
                        continue;

                    Ban.takeBanRoles(member, "Expired");
                } catch (ignored) { // Ignore errors (user might not be banned in this guild)
                }
            }

            console.log(`Auto-unbanned user ${dUser.username} due to expired ban`);
        }

        // Check for expired mutes
        const expiredMutes = await prisma.user.findMany({
            where: {
                muted: true,
                muteEndTime: {
                    lt: now
                }
            }
        });

        for (const user of expiredMutes) {
            const dUser = client.users.cache.get(user.id);
            if (!dUser)
                continue;

            await ModerationActionService.unmuteUser(dUser, undefined, undefined, "Expired");
            
            // go through all guilds and try to unmute
            for (const guild of client.guilds.cache.values()) {
                try {
                    const member = guild.members.cache.get(dUser.id);
                    if (!member)
                        continue;

                    Mute.takeMuteRoles(member, "Expired");
                } catch (ignored) { // Ignore errors (user might not be muted in this guild)
                }
            }

            console.log(`Auto-unmuted user ${dUser.username} due to expired mute`);
        }
    }
}