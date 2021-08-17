const init_funcs = require('../../processes/initstore')
const Discord = require("discord.js");
const {logger} = require('../../logging/logger')
const {warn_log,info_log} = require('../../logging/firebaselogging')

module.exports = {
    name: 'spells',
	description: 'Current list of spells/buffs.',
	async execute(message) {
		let sessionid = message.channel.id;
		console.log(sessionid)
		let spell_list = await init_funcs.get_all(String(sessionid),'spells')
		console.log(spell_list)
		let embed_fields = []

		let spellembed = new Discord.MessageEmbed();
		for (let x in spell_list){
			console.log(spell_list[x])
			embed_fields.push({ name: `${spell_list[x].name}`, value: `Effect: ${spell_list[x].effect}`, inline: false})
		}
		spellembed.setTitle('Spell List')
		spellembed.addFields([...embed_fields])

		console.log(spellembed)
		
		message.channel.send(spellembed);
	},
}