const {DiceRoll,DiceRoller} = require('rpg-dice-roller');
const {evaluate} = require('mathjs')
const {logger} = require('../../logging/logger')

module.exports = {
	name: 'maths',
	description: 'Do maths!',
	execute(message,args) {
		let myroll = evaluate(args)
		message.channel.send(myroll);
	},
}