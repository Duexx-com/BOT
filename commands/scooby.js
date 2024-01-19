const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('members_count')
		.setDescription('Display the Members Count of This Server!'),
	async execute(client, interaction) {
    const embed = new MessageEmbed()
      .setTitle(`${interaction.guild.name} - Members Count:`)
      .setDescription(`There are **${interaction.guild.memberCount}** Members on this Server!`)
      .setColor("GREEN")

    return interaction.reply({ embeds: [ embed ] })

	},
};