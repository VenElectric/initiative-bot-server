const chalk = require('chalk');

module.exports = {
	name: 'testcomms',
	description: 'a test command',
	execute(message) {
		message.channel.send(chalk.green(`Spellz`));
	},
}