const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const {db} = require('../../processes/firebasesetup')
const {logger} = require('../../logging/logger')
const initRef = db.collection('sessions')
const init_funcs = require('../../processes/init_functions')
const {warn_log,info_log} = require('../../logging/firebaselogging')

module.exports = {
    name:'add_pc',
    description:'Add in your initiative manually.',
    async execute(message,args,io){
        
        let sessionid = message.channel.id;

        console.log(args[0])
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
            npc:false,
            color:init_funcs.getRandomColor()
        }
        io.to(sessionid).emit('client_add_init',{sort:false,initiative:options})
        initRef.doc(sessionid).collection('initiative').doc(pcid)
        .set(options)
        .then(async ()=>{
            let sorted = await initRef.doc(sessionid).get()
            if (sorted){
                initRef.doc(sessionid).set({sorted:false},{merge:true}).then(()=>{
                    info_log(sessionid,'Init Added succss',options)
                    message.channel.send('Init Added. Please use the sort command to sort initiative.')
                })
                .catch((error) => {
                    warn_log(sessionid,'Error adding in initiative',{error:error,stack:error.stack,options:options,args:args})
                    message.channel.send('Error adding in initiative. Please try again')
                })
            }
            else{
                info_log(sessionid,'Init Added succss',options)
                message.channel.send('Init Added')
            }
        }).catch((error) => {
            warn_log(sessionid,'Error adding in initiative',{error:error,stack:error.stack,options:options,args:args})
            message.channel.send('Error adding in initiative. Please try again.')
        })
    },
    
};