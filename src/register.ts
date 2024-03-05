import {
  ApplicationCommandType,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js"
import dotenv from "dotenv"

dotenv.config()

const rest = new REST().setToken(process.env.TOKEN)

// Create commands
const about = new SlashCommandBuilder()
  .setName("about")
  .setDescription("About this bot")
  .setDMPermission(true)
  .setNSFW(false)

// Register commands
rest
  .put(Routes.applicationCommands(process.env.CLIENT_ID), {
    body: [about.toJSON()]
  })
  .then(() => console.log("Successfully registered commands"))
