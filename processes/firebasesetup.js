const admin = require("firebase-admin");
const process = require('process');
// let serviceAccount = require("../firebase.json");

let serviceAccount = JSON.parse(Buffer.from(String(process.env.GOOGLE_CONFIG), 'base64').toString('ascii'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

module.exports = {db}
  