import { Events } from 'discord.js';
import clientFactory from './model/clientFactory';
import { validateBotToken } from './utility/utils';
import './command/commands';

if (!validateBotToken(process.env['DISCORD_TOKEN'])) process.exit(0);

export const client = clientFactory();

client.on(Events.ClientReady, async () => {
    await client.initApplicationCommands(false);
    process.exit(1);
});

await client.login(process.env['DISCORD_TOKEN']);
