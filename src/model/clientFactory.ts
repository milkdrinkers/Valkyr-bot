import { IntentsBitField } from 'discord.js';
import { Client } from 'discordx';

export const clientFactory = () => {
    try {
        return new Client({
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.GuildMembers,
                IntentsBitField.Flags.GuildModeration,
                IntentsBitField.Flags.GuildVoiceStates,
                IntentsBitField.Flags.GuildPresences,
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.GuildMessageReactions,
                IntentsBitField.Flags.MessageContent,
                IntentsBitField.Flags.GuildVoiceStates,
            ],
            silent: false,
            guards: [], // TODO Add guards here
        });
    } catch (error) {
        throw new Error("Failed to create discord client!");
    }
};
export default clientFactory;