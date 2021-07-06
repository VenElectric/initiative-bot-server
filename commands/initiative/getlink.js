module.exports = {
	name: 'getlink',
	description: 'Get link for game session',
	execute(message) {
		var sessionid = message.channel.id
		var urlfin = 'https://initbot-test.firebaseapp.com/?session_id=' + sessionid
		message.channel.send(urlfin);
	},
}