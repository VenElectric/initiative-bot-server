const {DiceRoll,DiceRoller} = require('rpg-dice-roller');
const Discord = require('discord.js');
const {db} = require('../../processes/firebasesetup')
const {logger} = require('../../logging/logger')
const myredis = require("../../processes/redis-request");

const cemoj = ":bow_and_arrow:"
const bemoj = ":black_medium_square:"

function rolld20(num){
    let arrd20 = []
    for (z = 0; z < num; z++){
        let myroll = new DiceRoll('d20')
        arrd20.push(myroll.total)
    }
    let uniqueroll = [...new Set(arrd20)];
    return uniqueroll
}

function embed_set(embedarray){
    let name = ''
    let current = ''
    let count = 0
    let embed = new Discord.MessageEmbed()
    try{
        for (e = 0; e < embedarray.length; e++){
            if (count < (embedarray.length-1)){
                name += embedarray[e].Name + '\n';
                current += embedarray[e].cmark ? cemoj + '\n': bemoj + '\n';
                count += 1;
            }
            else{
                name += embedarray[e].Name;
                current += embedarray[e].cmark ? cemoj: bemoj;
                count += 1;
            }
        }
        embed.addFields(
            { name: 'Name', value: name,inline:true },
            {name: 'Current', value: current,inline:true }
            )
    }
    catch(error){
        console.log(error)
    }
    return embed
}
module.exports = {
    name:'sort',
    description:'Sort after adding in new initiative',
    async execute(message){
    var sessionid = message.channel.id;
    const initRef = db.collection('sessions').doc(sessionid)
    const sortRef = await db.collection('sessions').doc(sessionid).get()
    const snapshot = await initRef.collection('initiative').get()
    let init_list = [];
    let on_deck = sortRef.data().on_deck
    snapshot.forEach(doc => {
        init_list.push({id: doc.id, ...doc.data()})
    })
   
        let dupes = [];
        for (i = 0; i < init_list.length; i++) {
            for (x in init_list){
                if (init_list[x] != init_list[i].id){
                    if (init_list[x].initiative === init_list[i].initiative && init_list[x].init_mod === init_list[i].init_mod){
                        console.log('Dupe Added')
                        dupes.push(init_list[i])
                        break
                    }
                    else{
                        continue
                    }
                }
                if (record.id == init_list[i].id){
                    continue 
                }
            }
        }
        try{
            if (dupes.length == 0){
                console.log('Ok!')
            }
            else{
                let rolls = []
                let mylen = 0
                while(mylen < dupes.length){
                    rolls = rolld20(dupes.length)
                    mylen = rolls.length
                }
                console.log(rolls)
                for (z in dupes){
                    for (y = 0; y < init_list.length; y++){
                        if (dupes[z].id === init_list[y].id){
                            let resultdec = Number(rolls[y]/100)
                            let newnum = Number(init_list[y].init_mod)
                            let total = Number (newnum+resultdec)
                            init_list[y].init_mod = total
                            newnum = 0
                            resultdec = 0
                            total = 0
                        }
                    }
                }
            }
        }
        catch (error){
            console.log(error)
            logger.error(error + " sort")
        }
        init_list.sort(function(a,b){
            if (a.init > b.init) return -1;
            if (a.init < b.init) return 1;
            if (a.init_mod > b.init_mod) return -1;
            if (a.init_mod < b.init_mod) return 1;
        });

        for (v = 0; v < init_list.length; v++){
            init_list[v].line_num = Number(v+1)
            if (init_list[v].cmark == true){
                init_list[v].cmark == false
            }
        }
        
        // init_list[on_deck].cmark = true;

        myredis.set_data(sessionid,{sorted:true,on_deck:on_deck,session_init:init_list})
        
            for (x in init_list){
                var myref = db.collection('sessions').doc(sessionid).collection('initiative').doc(init_list[x].id)
                myref.set({cmark:init_list[x].cmark,line_num:Number(init_list[x].line_num)},{ merge: true }).then(() =>{
                    console.log('success')
                })
                .catch((error)=> {
                    console.log(error)
                    logger.error(error + " sort:set")
                })
            }
        message.channel.send('Initiative has been sorted.')
        
    },
}