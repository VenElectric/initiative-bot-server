const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const {db} = require('../../processes/firebasesetup')
const logger = require('../../logging/logger')

function parse_name(args){
    let name = ''
    let length = args.length;
	for (i = 0; i < length; i++){
       
        if (args[i].match(/[1-9]+/)){
            console.log('number')
        }
        else{
            name += args[i] + ' '
            console.log(name)
        }
    }
    return name;
}

function getRandomColor(){
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

module.exports = {
    name:'add_pc',
    description:'Add in your initiative manually.',
    async execute(message,args,io){
        const initRef = db.collection('sessions')
        var sessionid = message.channel.id;

        console.log(args[0])
        let new_args = args[0].split(',')

        let pcid = uuidv4()
        
        var options = {
            id: pcid,
            name:new_args[0],
            init:Number(new_args[1]),
            init_mod:Number(new_args[2]),
            line_order:0,
            cmark:false,
            status_effects:[],
            npc:false,
            color:getRandomColor()
        }
        io.to(sessionid).emit('client_add_init',{sort:false,initiative:options})
        initRef.doc(sessionid).collection('initiative').doc(pcid)
        .set(options)
        .then(async ()=>{
            var sorted = await initRef.doc(sessionid).get()
            if (sorted){
                initRef.doc(sessionid).set({sorted:false},{merge:true}).then(()=>{
                    console.log(chalk.bgBlue('Initiative Added Success'))
                    message.channel.send('Init Added. Please use the sort command to sort initiative.')
                })
                .catch((error) => {
                    console.log(chalk.bgRed('Error adding in initiative.' + error))
                    message.channel.send(error)
                })
            }
            else{
                console.log(chalk.bgBlue('Initiative Added Success'))
                message.channel.send('Init Added')
            }
        }).catch((error) => {
            console.log(chalk.bgRed('Error adding in initiative.' + error))
            message.channel.send(error)
        })
    },
    
};