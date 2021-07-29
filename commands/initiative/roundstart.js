const { DiceRoll} = require("rpg-dice-roller");
const Discord = require("discord.js");
const myredis = require("../../processes/redis-request");
const {db} = require('../../processes/firebasesetup')
const logger = require('../../logging/logger')

const demoj = ":octagonal_sign:";
const cemoj = ":bow_and_arrow:";
const bemoj = ":black_medium_square:";
const remoj = ":bangbang:";

function rolld20(num) {
	let arrd20 = [];
	for (z = 0; z < num; z++) {
		let myroll = new DiceRoll("d20");
		arrd20.push(myroll.total);
	}
	let uniqueroll = [...new Set(arrd20)];
	return uniqueroll;
}

function embed_set(embedarray) {
	let name = "";
	let current = "";
	let delay = "";
	let ready = "";
	let count = 0;
	let embed = new Discord.MessageEmbed();
	try {
		for (e = 0; e < embedarray.length; e++) {
			if (count < embedarray.length - 1) {
				name += embedarray[e].Name + "\n";
				current += embedarray[e].cmark ? cemoj + "\n" : bemoj + "\n";
				count += 1;
			} else {
				name += embedarray[e].Name;
				current += embedarray[e].cmark ? cemoj : bemoj;
				count += 1;
			}
		}
		embed.addFields(
			{ name: "Name", value: name, inline: true },
			{ name: "Current", value: current, inline: true },
		);
	} catch (error) {
		console.log(error);
	}
	return embed;
}

module.exports = {
	name: "roundstart",
	description: "Load initiative and start rounds.",
	async execute(message) {
		let sessionid = message.channel.id;
        let init_list = [];
		const initRef = db.collection("sessions").doc(sessionid)
        const sortRef = await initRef.get()
		const snapshot = await db.collection("sessions").doc(sessionid).collection('initiative').get();
            snapshot.forEach(doc => {
                init_list.push({id: doc.id, ...doc.data()})
            })
		let is_sorted = sortRef.data().sorted;

		if (!is_sorted) {
			let dupes = [];
			for (i = 0; i < init_list.length; i++) {
				for (x in init_list) {
					if (init_list[x] != init_list[i].id) {
						if (
							init_list[x].initiative === init_list[i].initiative &&
							init_list[x].init_mod === init_list[i].init_mod
						) {
							console.log("Dupe Added");
							dupes.push(init_list[i]);
							break;
						} else {
							continue;
						}
					}
					if (record.id == init_list[i].id) {
						continue;
					}
				}
			}
			try {
				if (dupes.length == 0) {
					console.log("Ok!");
				} else {
					let rolls = [];
					let mylen = 0;
					while (mylen < dupes.length) {
						rolls = rolld20(dupes.length);
						mylen = rolls.length;
					}
					console.log(rolls);
					for (z in dupes) {
						for (y = 0; y < init_list.length; y++) {
							if (dupes[z].id === init_list[y].id) {
								let resultdec = Number(rolls[y] / 100);
								let newnum = Number(init_list[y].init_mod);
								let total = Number(newnum + resultdec);
								init_list[y].init_mod = total;
								newnum = 0;
								resultdec = 0;
								total = 0;
							}
						}
					}
				}
			} catch (error) {
				console.log(error);
			}
			init_list.sort(function (a, b) {
				if (a.init > b.init) return -1;
				if (a.init < b.init) return 1;
				if (a.init_mod > b.init_mod) return -1;
				if (a.init_mod < b.init_mod) return 1;
			});

			for (v = 0; v < init_list.length; v++) {
				init_list[v].line_num = Number(v + 1);
			}

			init_list[0].cmark = true;
            myredis.set_data(sessionid,{sorted:true,on_deck:2,session_init:init_list})
			initRef
					.set({ on_deck: 2, sorted: true }, { merge: true })
					.then(() => {
						console.log("success");
					})
					.catch((error) => {
						console.log(error);
					});
				for (x in init_list) {
					var myref = db
						.collection("sessions")
						.doc(sessionid)
						.collection("initiative")
						.doc(init_list[x].id);
					myref
						.set({line_num:init_list[x].line_num,cmark:init_list[x].cmark}, { merge: true })
						.then(() => {
							console.log("success");
						})
						.catch((error) => {
							console.log(error);
						});
				}
		} else {
			init_list.sort(function (a, b) {
				if (a.line_num > b.line_num) return -1;
				if (a.line_num < b.line_num) return 1;
			});
		}
		const myembed = embed_set(init_list);
		message.channel.send("Rounds Have Started.");
		message.channel.send(myembed);
	},
};
