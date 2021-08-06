const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const {logger} = require('../../logging/logger')
const {db} = require('../../processes/firebasesetup')
const init_funcs = require('../../processes/init_functions')
const initRef = db.collection('sessions')

module.exports = {
    name:'add_pc',
    description:'Add in your initiative manually.',
    async execute(message,args,io){
        
        let sessionid = message.channel.id;

        let new_args = args[0].split(',')

        let pcid = uuidv4()
        
        let options = {
            id: pcid,
            name:new_args[0],
            init:Number(new_args[1]),
            init_mod:Number(new_args[2]),
            line_order:0,
            cmark:false,
            status_effects:[],
            npc:true,
            color:init_funcs.getRandomColor()
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