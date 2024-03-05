import { EmbedBuilder } from "discord.js"

export const AboutEmbed = () =>
  new EmbedBuilder()
    .setTitle("Continuity")
    .setURL("http://5f.au/continuity")
    .setDescription(
      "Persist roles when users leave and rejoin the server.\n\nContinuity is already working as soon as it joins your server! Just make sure to move its highest role to above anything you wish to be persisted.\n\nCreated as part of [5f.au](https://discord.gg/deAfFeVY7u)."
    )
