// Dependencies
const { MessageEmbed, Message } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');
const CatLoggr = require('cat-loggr');

// Functions
const log = new CatLoggr();
const generated = new Map(); // Changed from Set to Map to store cooldown expiration times

// Custom cooldown in hours
const customCooldownHours = 0.08; // Change the value as desired
const genCooldownsec = customCooldownHours * 60 * 60; // Calculate the cooldown in seconds

module.exports = {
  name: 'bgen', // Command name
  description: 'Generate a specified service if stocked (vgen).', // Command description

  /**
   * Command execute
   * @param {Message} message The message sent by the user
   * @param {Array[]} args Arguments split by spaces after the command name
   */
  execute(message, args) {
    // If the generator channel is not given in config or invalid
    try {
      message.client.channels.cache.get(config.pgenChannel).id; // Try to get the channel's id
    } catch (error) {
      if (error) log.error(error); // If an error occurred, log to console

      // Send error message if the "error_message" field is "true" in the configuration
      if (config.command.error_message === true) {
        return message.channel.send(
          new MessageEmbed()
            .setColor(config.color.red)
            .setTitle('Error occurred!')
            .setDescription('Not a valid gen channel specified!')
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        );
      } else return;
    }

    // If the message channel id is the generator channel id in configuration
    if (message.channel.id === config.vgenChannel) {
      // If the user has a cooldown on the command based on their rank
      let cooldown;
      switch (message.member.roles.cache.some(role => role.name === 'admin')) {
        case true:
          cooldown = 0; // no cooldown for admins
          break;
        case false:
          cooldown = customCooldownHours * 3600; // custom cooldown in hours
          break;
        default:
          cooldown = config.genCooldownsec; // default cooldown for regular users
          break;
      }

      if (generated.has(message.author.id) && generated.get(message.author.id) > Date.now()) {
        const timeLeft = Math.ceil((generated.get(message.author.id) - Date.now()) / 1000);
        const minutesLeft = Math.ceil(timeLeft / 60);
        return message.channel.send(
          new MessageEmbed()
            .setColor(config.color.red)
            .setTitle('Cooldown!')
            .setDescription(`Please wait **${minutesLeft}** minutes before executing that command again!`)
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp()
        );
      } else {
        // Parameters
        const service = args[0];

        // If the "service" parameter is missing
        if (!service) {
          return message.channel.send(
            new MessageEmbed()
              .setColor(config.color.red)
              .setTitle('Missing parameters!')
              .setDescription('You need to give a service name!')
              .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
              .setTimestamp()
          );
        }

        // File path to find the given service
        const filePath = `${__dirname}/../vstock/${args[0]}.txt`;

        // Read the service file
        fs.readFile(filePath, function (error, data) {
          // If no error
          if (!error) {
            data = data.toString(); // Stringify the content

            const position = data.indexOf('\n'); // Get position
            const firstLine = data.split('\n')[0]; // Get the first line

            // If the service file is empty
            if (position === -1) {
              return message.channel.send(
                new MessageEmbed()
                  .setColor(config.color.red)
                  .setTitle('Generator error!')
                  .setDescription(`I do not find the \`${args[0]}\` service in my stock!`)
                  .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                  .setTimestamp()
              );
            }

            // Send messages to the user
            message.author.send(
              new MessageEmbed()
                .setColor(config.color.green)
                .setTitle('Generated account')
                .addField('Service', `\`\`\`${args[0][0].toUpperCase()}${args[0].slice(1).toLowerCase()}\`\`\``, true)
                .addField('Account', `\`\`\`${firstLine}\`\`\``, true)
                .setTimestamp()
            )
              .then(() => {
                const accountMessage = `Service: \`${args[0][0].toUpperCase()}${args[0].slice(1).toLowerCase()}\`\nAccount: \`${firstLine}\``;

                // Send a second DM with the account information
                message.author.send(
                  `\`${firstLine}\``
                )
                .catch(() => {
                  message.channel.send(
                    new MessageEmbed()
                      .setColor(config.color.red)
                      .setTitle('Error!')
                      .setDescription(`Failed to send a second DM to ${message.author}! Make sure you have DMs enabled.`)
                      .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                      .setTimestamp()
                  );
                });
              })
              .catch(() => {
                message.channel.send(
                  new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Error!')
                    .setDescription(`Failed to send a DM to ${message.author}! Make sure you have DMs enabled.`)
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
                );
              });

            // Send message to the channel if the user received the message
            if (position !== -1) {
              data = data.substr(position + 1); // Remove the generated account line

              // Write changes
              fs.writeFile(filePath, data, function (error) {
                message.channel.send(
                  new MessageEmbed()
                    .setColor(config.color.green)
                    .setTitle('Account generated successfully!')
                    .setDescription(`Check your private messages, ${message.author}! *If you did not receive the message, please enable your DMs.*`)
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
                );

                generated.set(message.author.id, Date.now() + cooldown * 1000); // Set cooldown expiration time

                // Set cooldown time
                setTimeout(() => {
                  generated.delete(message.author.id); // Remove the user from the cooldown set after expire
                }, cooldown * 1000);

                if (error) return log.error(error); // If an error occurred, log to console
              });
            } else {
              // If the service is empty
              return message.channel.send(
                new MessageEmbed()
                  .setColor(config.color.red)
                  .setTitle('Generator error!')
                  .setDescription(`The \`${args[0]}\` service is empty!`)
                  .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                  .setTimestamp()
              );
            }
          } else {
            // If the service does not exist
            return message.channel.send(
              new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Generator error!')
                .Description(`Service \`${args[0]}\` does not exist!`)
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                .setTimestamp()
            );
          }
        });
      }
    } else {
      // If the command executed in another channel
      message.channel.send(
        new MessageEmbed()
          .setColor(config.color.red)
          .setTitle('Wrong command usage!')
          .setDescription(`You cannot use the \`gen\` command in this channel! Try it in <#${config.pgenChannel}>!`)
          .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
          .setTimestamp()
      );
    }
  }
};

// helped by Blockween

//maked by Cracky !

// ## UPDATED --------------------
//██████╗░██╗░░░██╗
//██╔══██╗╚██╗░██╔╝
//██████╦╝░╚████╔╝░
//██╔══██╗░░╚██╔╝░░
//██████╦╝░░░██║░░░
//╚═════╝░░░░╚═╝░░░


//██╗░░░░░██╗░██████╗░█████╗░
//██║░░░░░██║██╔════╝██╔══██╗
//██║░░░░░██║╚█████╗░███████║
//██║░░░░░██║░╚═══██╗██╔══██║
//███████╗██║██████╔╝██║░░██║
//╚══════╝╚═╝╚═════╝░╚═╝░░╚═╝
