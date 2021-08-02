const chalk = require("chalk");
const { db } = require("../../processes/firebasesetup");
const logger = require("../../logging/logger");
const myredis = require("../../processes/redis-request");

module.exports = {
	name: "next",
	description: "Move initiative forward.",
	cooldown: 5,
	async execute(message,io) {
		var sessionid = message.channel.id;
		let redis_data = await myredis.get_data(sessionid);
		let total;
		let current;
          let current_turn;
          const initRef = db.collection("sessions").doc(sessionid);
          let collect;

		if (redis_data != null) {
			total = redis_data.session_init.length();
			current = redis_data.on_deck;
		}
		if (redis_data == null) {
			const sortRef = await db.collection("sessions").doc(sessionid).get();
			collect = await initRef.collection("initiative").get();
			total = collect.size;
			current = await sortRef.data().on_deck;
		}

		let prev;
		let next;
		if (current == total) {
			next = 1;
			prev = current - 1;
			console.log("this");
		}
		if (current == 1) {
			next = current + 1;
			prev = total;
			console.log("prev=total");
		}
		if (current < total && current != 1) {
			next = current + 1;
			prev = current - 1;
			console.log("current<total");
		}

		if (redis_data != null) {
               redis_data.on_deck = next
               let previous_index =  redis_data.session_init.findIndex((line) => {
                    return line.id === prev
                  })
               let current_index = redis_data.session_init.findIndex((line) => {
                    return line.id === current
                  })

               redis_data.session_init[previous_index].cmark = false
               redis_data.session_init[current_index].cmark = true

               current_turn = redis_data.session_init[current_index].name

		}
		if (redis_data == null) {
			const prevSnap = await initRef
				.collection("initiative")
				.where("line_num", "==", Number(prev))
				.get();
			const currentSnap = await initRef
				.collection("initiative")
				.where("line_num", "==", Number(current))
				.get();
			initRef
				.set({ on_deck: next }, { merge: true })
				.then(() => {
					console.log("success");
				})
				.catch((error) => {
					console.log(error);
				});
			initRef
				.collection("initiative")
				.doc(prevSnap.docs[0].id)
				.set({ cmark: false }, { merge: true })
				.then(() => {
					console.log("success");
				})
				.catch((error) => {
					console.log(error);
				});
			initRef
				.collection("initiative")
				.doc(currentSnap.docs[0].id)
				.set({ cmark: true }, { merge: true })
				.then(() => {
					console.log("success");
				})
				.catch((error) => {
					console.log(error);
				});
			collect.docs.forEach((element) => {
				if (element.data().line_num === current) {
					current_turn = element.data().Name;
				} else {
					console.log("nothing");
				}
			});
               let data = []
               let new_redis = await db.collection("sessions").doc(sessionid).collection('initiative').get();
               new_redis.forEach(doc => {
                    data.push({id: doc.id, ...doc.data()})
               })
               await myredis.set_data(sessionid,{sorted:true,on_deck:next,session_init:data})
		}

		message.channel.send("Current Turn: " + current_turn);
	},
};
