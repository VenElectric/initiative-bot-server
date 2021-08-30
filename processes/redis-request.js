const redis = require("redis");
const { warn_log, info_log } = require("../logging/firebaselogging");
require("dotenv").config();
const initstore = require("./initstore");
const chalk = require('chalk')

let redis_token = process.env.REDIS_TOKEN;
let redis_url = process.env.REDIS_URL;
const redisClient = redis.createClient({
  host: redis_url,
  port: "15984",
  password: redis_token,
});

const def_exp = 3600;
const { logger } = require("../logging/logger");
const { request } = require("express");

// async function pushpush(session_id,item){
//   try{
//     redisClient.rpush(session_id,item)
//   }
//   catch(error){
//     console.log(error)
//   }
  
// }

// async function test_rpush(projectkey) {
//   let init_promise = new Promise((resolve, reject) => {
//     redisClient.lrange(projectkey, 0, -1, (error, data) => {
//       if (error) {
//         warn_log(projectkey, "Error at get_lrange", {
//           error: error,
//           stack: error.stack,
//           projectkey: projectkey,
//         });
//         console.log(chalk.yellowBright(error))
//         reject(error)
//       }
//       if (data) {
//         console.log(data)
//         resolve(data)
//       }
//       if (data === null) {
//         resolve('data null')
//         //send request to server
//       }
//   })
// })
// return init_promise
// }

redisClient.on("error", (error) => {
  console.log(error);
});



async function delete_key(projectkey) {
  redisClient.del(projectkey);
}

async function get_lrange(projectkey) {
  let lrange_prom = new Promise((resolve, reject) => {
  redisClient.lrange(projectkey, 0, -1, (error, data) => {
    if (error) {
      warn_log(projectkey, "Error at get_lrange", {
        error: error,
        stack: error.stack,
        projectkey: projectkey,
      });
      reject(error);
    }
    if (data) {
      
      resolve(data);
    }
    if (data === null) {
      resolve(null);
    }
  })
})
return lrange_prom
}

async function remove_redinit(projectkey, key) {
  let request_data = await get_lrange(projectkey);
  try {
    let to_remove = request_data.indexOf(key);
    request_data.splice(to_remove, 1);
    redisClient.set(projectkey, request_data, function (error, reply) {
      if (error) {
        warn_log(projectkey, "Error at remove init", {
          error: JSON.stringify(error),
          stack: error.stack,
          projectkey: projectkey,
        });
        return callback(error, null);
      } else {
        callback(null, reply);
      }
    });
    redisClient.del(key);
  } catch (error) {
    if (error instanceof TypeError) {
      warn_log(projectkey, "TypeError at remove init", {
        error: JSON.stringify(error),
        stack: error.stack,
        projectkey: projectkey,
      });
    }
  }
}

async function update_all_spells(session_id, data) {
  try {
    for (let x = 0; x < data.length; x++) {
      await update_spell(session_id, data[x].id, data[x]);
    }
  } catch (error) {
    warn_log(session_id, "Error at update all", JSON.stringify(error), {
      stack: error.stack,
      data: data,
    });
  }
}


async function update_all(session_id, data) {
  try {
    for (let x = 0; x < data.length; x++) {
      await update_init(session_id, data[x].id, data[x]);
    }
  } catch (error) {
    warn_log(session_id, "Error at update all", JSON.stringify(error), {
      stack: error.stack,
      data: data,
    });
  }
}

async function update_init(session_id, key, data) {
  let ttl = await get_ttl(session_id,key)
  console.log(ttl)
    if (ttl <= 1200) {
      redisClient.setex(key, def_exp, JSON.stringify(data));
      let init_data = await get_lrange(`character${session_id}`)
      console.log(init_data)
      try{
        for (let x = 0;x<init_data.length;x++){
          let myid = JSON.parse(init_data[x])
          redisClient.get(myid.id,(error,data)=> {
            if (error){
              console.log(error)
            }
            if (data){
              let new_data = JSON.parse(data)
              console.log(new_data)
              initstore.update_init(session_id, new_data);
            }
          })
        }
      }
      catch(error){
        console.log(error)
      }
     
    }
    if (ttl > 1200) {
      redisClient.setex(key, ttl,JSON.stringify(data))
      console.log(chalk.magenta(ttl,'time_to_live'))
    }
 
}

