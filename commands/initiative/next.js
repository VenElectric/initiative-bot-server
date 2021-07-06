const firebase = require('firebase')
require('firebase/firestore')
const chalk = require('chalk');

const db = firebase.firestore();

module.exports = {name:'next',
description:'Move initiative forward.',
cooldown: 5,
async execute(message){
     var sessionid = message.channel.id;
     const initRef = db.collection('sessions').doc(sessionid)
     const sortRef = await db.collection('sessions').doc(sessionid).get()
     const collect = await initRef.collection('initiative').get()


     var total = collect.size
     let current = await sortRef.data().on_deck
     
     let prev;
     let next;
     if (current == total){
          next = 1
          prev = current-1
          console.log('this')
     }
     if (current == 1){
          next = current + 1
          prev = total
          console.log('prev=total')
     }
     if (current < total && current != 1){
          next = current + 1
          prev = current - 1
          console.log('current<total')
     }
     console.log(chalk.bgBlue("Total:" + total))
     console.log(chalk.bgBlue("Next:" + next))
     console.log(chalk.bgBlue("Current" + current))
     console.log(chalk.bgBlue("Prev:" + prev))
     const prevSnap = await initRef.collection('initiative').where('line_num', '==', Number(prev)).get();
     const currentSnap = await initRef.collection('initiative').where('line_num', '==', Number(current)).get();
     initRef.set({on_deck:next},{merge:true}).then(()=> {
               console.log('success')
           })
           .catch((error)=>{
               console.log(error)
           })
     initRef.collection('initiative').doc(prevSnap.docs[0].id).set({cmark:false},{merge:true}).then(()=> {
               console.log('success')
           })
           .catch((error)=>{
               console.log(error)
           })
     initRef.collection('initiative').doc(currentSnap.docs[0].id).set({cmark:true},{merge:true}).then(()=> {
          console.log('success')
      })
      .catch((error)=>{
          console.log(error)
      })  
     let current_turn;
     collect.docs.forEach(element => {
          if (element.data().line_num === current){
               current_turn = element.data().Name
          } 
          else{
               console.log('nothing')
          }
     })
     
     message.channel.send('Current Turn: ' + current_turn)
},
}