const { v4: uuidv4 } = require('uuid');
const {db} = require('../../processes/firebasesetup')
const {warn_log,info_log} = require('../../logging/firebaselogging')


module.exports = {
	name: 'getlink',
	description: 'Get link for game session',
	async execute(message) {
		let channel_id = message.channel.id
		let session_id
		

		db.collection('sessions').where("channel_id", "==", channel_id).get().then((querySnapshot) => {
			console.log(querySnapshot.empty)
			if (!querySnapshot.empty){
				session_id = querySnapshot.docs[0].id
				
			}
			if (querySnapshot.empty){
				session_id = uuidv4()
				db.collection('sessions').doc(session_id).set({channel_id:channel_id,ondeck:0,sorted:false}).then(()=> {
					console.log('success')
				}).catch((error)=> {
					console.log(error)
				})
				
			}

			let urlfin = 'https://dungeon-bot.app/?session_id=' + session_id
			message.channel.send(urlfin);
		})
		.catch((error) => {
			console.log("Error getting documents: ", error);
		});
		
		
	},
}