async function get_ttl(session_id,key){

  let ttl_promise = new Promise((resolve, reject) => {
    redisClient.TTL(key,(error,msg)=> {
      if (error) {
        info_log(session_id, "TypeError at update init", JSON.stringify(error), {
          stack: error.stack,
          key: key,
          data: error,
        });
        resolve(1000)
      }
      if (msg) {
        console.log(chalk.magenta(msg,'time_to_live in ttl'))
        resolve(msg)
      }
    })
  });
  return ttl_promise;
  
}

// add new initiative
async function add_new_init(session_id, init) {
  try {
    redisClient.rpush(`character${session_id}`, JSON.stringify({ id: init.id }));
    redisClient.setex(init.id, def_exp, JSON.stringify(init));
  } catch (error) {
    warn_log(session_id, "TypeError at update init", {
      error: JSON.stringify(error),
      stack: error.stack,
      key: init.id,
      data: init,
    });
  }
}

async function add_new_spell(session_id, spell) {
  try {
    redisClient.rpush(`spells${session_id}`, JSON.stringify({ id: spell.id }));
    redisClient.setex(spell.id, def_exp, JSON.stringify(spell));
  } catch (error) {
    warn_log(session_id, "TypeError at update init", {
      error: JSON.stringify(error),
      stack: error.stack,
      key: key,
      data: init,
    });
  }
}

async function initialize_all_spells(session_id,spells){
  let ttl = await get_ttl(session_id,spells.id)
  console.log(ttl)
  if(ttl <= 1000){
    try{
      for (let x = 0;x<spells.length;x++){
        await add_new_spell(session_id,spells[x])
      }
    }
    catch(error){
      console.log(error)
    }
  }
  else{
    console.log('spells already initialized')
  }
  
}

async function initialize_all_init(session_id,init){
  let ttl = await get_ttl(session_id,init.id)
  if(ttl <= 1000){
  try{
    for (let x = 0;x<init.length;x++){
      await add_new_init(session_id,init[x])
    }
  }
  catch(error){
    console.log(error)
  }
}
else{
  console.log('init already initialized')
}
}

async function delete_spell(key) {
  redisClient.del(key);
}

async function update_spell(session_id, data) {
  let ttl = await get_ttl(session_id,data.id)
  console.log(ttl)
    if (ttl <= 1200) {
      redisClient.setex(data.id, def_exp, JSON.stringify(data));
      let spell_data = await get_lrange(`spells${session_id}`)
      
      try{
        for (let x = 0;x<spell_data.length;x++){
          let myid = JSON.parse(spell_data[x])
          redisClient.get(myid.id,(error,data_s)=> {
            if (error){
              console.log(error)
            }
            if (data_s){
              let new_data = JSON.parse(data_s)
              console.log(new_data)
              initstore.update_spell(session_id, new_data);
            }
          })
        }
      }
      catch(error){
        console.log(error)
      }
     
    }
    if (ttl > 1200) {
      redisClient.setex(data.id,ttl, JSON.stringify(data))
      console.log(chalk.magenta(ttl,'time_to_live'))
    }

}

async function initialize_redis(session_id) {
  try {
    redisClient.setex(`initial${session_id}`, def_exp,JSON.stringify({ ondeck: 0,sort: false }));
  } catch (error) {
    console.log("do nothing");
  }
}

async function update_initial(session_id,ondeck,sort){
  try {
    redisClient.set(`initial${session_id}`, JSON.stringify({ ondeck: ondeck,sort: sort }));
  } catch (error) {
    console.log("do nothing");
  }
}

async function get_init(session_id) {
  let init_promise = new Promise((resolve, reject) => {
    redisClient.get(session_id, (error, data) => {
      if (error) {
        reject(error);
      }
      if (data) {
        let init_list = JSON.parse(data);
        let init_final = init_list.initiative;
        console.trace(init_final);
        resolve(init_final);
      }
    });
  });
  return init_promise;
}


module.exports = {
  update_init,
  update_spell,
  get_init,
  initialize_redis,
  add_new_init,
  remove_redinit,
  add_new_spell,
  update_spell,
  delete_spell,
  test_rpush,
  update_all,
  delete_key,
  update_all_spells,
  update_initial,
  initialize_all_spells,
  initialize_all_init,
  pushpush
};
