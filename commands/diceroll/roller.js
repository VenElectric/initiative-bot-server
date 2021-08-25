const {DiceRoll,DiceRoller} = require('rpg-dice-roller');
const chalk = require('chalk');
const Discord = require('discord.js');
const {logger} = require('../../logging/logger')
const {warn_log,info_log} = require('../../logging/firebaselogging')

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
	aliases: ['/r', 'r','r/','/R'],
	execute(message,args) {
		let session_id = message.channel.id
		try{
			let parsed = parse_args(args)
		
			let comment = parsed.comment.trim()
			let toroll = parsed.rollex
			let myroll = new DiceRoll(String(toroll))
			let finalroll = '```bash\n' + '"' + myroll + '"' + '```'
			let finalcomment = '```ini\n' + '[' + comment + `]` + '```'
			
			console.log(chalk.bgBlueBright(comment))
			if (comment != '')
			{
				info_log(session_id,'roller command success',{roll:JSON.stringify(finalroll),comment:finalcomment})
				message.reply('Roll Results: ' + finalroll + finalcomment);
			}
			else{
				info_log(session_id,'roller command success',{roll:JSON.stringify(myroll)})
				message.reply('Roll Results: ' + finalroll);
			}
		}
		catch(error){
			console.warn(error)
			// warn_log(messsage.channel.id,'roller command failed',{error:error,roll:myroll,comment:comment? comment:'no comment'})
			message.reply('There was an error with the dice roll. Please try again with the correct dice format.')
		}
		
		
	},
}