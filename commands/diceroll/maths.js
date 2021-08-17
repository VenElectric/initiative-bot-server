const {evaluate} = require('mathjs')

// slated for legacy
module.exports = {
	name: 'maths',
	description: 'Do maths!',
	execute(message,args) {
		let myroll = evaluate(args)
		message.channel.send(`Answer: ${myroll}`);
	},
}