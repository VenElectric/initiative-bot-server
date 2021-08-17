const {db} = require('../../processes/firebasesetup')
const {logger} = require('../../logging/logger')
const {warn_log,info_log} = require('../../logging/firebaselogging')
module.exports = {
    name:'clearsessionlist',
    description:'Delete all records from initiative list.',
    async execute(message){
        let sessionid = message.channel.id;
        const initRef = db.collection('sessions').doc(sessionid)
        const snapshot = await initRef.collection('initiative').get()
        const batch = db.batch();
        snapshot.docs.forEach((doc)=>{
            batch.delete(doc.ref);
        })
        await batch.commit();
        message.channel.send('Reset complete.')
    },
}