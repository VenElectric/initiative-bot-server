const redis = require("redis");
const { warn_log, info_log } = require("../logging/firebaselogging");
require("dotenv").config();
const initstore = require("./initstore");

let redis_token = process.env.REDIS_TOKEN;
let redis_url = process.env.REDIS_URL;
const redisClient = redis.createClient({
  host: redis_url,
  port: "15984",
  password: redis_token,
});

const def_exp = 3600;
const { logger } = require("../logging/logger");

async function test_rpush(projectkey) {
  try {
    redisClient.rpush(projectkey, JSON.stringify({ id: "8675300" }));
  } catch (error) {
    console.warn(error);
  }
}

redisClient.on("error", (error) => {
  console.log(error);
});

async function delete_key(projectkey) {
  redisClient.del(projectkey);
}

async function get_lrange(projectkey) {
  redisClient.lrange(projectkey, 0, -1, (error, data) => {
    if (error) {
      warn_log(projectkey, "Error at get_lrange", {
        error: error,
        stack: error.stack,
        projectkey: projectkey,
      });
      return null;
    }
    if (data) {
      return data;
    }
    if (data === null) {
      //send request to server
    }
  });
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
  console.log(key);
  let time_to_live;
  redisClient.ttl(key, (error, msg) => {
    if (error) {
      warn_log(session_id, "TypeError at update init", JSON.stringify(error), {
        stack: error.stack,
        key: key,
        data: data,
      });
    }
    if (msg) {
      time_to_live = msg;
    }
  });

  if (time_to_live <= 120) {
    console.log(time_to_live);
    redisClient.setex(key, def_exp, JSON.stringify(data));
    initstore.update_init(sessiond_id, data);
  }
  if (time_to_live > 120) {
    console.log(time_to_live);
    resdisClient.set(key, JSON.stringify(data));
  }
}

// add new initiative
async function add_new_init(session_id, key, init) {
  try {
    redisClient.rpush(session_id, JSON.stringify({ id: init.id }));
    redisClient.setex(key, def_exp, JSON.stringify(init));
  } catch (error) {
    warn_log(session_id, "TypeError at update init", {
      error: JSON.stringify(error),
      stack: error.stack,
      key: key,
      data: init,
    });
  }
}

async function add_new_spell(key, spell) {
  redisClient.setex(key, def_exp, JSON.stringify(spell));
}

async function delete_spell(key) {
  redisClient.del(key);
}

async function update_spell(key, data) {
  redisClient.TTL(key, (error, msg) => {
    if (error) {
      warn_log(session_id, "TypeError at update spell", JSON.stringify(error), {
        stack: error.stack,
        key: key,
        data: data,
      });
    }
    if (msg) {
      try {
        if (msg <= 120) {
          redisClient.setex(key, def_exp, JSON.stringify(data));
          initstore.update_spell(sessiond_id, data);
        }
        if (msg > 120) {
          resdisClient.set(key, JSON.stringify(data));
        }
      } catch (error) {
        warn_log(
          session_id,
          "TypeError at  update spel",
          JSON.stringify(error),
          { stack: error.stack, key: key, data: data }
        );
        console.trace(error);
      }
    }
  });
}

async function initialize_redis(projectkey) {
  try {
    redisClient.rpush(projectkey, JSON.stringify({ ondeck: 0 }));
    redisClient.rpush(projectkey, JSON.stringify({ sort: false }));
  } catch (error) {
    console.log("do nothing");
  }
}

async function get_init(projectkey) {
  let init_promise = new Promise((resolve, reject) => {
    redisClient.get(projectkey, (error, data) => {
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

async function get_all_init(projectkey) {
  let request_data = await get_lrange(projectkey);
  let init_data = [];
  let status_data = [];
  try {
    for (let x in request_data) {
      if (request_data[x].id === "room" || "ondeck" || "sort") {
        init_data.push(request_data[x]);
      } else {
        redisClient.get(request_data[x].id, (error, data) => {
          if (error) {
            console.log(error);
            /// should probably delete from request_data
          }
          if (data) {
            init_data.push(data);
          }
        });

        logger.info(init_);
      }
    }
  } catch (error) {
    if (error instanceof TypeError) {
      logger.warn("TypeError", error);
    }
  }
  console.log(init_data);
  return init_data;
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
  get_all_init,
  test_rpush,
  update_all,
  delete_key,
};
