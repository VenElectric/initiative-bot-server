const { db } = require("./firebasesetup");
const { v4: uuidv4 } = require("uuid");
const sessionRef = db.collection("sessions");
const chalk = require("chalk");
const {logger} = require('../logging/logger')

function write_all(session_id, init_list,sorted,ondeck) {
  let initRef = sessionRef.doc(session_id);

  initRef
    .set({ on_deck: ondeck, sorted: sorted }, { merge: true })
    .then(() => {
      console.log("success");
    })
    .catch((error) => {
      console.log(error);
    });
  for (x in init_list) {
    let myref = initRef.collection("initiative").doc(init_list[x].id);
    myref
      .set(
        init_list[x],
        { merge: true }
      )
      .then(() => {
        console.log("success");
      })
      .catch((error) => {
        console.log(error);
      });
  }
}

async function get_all(session_id, collect) {
  console.log(session_id);
  let initRef = sessionRef.doc(session_id);
  let init_list = [];
  let snapshot = await initRef.collection(collect).get();

  if (snapshot.docs !== undefined) {
    console.trace("here");
    snapshot.forEach((doc) => {
      init_list.push({ id: doc.id, ...doc.data() });
    });
    return init_list;
  }
  if (snapshot.docs === undefined) {
    console.trace("undefined!");
    return "0";
  }
}

async function get_initial(session_id){
  let initRef = sessionRef.doc(session_id);
  let snapshot = await initRef.get();

  if (snapshot.data() !== undefined){
    let ondeck = snapshot.data().on_deck
    let sorted = snapshot.data().sorted
    return {on_deck:ondeck,sort:sorted}
  }
  else{
    return {on_deck:0,sort:false}
  }
}

function add_init(session_id, init) {
  let initRef = sessionRef.doc(session_id);
  initRef
    .collection("initiative")
    .doc(init.id)
    .set(init)
    .then(async () => {
      initRef
        .set({ sorted: false }, { merge: true })
        .then(() => {
          console.log(chalk.bgBlue("Initiative Added Success"));
        })
        .catch((error) => {
          console.log(chalk.bgRed("Error adding in initiative." + error));
        });
    })
    .catch((error) => {
      console.log(chalk.bgRed("Error adding in initiative." + error));
    });
}

function update_init(session_id, init) {
  let initRef = sessionRef.doc(session_id);
  initRef
    .collection("initiative")
    .doc(init.id)
    .set(init, { merge: true })
    .then(() => {
      console.log("success");
    })
    .catch((error) => {
      console.log(error);
    });
}

function delete_init(session_id, id) {
  let initRef = sessionRef.doc(session_id);
  initRef
    .collection("initiative")
    .doc(id)
    .delete()
    .then(() => {
      console.log("Success?");
    })
    .catch((error) => {
      console.log(error);
    });
}

function add_spell(session_id, spell) {
  let spellRef = sessionRef.doc(session_id).collection("spells");
  spellRef
    .doc(spell.id)
    .set(spell)
    .then(() => {
      console.log("success");
    })
    .catch((error) => {
      console.log(chalk.bgRed("Error adding in initiative." + error));
    });
}

function delete_spell(session_id, id) {
  let spellRef = sessionRef.doc(session_id).collection("spells");
  spellRef
    .doc(id)
    .delete()
    .then(() => {
      console.log("Success?");
    })
    .catch((error) => {
      console.log(error);
    });
}

function update_spell(session_id, spell) {
  let spellRef = sessionRef.doc(session_id).collection("spells");
  spellRef
    .doc(spell.id)
    .set(spell, { merge: true })
    .then(() => {
      console.log("success");
    })
    .catch((error) => {
      console.log(error);
    });
}

async function remove_all_init(session_id) {
  let snapshot = await sessionRef
    .doc(session_id)
    .collection("initiative")
    .get();
  let batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  sessionRef
    .doc(session_id)
    .set({ sorted: false, on_deck: 0 }, { merge: true })
    .then(() => {
      console.log("success");
    })
    .catch((error) => {
      console.log(chalk.bgRed("Error updating." + error));
    });
  await batch.commit();
}

async function remove_all_spells(session_id) {
  let snapshot = await sessionRef.doc(session_id).collection("spells").get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

module.exports = {
  add_init,
  write_all,
  get_all,
  update_init,
  delete_init,
  add_spell,
  delete_spell,
  update_spell,
  remove_all_init,
  remove_all_spells,
  get_initial
};
