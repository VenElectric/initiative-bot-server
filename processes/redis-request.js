const redis = require("redis");
const { redis_token } = require("../config.json");
const redisClient = redis.createClient({
  host: "redis-15984.c280.us-central1-2.gce.cloud.redislabs.com",
  port: "15984",
  password: redis_token,
});

const def_exp = 3600;
const {logger} = require('../logging/logger')

redisClient.on("error", function (err) {
  console.log(err);
});

async function get_lrange(projectkey) {
  redisClient.lrange(projectkey, 0, -1, (error, data) => {
    if (error) {
      console.log(error);
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
    redisClient.set(projectkey, request_data, function (err, reply) {
      if (err) {
        return callback(err, null);
      } else {
        callback(null, reply);
      }
    });
    redisClient.del(key);
  } catch (error) {
    if (error instanceof TypeError) {
      logger.warn("TypeError", error);
    }
  }
}

// async function set_data(projectkey, key, data) {
//   redisClient.rpush(projectkey, JSON.stringify(key));
//   redisClient.set_expire(projectkey, def_exp);
//   redisClient.setex(key, def_exp, JSON.stringify(data));
// }

async function update_init(key, data) {
  console.log(key);
  redisClient.setex(key, def_exp, JSON.stringify(data), function (err, reply) {
    if (err) {
      console.log(err);
    } else {
      console.log(reply);
    }
  });
}
// add new initiative
async function add_new_init(projectkey, key, init) {
  redisClient.rpush(
    projectkey,
    JSON.stringify({ id: init.id, status: init.line_order })
  );
  redisClient.setex(key, def_exp, JSON.stringify(init));
}

async function add_new_spell(key, spell) {
  redisClient.setex(key, def_exp, JSON.stringify(spell));
}

async function delete_spell(key) {
  redisClient.del(key);
}

async function update_spell(key, data) {
  redisClient.setex(key, def_exp, JSON.stringify(data));
}

async function initialize_redis(projectkey) {
  redisClient.rpush(projectkey, JSON.stringify({ id: "room", status: "test" }));
  redisClient.rpush(projectkey, JSON.stringify({ id: "ondeck", status: 2 }));
  redisClient.rpush(projectkey, JSON.stringify({ id: "sort", status: true }));
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

async function update_spell(key, data) {
  redisClient.setex(key, def_exp, JSON.stringify(data));
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
};
