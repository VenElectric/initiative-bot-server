const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const firebase = require('firebase')
require('firebase/firestore')
const winston = require('winston');
const { mod } = require('mathjs');

const db = firebase.firestore();

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

module.exports = {
    name:'add',
    description:'Add in your initiative manually.',
    async execute(message,args){
        const initRef = db.collection('sessions')
        var sessionid = message.channel.id;

        var name = parse_name(args)
        
        var options = {
            Name:name.trim(),
            init:Number(args.slice(-2,-1)),
            init_mod:Number(args.slice(-1)),
            line_num:0,
            cmark:false,
            dmark:false,
            rmark:false
        }
        initRef.doc(sessionid).collection('initiative').doc(uuidv4())
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