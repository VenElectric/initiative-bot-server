const redis = require('redis')
const {redis_token} = require('../config.json')
const redisClient = redis.createClient({host:'redis-15984.c280.us-central1-2.gce.cloud.redislabs.com',port:'15984',password:redis_token})
const def_exp = 3600
const { DiceRoll} = require("rpg-dice-roller");
const { v4: uuidv4 } = require('uuid');
const { promisify } = require("util");
const { rejects } = require('assert');


redisClient.on("error", function(err) {
    console.log(err)
})



function test_redis(){
    let new_roll = new DiceRoll('d20')
    let id = uuidv4()
    let session = '12345678'
    redisClient.rpush(session,JSON.stringify(id))
    redisClient.setex(String(id),def_exp,JSON.stringify(new_roll.total),(err,res) =>{
            if (err){
                console.log(err)
                return err
            }
            if (res){
                console.log(res,'res?')
                return res
            }
        })
    // redisClient.setex('test',def_exp,JSON.stringify({mytest:'test'}))

}

function get_test(){
    redisClient.lrange('12345678',0,-1,(error,data) => {
                if (error){
                    console.log(error)
                    return null
                }
                if (data){
                    console.log(data)
                }
                if (data === null){
                    //send request to server
                }
            })
}


async function get_data(key){
    console.log(key)
    redisClient.get(key,(error,data) => {
        if (error){
            console.log(error)
            return null
        }
        if (data){
            console.log(data)
            let new_data = JSON.parse(data)
            return new_data
        }
        if (data === null){
            //send request to server
        }
    })
}

async function remove_redinit(projectkey,key){
    let request_data = await get_data(projectkey)
    let init_ids = JSON.parse(request_data)
    let to_remove = init_ids.indexOf(key)
    request_data.splice(to_remove,1)
    redisClient.set(projectkey,request_data)
    redisClient.del(key)
}

async function set_sortorondeck(projectkey,key,data){
    let old_data = await get_data(projectkey)
    let parsed_data = JSON.parse(old_data)
    console.log(parsed_data)
    parsed_data.data[key] = data
    redisClient.set(projectkey,JSON.stringify(parsed_data))
}

async function set_data(projectkey,key,data){
    redisClient.rpush(projectkey,JSON.stringify(key))
    redisClient.set_expire(projectkey,def_exp)
    redisClient.setex(key,def_exp,JSON.stringify(data))
}

async function update_init(key,data){
    redisClient.set(key,JSON.stringify(data))
}
// add new initiative
async function add_new_init(projectkey,key,init){
    redisClient.get(projectkey,(error,data) => {
        if (error){
            console.log(error)
            
        }
        if (data){
            let new_data = JSON.parse(data)
            new_data.initiative.push(init)
            new_data.data.sorted = false
            redisClient.set(projectkey,JSON.stringify(new_data))
        }})

}

async function initialize_redis(projectkey){
    redisClient.setex(projectkey,def_exp,JSON.stringify({data:{ondeck:0,sorted:false},initiative:[]}))
}

async function get_init(projectkey){

    let init_promise = new Promise((resolve,reject) => {
        redisClient.get(projectkey,(error,data) => {
            if (error){
                reject(error)
            }
            if (data){
                let init_list = JSON.parse(data)
                let init_final = init_list.initiative
                console.trace(init_final)
                resolve(init_final)
            }
        })
    })
    return init_promise
    

//     if (error){
//         console.log(error)
//     }
//     if (init_ids != null){
//         let init_final = init_ids.initiative
//         return await init_final
// }
// if (init_ids === null){
//     // send request to server
//     console.log('init_ids === null')
//     return []
// }
}

async function update_spell(key,data){
    redisClient.set(key,JSON.stringify(data))
}

async function add_spell(projectkey,key,data){
    redisClient.rpush(projectkey,JSON.stringify(key))
    redisClient.setex(key,JSON.stringify(data))
}

module.exports = {get_data,set_data,add_spell,update_init,update_spell,get_init,initialize_redis,add_new_init,set_sortorondeck,remove_redinit}