const Discord = require('discord.js');
const express = require('express')
const {token} = require('./config.json');
const myredis = require('./processes/redis-request')
const {sort_init} = require('./processes/init_functions')
const http = require('http')
require('firebase/firestore')
const app = express();
const server = http.createServer(app);
const port = 8000;
const {logger} = require('./logging/logger')
const {add_init,write_all,get_all} = require('./processes/initstore')


const io = require("socket.io")(server, { cors: {
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
}})


const fs = require('fs');


const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFolders = fs.readdirSync('./commands');

app.use(require('cors')({
  origin: 'http://localhost:3000',
  methods: ['GET','POST']
}));

app.use(express.json())

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
  myredis.initialize_redis('12345678')
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
  // Roll dice if regex is matched 
    if (commandName.match(regex)){
      console.log("regex")
      logger.info(roller + ' if commandname ' + ' command ' + command)
      client.commands.get('roller').execute(message,roller);
    }
    // use command if matched
    if (command){
      logger.info(command + ' if command')
      command.execute(message, args);
    }
    else {
      // if no prefix, no regex match, or no command match, try the roller (I.E. for things like 1+2+3+4, for ease of use)
      try{
        logger.info(args + ' else ' + message.content)
        console.log("else")
        client.commands.get('roller').execute(message, message.content);
      }
      // if just a normal message or error, return. 
      catch(error){
        console.log(error + 'try catch')
        logger.info(error + ' error ' + message.content)
        return
      }
    }

    // error with roller command
  } catch (error) {
    logger.debug(error)
    logger.debug(commandName)
    logger.debug(message)
    message.reply('there was an error trying to execute that command!');
  }
})

client.login(token);



io.on('connection', socket => {
  
  socket.on('create',function (room) {
    socket.join(room);
    console.log(room,'room joined')
  });

  socket.on('server_init', function(data){
    console.log('this is the io')
    let room = data.room
    let initiative = data.initiative
    let sort = data.sort
    socket.to(room).emit('client_init',{sort:sort,initiative:initiative});
  })
});

app.get('/', (req, res) => {
    // client.channels.fetch('723744588346556419').then(channel=> channel.send('Test'))
    const {body} = document

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.height = 100
    
    const tempImg = document.createElement('img')
    tempImg.addEventListener('load', onTempImageLoad)
    tempImg.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>em{color:red;}</style><em>I</em> lick <span>cheese</span></div></foreignObject></svg>')
    
    const targetImg = document.createElement('img')
    body.appendChild(targetImg)
    
    function onTempImageLoad(e){
      ctx.drawImage(e.target, 0, 0)
      targetImg.src = canvas.toDataURL()
    }
  res.send('Hello World!')
});

app.post('/dungeon-bot/api/next',async (req,res) => {
  let session_id = req.params.session_id
  let init_list = await myredis.get_init(session_id)
  client.channels.fetch(req.params.channelID).then(channel=> channel.send('Test'))
})

app.post('/dungeon-bot/api/:channelID/spells',(req,res) => {
  client.channels.fetch(req.params.channelID).then(channel=> channel.send('Test'))
})

app.post('/dungeon-bot/api/update',async (req,res) => {
  let session_id = req.params.session_id
  let new_init = JSON.parse(req.body.data.body_data)
  write_all(new_init,session_id)
  res.status(200).send("Ok!")
  // client.channels.fetch(req.params.channelID).then(channel=> channel.send('Test'))
})

app.get('/dungeon-bot/api/init_list',async (req,res) => {
  let session_id = req.query.session_id
  console.log(session_id)
  let init_list = await get_all(session_id)

  console.log(typeof(init_list))
  // client.channels.fetch(req.params.channelID).then(channel=> channel.send('Test'))
  res.status(200).send(init_list)
})

app.post('/dungeon-bot/api/add_init',async (req,res) => {
  console.log(req.query.session_id)
  console.log(req.body)
  let session_id = req.query.session_id
  let new_init = JSON.parse(req.body.data.body_data)
  console.log(new_init)
  add_init(session_id,new_init)
  myredis.add_new_init(session_id,new_init.id,new_init).then((response) =>{
    let status_ = response
    res.status(200).send(status_)
    
  })

})

app.get('/dungeon-bot/api/roundstart',async (req,res) => {
  let session_id = req.query.session_id
   let init_data = await get_all(session_id)
   console.log(init_data)
  let sorted_list = sort_init(init_data,false)
    write_all(session_id,sorted_list)
    myredis.update_init(session_id,{data:{ondeck:2,sorted:true},initiative:sorted_list})
    res.status(200).send(sorted_list)
  
    // myredis.get_init(session_id).then(function(data) {
    //   console.trace(data)
    //   console.log('data is undefined?')
    //   let sorted_list = sort_init(data,false)
    //   res.status(200).send(sorted_list)
    // }).catch(error => {
    //   console.log(error)
    // })
  
  // client.channels.fetch(session_id).then(channel=> channel.send('Test'))
})

app.post('/dungeon-bot/api/:channelID/roll',(req,res) => {
  client.channels.fetch(req.params.channelID).then(channel=> channel.send('Test'))
})

app.post('/dungeon-bot/api/:channelID/status_effects',(req,res) => {
  client.channels.fetch(req.params.channelID).then(channel=> channel.send('Test'))
})

server.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});

