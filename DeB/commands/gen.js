// import
const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');
const CatLoggr = require('cat-loggr');

const usernameSymbols = ["/", ":", "|", "~", "="]; // Define username symbols array
const autoAccountServices = ['http_proxy', 'socks4_proxy', 'socks5_proxy', 'battlenet', 'chess', 'crunchyroll', 'directv', 'disney', 'facebook', 'mega', 'nitro', 'protonvpn', 'reddit', 'spotify', 'twitter', 'tiktok'];

const log = new CatLoggr();
const generated = new Set();


// gen setup
module.exports = {
    name: 'gen',
    description: 'Generate a specified service if in stock.',
    execute(message, args) {
        try {
            message.client.channels.cache.get(config.genChannel).id;
        } catch (error) {
            if (error) log.error(error);
            if (config.command.error_message === true) {
                return message.channel.send(
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Error occurred!')
                        .setDescription('Please use the channel dedicated to account generating!')
                        .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                );
            } else return;
        }

        if (message.channel.id === config.genChannel) {
            if (generated.has(message.author.id)) {
                return message.channel.send(
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Cooldown!')
                        .setDescription(`Please wait **${config.genCooldownsec}** seconds before generating an account!`)
                        .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                        .setTimestamp()
                );
            } else {
                const service = args[0];
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

                const filePath = `${__dirname}/../stock/${args[0]}.txt`;

                fs.readFile(filePath, function (error, data) {
                    if (!error) {
                        data = data.toString();
                        const lines = data.split('\n');

                        if (lines.length === 0) {
                            return message.channel.send(
                                new MessageEmbed()
                                    .setColor(config.color.red)
                                    .setTitle('Generator error!')
                                    .setDescription(`The \`${args[0]}\` service is empty!`)
                                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                                    .setTimestamp()
                            );
                        }

                        const accountInfo = lines[0];
                        const lastColonIndex = accountInfo.lastIndexOf(':');

                        if (autoAccountServices.includes(service) || lastColonIndex === -1) {
                            message.author.send(
                                new MessageEmbed()
                                    .setColor(config.color.green)
                                    .setTitle('Generated account')
                                    .addField('Account', `\`\`\`${accountInfo}\`\`\``)
                                    .setTimestamp()
                            );

                            message.channel.send(
                                new MessageEmbed()
                                    .setColor(config.color.green)
                                    .setTitle('Account generated successfully!')
                                    .setDescription(`Check your DMs ${message.author}! *If you didn't receive the message, please unlock your DMs!*`)

.setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                              .setTimestamp()
                            );

                            lines.shift();
                            const updatedData = lines.join('\n');
                            fs.writeFile(filePath, updatedData, function (error) {
                                if (error) {
                                    log.error(error);
                                }
                            });

                            generated.add(message.author.id);
                            let cooldownTime = config.genCooldown;
                            if (message.member.roles.cache.has('1168441360815230986')) {
                                cooldownTime -= 5000; // subtract 5 seconds from cooldown if user has specific role
                            }
                            setTimeout(() => {
                                generated.delete(message.author.id);
                            }, cooldownTime);
                        } else {
                            const usernamePart = accountInfo.slice(0, lastColonIndex);
                            const password = accountInfo.slice(lastColonIndex + 1);
                            let username = usernamePart;

                            for (const symbol of usernameSymbols) {
                                if (usernamePart.startsWith(symbol)) {
                                    username = usernamePart.slice(1); // Remove the symbol
                                    break;
                                }
                            }

                            let steamProfileLink = ''; // Steam Profile Link

                            if (service === 'steam') {
                                steamProfileLink = `https://steamcommunity.com/profiles/${username}`;
                            }

                            message.author.send(
                                new MessageEmbed()
                                    .setColor(config.color.green)
                                    .setTitle('Generated account')
                                    .addField('Username', `\`\`\`${username}\`\`\``, true)
                                    .addField('Password', `\`\`\`${password}\`\`\``, true)
                                    .setTimestamp()
                            );
                          message.author.send(`${username}`);
                          message.author.send(`${password}`);

                            if (service === 'steam') {
                                message.author.send(`Here's the account profile: ${steamProfileLink}`);
                            }

                            if (service === 'roblox') {
                                const robloxProfileLink = `https://www.roblox.com/users/profile?username=${username}`;
                                message.author.send(`Here's the account profile: ${robloxProfileLink}`)
                                    .catch(() => message.author.send("Profile link not found."));
                            }

                            message.channel.send(
                                new MessageEmbed()
                                    .setColor(`#2242b2`)
                                    .setTitle('Account generated successfully!')
                                    .setDescription(`Check your DMs ${message.author}! *If you didn't receive the message, please unlock your DMs!*`)
                                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                                    .setTimestamp()
                            );

                            lines.shift();
                            const updatedData = lines.join('\n');
                            fs.writeFile(filePath, updatedData, function (error) {
                                if (error) log.error(error);
                            });

                            generated.add(message.author.id);
                            let cooldownTime = config.genCooldown;
                            if (message.member.roles.cache.has('1168441360815230986')) {
                                cooldownTime -= 5000; // subtract 5 seconds from cooldown if user has specific role
                            }
                            setTimeout(() => {
                                generated.delete(message.author.id);
                            }, cooldownTime);
                        }
                    } else {
                        return message.channel.send(new MessageEmbed().setColor(config.color.red).setTitle('Generator error!').setDescription(`Service \`${args[0]}\` does not exist!`).setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 })).setTimestamp());
                    }
                });
            }
        } else {
            message.channel.send(new MessageEmbed().setColor(config.color.red).setTitle('Wrong command usage!').setDescription(`You cannot use the \`gen\` command in this channel! Try it in <#${config.genChannel}>!`).setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 })).setTimestamp());
        }
    }
};