import closeWithGrace from 'close-with-grace';
import { Events, Message, type Interaction } from 'discord.js';
import clientFactory from './model/clientFactory';
import prismaFactory from './model/prismaFactory';

import './service/monitorService';
import './command/commands';
import patreonBotFixer from './module/patreonBotFixer';
import persistanceHandler from './module/persistanceHandler';
import { PunishmentService } from './service/punishmentService';
import { validateBotToken } from './utility/utils';

// Handle graceful shutdown (Used to prevent node exiting before flushing logs)
closeWithGrace(
    {
        logger: { error: m => console.error(m, 'Shutting down bot due to fatal error!') },
    },
    async ({ signal, err }) => {
        if (err) {
            console.error(err, `${signal} received, shutting down bot with fatal error.`);
        } else {
            console.info(`${signal} received, shutting down bot.`);
        }

        process.exit(0); // Calling exit manually ensure log files are saved
    },
);

if (!validateBotToken(process.env['DISCORD_TOKEN'])) process.exit(0);

export const prisma = await prismaFactory();
export const client = clientFactory();

client.on(Events.ClientReady, async () => {
    await client.initApplicationCommands();

    console.log('Bot started');

    const CHECK_INTERVAL = 60000; // Check for expired bans/mutes every minute
    setInterval(PunishmentService.checkExpiredPunishments, CHECK_INTERVAL);
});

client.on(Events.InteractionCreate, (interaction: Interaction) => {
    client.executeInteraction(interaction);
});

client.on(Events.MessageCreate, (message: Message) => {
    client.executeCommand(message);
});

persistanceHandler(client, prisma);
patreonBotFixer(client, prisma);

await client.login(process.env['DISCORD_TOKEN']);
