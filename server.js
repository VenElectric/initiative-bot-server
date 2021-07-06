const Discord = require('discord.js');
const express = require('express')
const {prefix,token} = require('./config.json');
const {firebaseConfig} = require('./processes/firebasesetup')
const firebase = require('firebase')
require('firebase/firestore')
const app = express();
const port = 8000;
const winston = require('winston');
const chalk = require('chalk');
const fs = require('fs');

firebase.initializeApp(firebaseConfig);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});


const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.name, command);
	}
}



client.once('ready', () => {
  logger.info('Ready')
	console.log('Ready!');
  console.log('Firebase Ready')
});

client.on('message', message => {
  const prefixes = ['!', '?'];
  const prefix = prefixes.find(p => message.content.startsWith(p));
  let regex = new RegExp(/^\d*([d|D])([0-9])+/)
	if (message.author.bot) return;

  let args;
  let roller;
  if (!prefix){
    args = message.content.trim().split(/ +/);
    logger.info('args !prefix' + args)
    roller = message.content.trim().split(/ +/);
  }
  else{
    args = message.content.slice(prefix.length).trim().split(/ +/);
    logger.info('args else ' + args)
  }
	
  
	const commandName = args.shift().toLowerCase();

const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

// if (!command && !commandName.match(regex)) {
//   return
// };
  
try {
    if (commandName.match(regex)){
      console.log("regex")
      logger.info(roller + ' if commandname ' + ' command ' + command)
      client.commands.get('roller').execute(message,roller);
    }
    if (command){
      logger.info(command + ' if command')
      command.execute(message, args);
    }
    else {
      try{
        logger.info(args + ' else ' + message.content)
        console.log("else")
        // client.commands.get('roller').execute(message, message.content);
      }
      catch(error){
        logger.info(error + ' error ' + message.content)
        return
      }
    }
  } catch (error) {
    console.error(error);
    logger.debug(error)
    logger.debug(commandName)
    logger.debug(message)
    message.reply('there was an error trying to execute that command!');
  }
})

client.login(token);

app.get('/', (req, res) => {
    client.channels.fetch('723744588346556419').then(channel=> channel.send('Test'))
    
  res.send('Hello World!')
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});

