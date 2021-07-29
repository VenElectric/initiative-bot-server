const {DiceRoll,DiceRoller} = require('rpg-dice-roller');
const chalk = require('chalk');
const Discord = require('discord.js');


function parse_args(msg){
	let reg = /^\d*([d|D])([0-9])+/
	let comment = ''
	let rollex = ''
	let length = msg.length;
	let prevtype = false 
	for (i = 0; i < length; i++){
		console.log(chalk.bgBlue(msg[i]))
		if (String(msg[i]).match(/^\d*([d|D])([0-9])+/) && prevtype == false){
			rollex += msg[i]
			continue
		}
		if (String(msg[i]).match(/[(]|[)]|[+|/|*|-]/)  && prevtype == false)
		{
			rollex += msg[i]
			continue
		}
		if (msg[i].match(/[1-9]+/)  && prevtype == false){
			rollex += msg[i]
			continue
		}
		if(typeof(msg[i]) == 'string' || prevtype == true){
			prevtype = true;
			comment += msg[i] + ' '
		}
		}
	return {comment:comment,rollex:rollex}
}

module.exports = {
	name: 'roller',
	description: 'Roll the dice!',
	aliases: ['/r', 'r','r/'],
	execute(message,args) {
		console.log(args)
		let parsed = parse_args(args)
		console.log(parsed)
		let comment = parsed.comment.trim()
		let toroll = parsed.rollex
			let myroll = new DiceRoll(toroll)
		let finalroll = '```bash\n' + '"' + myroll + '"' + '```'
		let finalcomment = '```ini\n' + '[' + comment + `]` + '```'
		console.log(chalk.bgBlueBright(message.channel.id))
		if (comment != '')
		{
			message.reply('Roll Results: ' + finalroll + finalcomment);
		}
		else{
			message.reply('Roll Results: ' + finalroll);
		}
		
	},
}