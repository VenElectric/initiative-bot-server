const { db } = require("./firebasesetup");
const { v4: uuidv4 } = require('uuid');
const sessionRef = db.collection("sessions")
const chalk = require('chalk');

function write_all(session_id,init_list){

    let initRef = sessionRef.doc(session_id)

    initRef
					.set({ on_deck: 2, sorted: true }, { merge: true })
					.then(() => {
						console.log("success");
					})
					.catch((error) => {
						console.log(error);
					});
				for (x in init_list) {
					var myref = initRef
						.collection("initiative")
						.doc(init_list[x].id);
					myref
						.set({line_order:init_list[x].line_order,cmark:init_list[x].cmark}, { merge: true })
						.then(() => {
							console.log("success");
						})
						.catch((error) => {
							console.log(error);
						});
				}
}

async function get_all(session_id){
    console.log(session_id)
    let initRef = sessionRef.doc(session_id)
    let init_list = []
    let snapshot = await initRef.collection('initiative').get();
    
    if (snapshot.docs !== undefined){
        console.trace('here')
            snapshot.forEach(doc => {
                init_list.push({id: doc.id, ...doc.data()})
            })
            return init_list
        }
    if (snapshot.docs === undefined){
        console.trace('undefined!')
        return '0'
    }

}

function add_init(session_id,init){
    let initRef = sessionRef.doc(session_id)
    initRef.collection('initiative').doc(init.id)
        .set(init)
        .then(async ()=>{
                initRef.set({sorted:false},{merge:true}).then(()=>{
                    console.log(chalk.bgBlue('Initiative Added Success'))
                })
                .catch((error) => {
                    console.log(chalk.bgRed('Error adding in initiative.' + error))
                    
                })
            }).catch((error) => {
            console.log(chalk.bgRed('Error adding in initiative.' + error))
            
        })
}

module.exports = {add_init,write_all,get_all}