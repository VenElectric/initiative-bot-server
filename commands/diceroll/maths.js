const {DiceRoll,DiceRoller} = require('rpg-dice-roller');
const {evaluate} = require('mathjs')

module.exports = {
	name: 'maths',
	description: 'Do maths!',
	execute(message,args) {
		let myroll = evaluate(args)
		message.channel.send(myroll);
	},
}