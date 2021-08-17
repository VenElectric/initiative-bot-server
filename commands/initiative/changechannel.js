const { v4: uuidv4 } = require('uuid');
const {db} = require('../../processes/firebasesetup')
const {warn_log,info_log} = require('../../logging/firebaselogging')


module.exports = {
	name: 'changechannel',
	description: 'Get the command to change the channel ID for initiative.',
	async execute(message,session_id,io) {
		let channel_id = message.channel.id
		console.log(session_id)
		

		db.collection('sessions').doc(session_id[0]).set({channel_id:channel_id},{merge:true}).then(()=>{
			message.reply('Your session has been moved to this channel.')
		})
		.catch((error) => {
			console.log("Error getting documents: ", error);
			message.reply('Please initiate the changeid command in the original channel where you session is first.')
		});
		
		
	},
}