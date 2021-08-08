const { v4: uuidv4 } = require('uuid');
const {db} = require('../../processes/firebasesetup')



module.exports = {
	name: 'getlink',
	description: 'Get link for game session',
	async execute(message) {
		let sessionid = message.channel.id
		
		let urlfin = 'https://dungeon-bot.app/?session_id=' + sessionid
		message.channel.send(urlfin);
	},
}