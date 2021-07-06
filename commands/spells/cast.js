const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const firebase = require('firebase')
require('firebase/firestore')
const winston = require('winston');
const { mod } = require('mathjs');

const db = firebase.firestore();

module.exports = {
    name: 'cast',
	description: 'Add spell to trackers',
	execute(message,args) {
        let spell = ''
        var sessionid = message.channel.id;
        const initRef = db.collection('sessions').doc(sessionid)
        for (x in args){
            spell += args[x] + ' '
        }

        spell.trim()
        var options = {
            spell_name:spell.trim(),
            char_effect:'None',
            duration:'None'
        }
        initRef.collection('spells').doc(uuidv4())
        .set(options)
        .then(()=>{
            console.log('Success')
            message.channel.send(spell.trim() + ' Added');
        })
        .catch((error)=>{
            message.channel.send(`Error adding in spell. Try using the web page.`);
        })
	},
}