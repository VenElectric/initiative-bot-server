const { DiceRoll} = require("rpg-dice-roller");
const Discord = require("discord.js");
const myredis = require("../../processes/redis-request");
const {db} = require('../../processes/firebasesetup')
const {logger} = require('../../logging/logger')
const init_funcs = require('../../processes/init_functions')
const initstore = require('../../processes/initstore')
const {warn_log,info_log} = require('../../logging/firebaselogging')
const demoj = ":octagonal_sign:";
const cemoj = ":bow_and_arrow:";
const bemoj = ":black_medium_square:";
const remoj = ":bangbang:";


function embed_set(embedarray) {
	let embed_fields = []
	let embed = new Discord.MessageEmbed();

		for (let x in embedarray){
			
			embed_fields.push({ name: `${embedarray[x].name}`, value: `${embedarray[x].cmark ? cemoj:bemoj}`, inline: false})
		}
		embed.setTitle('Initiative List')
		embed.addFields([...embed_fields])
	
	return embed;
}

module.exports = {
	name: "roundstart",
	description: "Load initiative and start rounds.",
	async execute(message,args,io) {
		let sessionid = message.channel.id;
        let init_start = [];
		const initRef = db.collection("sessions").doc(sessionid)
        const sortRef = await initRef.get()
		const snapshot = await db.collection("sessions").doc(sessionid).collection('initiative').get();
            snapshot.forEach(doc => {
                init_start.push({id: doc.id, ...doc.data()})
            })
		let is_sorted = sortRef.data().sorted;

		let init_list = init_funcs.sort_init(init_start,is_sorted)
		initstore.write_all(sessionid,init_list)
		let myembed = embed_set(init_list);

		message.channel.send("Rounds Have Started.");
		message.channel.send(myembed);
		io.to(sessionid).emit('client_roundstart',{ondeck:2,sort:true,initiative:init_list})
	},
};
