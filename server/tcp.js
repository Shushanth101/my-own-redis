const net = require("net");
const Parser = require("redis-parser");

const store = new Map();
const expiry = new Map()
const lists = new Map();

const server = net.createServer((connection) => {

    console.log("Client connected");


    const parser = new Parser({

        returnReply: (reply) => {

            const command = reply[0].toUpperCase();

            switch(command) {

                case "SET": {

                    const key = reply[1];
                    const value = reply[2];
                    let expiration;
                    for(let i=3;i<reply.length-1;i++){
                        const option = reply[i].toUpperCase();
                        const amount = parseInt(reply[i+1],10);

                        if(option==="EX"){
                            expiration=Date.now()+(amount*1000);
                            break;
                        }else if(option==="PX"){
                            expiration=Date.now()+amount;
                            break;
                        }
                    }
                    store.set(key, value);
                    if(expiration!== undefined) expiry.set(key,expiration);
                    else expiry.delete(key);

                    connection.write("+OK\r\n");

                    break;
                }

                case "GET": {
                    const key = reply[1];

                    if(!store.has(key)){
                        connection.write("$-1\r\n")
                        break;
                    }

                    if(expiry.has(key)&&expiry.get(key)<=Date.now()){
                        store.delete(key);
                        expiry.delete(key);
                        connection.write("$-1\r\n");
                        break;
                    }
                    const value = store.get(key);
                    connection.write(`$${value.length}\r\n${value}\r\n`);
                    break;
                }

                case "DEL":{
                    const key = reply[1];
                    if(store.has(key)){
                        store.delete(key);
                        expiry.delete(key);
                        connection.write(":1\r\n");
                        break;
                    }else{
                        connection.write(":0\r\n");
                        break;
                    }
                }

                case "EXISTS":{
                    const key = reply[1];
                    if(store.has(key)){
                        connection.write(":1\r\n");
                        break;
                    }else{
                        connection.write(":0\r\n");
                        break;                        
                    }
                }

                case "TTL": {
                    const key = reply[1];

                    if (!store.has(key)) {
                        connection.write(":-2\r\n");
                        break;
                    }

                    if (!expiry.has(key)) {
                        connection.write(":-1\r\n");
                        break;
                    }

                    if (expiry.get(key) <= Date.now()) {
                        store.delete(key);
                        expiry.delete(key);
                        connection.write(":-2\r\n");
                        break;
                    }

                    const remainingTime = Math.ceil((expiry.get(key) - Date.now()) / 1000);
                    connection.write(`:${remainingTime}\r\n`);
                    break;
                }
                case "FLUSHALL":{
                    store.clear();
                    expiry.clear();
                    connection.write("+OK\r\n");
                }

                case "LPUSH":{
                    const key = reply[1];
                    const list = lists.get(key)??[];
                    for(let i=2;i<reply.length;i++){
                        list.unshift(reply[i]);
                    }
                    lists.set(key,list);
                    connection.write(`:${list.length}\r\n`);
                    break;
                }
                case"LPOP":{
                    const key = reply[1];
                    const list = lists.get(key);
                    if(list){
                        const removedEle = list.shift();
                        connection.write(`$${removedEle.length}\r\n${removedEle}\r\n`);
                        break;
                    }
                    else{
                        connection.write("$-1\r\n")
                        break;
                    }
                }

                case "RPUSH":{
                    const key = reply[1];
                    const list = lists.get(key)??[];
                    for(let i=2;i<reply.length;i++){
                        list.push(reply[i]);
                    }
                    lists.set(key,list);
                    connection.write(`:${list.length}\r\n`);
                    break;

                }
                case"RPOP":{
                    const key = reply[1];
                    const list = lists.get(key);
                    if(list){
                        const removedEle = list.pop();
                        connection.write(`$${removedEle.length}\r\n${removedEle}\r\n`);
                        break;
                    }
                    else{
                        connection.write("$-1\r\n")
                        break;
                    }
                }

                default: {

                    connection.write(
                        "-ERR unknown command\r\n"
                    );
                }
            }
        },

        returnError: (err) => {
            connection.write(
                `-ERR ${err.message}\r\n`
            );
        }
    });

    connection.on("data", (data) => {
        parser.execute(data);
    });

    connection.on("end", () => {
        console.log("Client disconnected");
    });

    connection.on("error", (err) => {
        console.log(err.message);
    });

});


setInterval(()=>{
    for(const [key,exp] of expiry.entries()){
        if(exp<=Date.now()) {
            expiry.delete(key);
            store.delete(key);
        }
    }
},1000)

server.listen(7379, () => {
    console.log("Redis clone running on port 7379");
});