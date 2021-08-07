const Discord = require('discord.js');
const express = require('express')
// const {token} = require('./config.json');
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
const process = require('process');

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
    logger.info('No Prefix, so roller is being used: ' + message.content + ' Here are the args: ' + args)
    roller = message.content.trim().split(/ +/);
  }
  else{
    args = message.content.slice(prefix.length).trim().split(/ +/);
    logger.info('Else there is a prefix: ' + args)
  }
	
  
	const commandName = args.shift().toLowerCase();

const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
  
try {
  // Roll dice if regex is matched 
    if (commandName.match(regex)){
      console.log("regex")
      logger.info(roller + ' regex matched for roller')
      client.commands.get('roller').execute(message,roller,io);
    }
    // use command if matched
    if (command){
      logger.info(commandName + ' command name matched')
      command.execute(message, args,io);
    }
    else {
      // if no prefix, no regex match, or no command match, try the roller (I.E. for things like 1+2+3+4, for ease of use)
      try{
        logger.info('Trying roller for: ' + args + '/with message content:' + message.content)
        console.log("else")
        client.commands.get('roller').execute(message, message.content,io);
      }
      // if just a normal message or error, return. 
      catch(error){
        logger.info(error + ' error with message content: ' + message.content)
        return
      }
    }

    // error with roller command
  } catch (error) {
    logger.warn(error)
    logger.warn(commandName)
    logger.warn(message.content)
    message.reply('there was an error trying to execute that command!');
  }
})

client.login(process.env.discordtoken);



io.on('connection', socket => {
  
  socket.on('create',function (room) {
    socket.join(room);
    logger.info(room,'create room')
  });

  socket.on('round_start',function(data){
    let room = data.room
    myredis.initialize_redis(room,key)
    logger.info('Round Start',room)
    socket.broadcast.to(room).emit('client_roundstart',{sorted:true,ondeck:2,initiative:data.initiative})
  })
  socket.on('get_all_init',function(data){
    let room = data.room
    let init_data = myredis.get_all_init(room)
    logger.info(init_data)
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
    logger.info(room,'server add init')
    logger.info(data.initiative,'server add init')
    socket.broadcast.to(room).emit('client_add_init',{sort:sort,initiative:add_init_});
  })

  socket.on('server_update_init',function(data){
    let room = data.room
    let _init_line = data.initiative
    let index = data.index
    let init_id = data.id
    let sort = data.sort
    let ondeck = data.on_deck
    myredis.update_init(init_id,_init_line[index])
    init_p.write_all(room,_init_line,sort,ondeck)
    logger.info(room,'server_update_init')
    logger.info(data.initiative,'server_update_init')
    socket.broadcast.to(room).emit('client_update_init',{sort:sort,initiative:_init_line});
  })

  socket.on('server_remove_init',function(data){
    console.log(data.room,'room')
    let room = data.room
    let id = data.id
    myredis.remove_redinit(room,id)
    init_p.delete_init(room,id)
    logger.info(room,'server_remove_init')
    logger.info(data,'server_remove_init')
    socket.broadcast.to(room).emit('client_remove_init',{room:room,id:id})
  })

  socket.on('server_add_spell',function(data){
    let room = data.room
    let new_spell = data.spell 

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
    logger.info(room,'server_update_spell')
    logger.info(update_spell,'server_update_spell')
    socket.broadcast.to(room).emit('client_update_spell',{room:room,spell:update_spell});
  })

  socket.on('server_del_spell',function(data){
    let room = data.room
    let id = data.spell.id
    init_p.delete_spell(room,id)
    myredis.delete_spell(room,id)
    logger.info(room,'server_del_spell')
    logger.info(data.spell,'server_del_spell')
    socket.broadcast.to(room).emit('client_del_spell',{spell:data.spell});
  })

  socket.on('server_update_target',function(data){
   
    let room = data.room
    let target = data.target
    logger.info(room,'server_update_target')
    logger.info(target,'server_update_target')
    socket.broadcast.to(room).emit('client_update_target',{room:room,target:data.target,main:data.main,id:data.id});
  })

  socket.on('server_next',function(data){
    let session_id = data.room
    let next_turn = data.next
    logger.info(next_turn,'server_next')
    client.channels.fetch(session_id).then(channel=> channel.send("Current Turn: " + next_turn))
  })
  socket.on('server_prev',function(data){
    let session_id = data.room
    let next_turn = data.prev
    logger.info(next_turn,'server_prev')
    client.channels.fetch(session_id).then(channel=> channel.send("Current Turn: " + next_turn))
  })

  socket.on('error_reporting',function(data){
    let session_id = data.room
    let error_name = data.error_name
    let error_msg = data.error_msg
    let tracer = data.tracer
    logger.warn(`SessionID: ${session_id} Error: ${error_name} At: ${tracer} Message: ${error_msg}`)
  })

  socket.on('logger_info',function(data){
    let session_id = data.room
    let data_msg = data.data_msg
    let tracer = data.tracer
    logger.info(`SessionID: ${session_id} Message: ${data_msg} At: ${tracer}`)
  })

});

app.get('/dungeon-bot/api/init_list',async (req,res) => {
  let session_id = req.query.session_id
  logger.info(session_id)
  let init_list = await init_p.get_all(session_id,'initiative')
  let initial = await init_p.get_initial(session_id)
  res.status(200).send(JSON.stringify({init_list:init_list,initial:initial}))
})

app.get('/dungeon-bot/api/spell_list',async (req,res) => {
  let session_id = req.query.session_id
  logger.info(session_id)
  let init_list = await init_p.get_all(session_id,'spells')
  res.status(200).send(init_list)
})


app.get('/dungeon-bot/api/roundstart',async (req,res) => {
  let session_id = req.query.session_id
  let init_data = await init_p.get_all(session_id,'initiative')
  let sorted_list = sort_init(init_data,false)
  init_p.write_all(session_id,sorted_list)

  logger.info(session_id,'roundstart api')
  logger.info(init_data,'roundstart api')
    
  myredis.update_init(session_id,{data:{ondeck:2,sorted:true},initiative:sorted_list})
  client.channels.fetch(session_id).then(channel=> channel.send('Rounds have started'))
  res.status(200).send(sorted_list)
  

})


server.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});

