const admin = require("firebase-admin");

// let serviceAccount = require("../firebase.json");

const googleServiceAccountCreds = Buffer.from(process.env.GOOGLE_CONFIG, 'base64').toString('ascii')
if (!googleServiceAccountCreds) throw new Error('The $GOOGLE_SERVICE_ACCOUNT_CREDS environment variable was not found!');

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(Buffer.from(process.env.GOOGLE_CONFIG, 'base64').toString('ascii'))),
})

const db = admin.firestore()

module.exports = {db}
  