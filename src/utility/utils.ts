/**
 * Check if a string is a valid discord bot token
 * @param token a discord token
 * @returns true if valid, throws error if invalid
 */
export const validateBotToken = (token?: string): token is string => {
    if (token == undefined || token.length == 0) {
        throw new Error("Invalid discord bot token.");
    }
    return true;
};
