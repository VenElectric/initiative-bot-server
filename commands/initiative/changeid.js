const { v4: uuidv4 } = require('uuid');
const {db} = require('../../processes/firebasesetup')
const {warn_log,info_log} = require('../../logging/firebaselogging')


module.exports = {
	name: 'changeid',
	description: 'Get the command to change the channel ID for initiative.',
	async execute(message) {
		let channel_id = message.channel.id
		let session_id
		

		db.collection('sessions').where("channel_id", "==", channel_id).get().then((querySnapshot) => {
			console.log(querySnapshot.empty)
			if (!querySnapshot.empty){
				session_id = querySnapshot.docs[0].id
				message.reply('Use the following command in the channel you want to change your session to.')
				message.channel.send(`changechannel ${session_id}`)
				
			}
			if (querySnapshot.empty){
				message.reply('No session has been started on this channel.')
			}

			
			
		})
		.catch((error) => {
			console.log("Error getting documents: ", error);
		});
		
		
	},
}