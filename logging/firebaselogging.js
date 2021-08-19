const { db } = require("../processes/firebasesetup");
const sessionRef = db.collection("sessions");
const axios = require('axios')
require('dotenv').config()
const {firestore} = require('firebase-admin');

function warn_log(session_id,warning,data){

    let options = {
      created: firestore.Timestamp.now(),
      message:JSON.stringify(warning),
      log_data:JSON.stringify(data),
      level:"WARNING"
    }
    sessionRef
    .doc(session_id)
    .collection('logging')
    .add(options)
    .then(() => {
        let params = {
            username: "Alert!",
            avatar_url: "",
            content: JSON.stringify(options)
        }
        let url = process.env.WEBHOOK
        axios.post(url,params).then(res => {
            // console.log(`statusCode: ${res.status}`)
            // console.log(res.status)
          })
          .catch(error => {
            console.trace('warn error',error)
          })
        
    }).catch(error => {
        // console.trace(error)
        console.trace('warn error',error)
    });
}

function info_log(session_id,info,data){
    sessionRef
    .doc(session_id)
    .collection('logging')
    .add({
      created: firestore.Timestamp.now(),
      message:info,
      data:data,
      level:"INFO"
    })
    .then(() => {
      console.log("Added log"); // Added user
    }).catch(error => {

    });
}


module.exports = {info_log,warn_log}