const admin = require("firebase-admin");
const process = require('process');
// let serviceAccount = require("../firebase.json");

const googleServiceAccountCreds = process.env.GOOGLE_CONFIG;
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
  