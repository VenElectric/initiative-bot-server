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
const init_p = require('./processes/initstore')
const cemoj = ":bow_and_arrow:";
const bemoj = ":black_medium_square:";

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
      client.commands.get('roller').execute(message,roller,io);
    }
    // use command if matched
    if (command){
      logger.info(command + ' if command')
      command.execute(message, args,io);
    }
    else {
      // if no prefix, no regex match, or no command match, try the roller (I.E. for things like 1+2+3+4, for ease of use)
      try{
        logger.info(args + ' else ' + message.content)
        console.log("else")
        client.commands.get('roller').execute(message, message.content,io);
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
    logger.info(room,'create room')
    console.log(typeof(room),'create room')
    // myredis.initialize_redis(room) this needs to be moved above
  });

  socket.on('round_start',function(data){
    let room = data.room
    myredis.initialize_redis(room,key)

    socket.broadcast.to(room).emit('client_roundstart',{sorted:true,ondeck:2,initiative:data.initiative})
  })
  socket.on('get_all_init',function(data){
    let room = data.room
    let init_data = myredis.get_all_init(room)
    console.log(init_data)
  })

  socket.on('server_show_spell',async function(data){
    let session_id = data.room
    let spell_list = await init_p.get_all(String(session_id),'spells')
		
		let embed_fields = []

		let spellembed = new Discord.MessageEmbed();
		for (let x in spell_list){
			console.log(spell_list[x])
			embed_fields.push({ name: `${spell_list[x].name}`, value: `Effect: ${spell_list[x].effect}`, inline: false})
		}
		spellembed.setTitle('Spell List')
		spellembed.addFields([...embed_fields])

    logger.info(spellembed)
		
		client.channels.fetch(session_id).then(channel=> channel.send(spellembed))
  })

  socket.on('server_show_init',async function(data){
    let session_id = data.room
    let embedarray = await init_p.get_all(String(session_id),'initiative')
		
    let embed_fields = []
    let embed = new Discord.MessageEmbed();
  
      for (let x in embedarray){
        
        embed_fields.push({ name: `${embedarray[x].name}`, value: `${embedarray[x].cmark ? cemoj:bemoj}`, inline: false})
      }
      embed.setTitle('Initiative List')
      embed.addFields([...embed_fields])

    logger.info(embed)
		
		client.channels.fetch(session_id).then(channel=> channel.send(embed))
  })

  socket.on('server_init', function(data){
    
    let room = data.room
    let initiative = data.initiative
    let sort = data.sort
    let ondeck = data.ondeck
    logger.info(room)
    logger.info(data.initiative)
    myredis.update_init(room,{data:{ondeck:ondeck,sort:sort},initiative:initiative})
    socket.broadcast.to(room).emit('client_init',{sort:sort,initiative:initiative});
  })
  
  socket.on('server_add_init',function(data){
    let room = data.room
    let add_init_ = data.initiative
    let sort = data.sort
    myredis.add_new_init(room,data.initiative.id,add_init_)
    let init_data = myredis.get_all_init(room)
    console.log(init_data)
    init_p.add_init(room,add_init_)
    logger.info(room)
    logger.info(room)
    logger.info(data.initiative)
    socket.broadcast.to(room).emit('client_add_init',{sort:sort,initiative:add_init_});
  })

  socket.on('server_update_init',function(data){
    let room = data.room
    let _init_line = data.initiative
    let index = data.index
    let init_id = data.id
    let sort = data.sort
    myredis.update_init(init_id,_init_line[index])
    logger.info(room)
    logger.info(data.initiative)
    socket.broadcast.to(room).emit('client_update_init',{sort:sort,initiative:_init_line});
  })

  socket.on('server_remove_init',function(data){
    console.log(data.room,'room')
    let room = data.room
    let id = data.id
    myredis.remove_redinit(room,id)
    init_p.delete_init(room,id)
    logger.info(room)
    logger.info(data)
    console.log(typeof(room))
    socket.broadcast.to(room).emit('client_remove_init',{room:room,id:id})
  })

  socket.on('server_add_spell',function(data){
    let room = data.room
    console.log(room,'roomie')
    let new_spell = data.spell 
    console.log(new_spell,'adding spell')
    myredis.add_new_spell(room,new_spell)
    init_p.add_spell(room,new_spell)
    
    socket.broadcast.to(room).emit('add_spell',{room:room,spell:new_spell})
    logger.info(room)
    logger.info(new_spell)
    
  })

  socket.on('server_update_spell',function(data){
    let room = data.room
    let update_spell = data.spell 
    myredis.update_spell(room,update_spell)
    init_p.update_spell(room,update_spell)
    logger.info(room)
    logger.info(update_spell)
    socket.broadcast.to(room).emit('client_update_spell',{room:room,spell:update_spell});
  })

  socket.on('server_del_spell',function(data){
    let room = data.room
    let id = data.spell.id
    init_p.delete_spell(room,id)
    myredis.delete_spell(room,id)
    logger.info(room)
    logger.info(data.spell)
    socket.broadcast.to(room).emit('client_del_spell',{spell:data.spell});
  })

  socket.on('server_update_target',function(data){
   
    let room = data.room
    let target = data.target
    logger.info(room)
    logger.info(target)
    socket.broadcast.to(room).emit('client_update_target',{room:room,target:data.target,main:data.main,id:data.id});
  })

  socket.on('server_next',function(data){
    let session_id = data.room
    let next_turn = data.next
    client.channels.fetch(session_id).then(channel=> channel.send("Current Turn: " + next_turn))
  })
  socket.on('server_prev',function(data){
    let session_id = data.room
    let next_turn = data.prev
    client.channels.fetch(session_id).then(channel=> channel.send("Current Turn: " + next_turn))
  })

});

app.get('/dungeon-bot/api/init_list',async (req,res) => {
  let session_id = req.query.session_id
  console.log(session_id)
  let init_list = await init_p.get_all(session_id,'initiative')

  // client.channels.fetch(req.params.channelID).then(channel=> channel.send('Test'))
  res.status(200).send(init_list)
})

app.get('/dungeon-bot/api/spell_list',async (req,res) => {
  let session_id = req.query.session_id
  console.log(session_id)
  let init_list = await init_p.get_all(session_id,'spells')

  // client.channels.fetch(req.params.channelID).then(channel=> channel.send('Test'))
  res.status(200).send(init_list)
})


app.get('/dungeon-bot/api/roundstart',async (req,res) => {
  let session_id = req.query.session_id
  console.log(session_id)
   let init_data = await init_p.get_all(session_id,'initiative')
   console.log(init_data)
  let sorted_list = sort_init(init_data,false)
  init_p.write_all(session_id,sorted_list)
    
    myredis.update_init(session_id,{data:{ondeck:2,sorted:true},initiative:sorted_list})
    client.channels.fetch(session_id).then(channel=> channel.send('Rounds have started'))
    res.status(200).send(sorted_list)
  

})


server.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});

