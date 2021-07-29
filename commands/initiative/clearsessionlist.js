const {db} = require('../../processes/firebasesetup')

module.exports = {
    name:'clearsessionlist',
    description:'Delete all records from initiative list.',
    async execute(message){
        var sessionid = message.channel.id;
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