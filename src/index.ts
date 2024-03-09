import { Client } from "discord.js"
import { PrismaClient } from "@prisma/client"
import { AboutEmbed } from "./embeds/AboutEmbed"

// Setup clients
require("dotenv").config()

const prisma = new PrismaClient()

const client: Client<true> = new Client({
  intents: ["Guilds", "GuildMembers", "GuildModeration"]
})

// Handle gateway events
client.on("roleDelete", async role => {
  await prisma.role.delete({
    where: { id: role.id }
  })

  console.log(`Deleted role ${role.name} (${role.id})`)
})

client.on("guildDelete", async guild => {
  await prisma.guild.delete({
    where: { id: guild.id }
  })

  console.log(`Left guild ${guild.name} (${guild.id})`)
})

client.on("guildMemberAdd", async member => {
  const roles = await prisma.role.findMany({
    where: {
      guildId: member.guild.id,
      users: {
        some: { userId: member.id }
      }
    }
  })

  if (roles.length === 0) return

  const guildRoles = await member.guild.roles.fetch()
  const botMember = await member.guild.members.fetch(client.user.id)

  const higherRoles = guildRoles.filter(
    role => role.position > botMember.roles.highest.position
  )

  const validRoles = roles
    .filter(role => !higherRoles.has(role.id))
    .filter(role => role.id !== member.guild.id)
    .map(role => role.id)

  await member.roles.add(validRoles).catch(console.error)

  console.log(`Added ${validRoles.length} roles to ${member.user.username}`)
})

client.on("guildMemberRemove", async member => {
  await prisma.guild.upsert({
    where: { id: member.guild.id },
    create: { id: member.guild.id },
    update: { id: member.guild.id }
  })

  await prisma.user.upsert({
    where: { id: member.id },
    create: { id: member.id },
    update: { id: member.id }
  })

  for (const role of member.roles.cache.values()) {
    await prisma.role.upsert({
      where: { id: role.id },
      create: { id: role.id, guildId: role.guild.id },
      update: { id: role.id, guildId: role.guild.id }
    })

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: member.id, roleId: role.id } },
      create: { userId: member.id, roleId: role.id },
      update: { userId: member.id, roleId: role.id }
    })
  }

  console.log(
    `Saved ${member.user.username}'s roles for guild ${member.guild.name} (${member.guild.id})`
  )
})

client.on("interactionCreate", async interaction => {
  if (interaction.user.bot) return

  // Handle about me
  if (interaction.isChatInputCommand() && interaction.commandName === "about") {
    await interaction
      .reply({ embeds: [AboutEmbed()], ephemeral: true })
      .catch(console.error)
    return
  }
})

// Login bot
client.once("ready", () => console.log(`Logged in as ${client.user.username}`))
client.login(process.env.TOKEN)
