const admin = require("firebase-admin");
const process = require('process');
// let serviceAccount = require("../firebase.json");

let serviceAccount = JSON.parse(Buffer.from(process.env.GOOGLE_CONFIG, 'base64').toString('ascii'))

admin.initializeApp({
  credential: admin.credential.cert({
      projectId: "dungeon-bot-4e0e8", 
      clientEmail: process.env.clientemail, 
      privateKey: process.env.gprivatekey.replace(/\\n/g, '\n')
  }),
})

const db = admin.firestore()

module.exports = {db}
  