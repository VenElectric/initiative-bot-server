const admin = require("firebase-admin");

// let serviceAccount = require("../firebase.json");

const googleServiceAccountCreds = Buffer.from(process.env.GOOGLE_CONFIG, 'base64').toString('ascii')
if (!googleServiceAccountCreds) throw new Error('The $GOOGLE_SERVICE_ACCOUNT_CREDS environment variable was not found!');

admin.initializeApp({
  credential: admin.credential.cert({
      projectId: "dungeon-bot-4e0e8", 
      clientEmail: process.env.clientemail, 
      privateKey: googleServiceAccountCreds
  }),
})

const db = admin.firestore()

module.exports = {db}
  