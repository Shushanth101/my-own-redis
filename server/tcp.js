const net = require("net");
const Parser = require("redis-parser");

const store = new Map();
const expiry = new Map()

const server = net.createServer((connection) => {

    console.log("Client connected");


    const parser = new Parser({

        returnReply: (reply) => {

            const command = reply[0].toUpperCase();

            switch(command) {

                case "SET": {

                    const key = reply[1];
                    const value = reply[2];
                    const expiration = reply[3]?Date.now()+reply[3]:undefined;

                    store.set(key, value);
                    if(expiration) expiry.set(key,expiration);

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

server.listen(7379, () => {
    console.log("Redis clone running on port 7379");
});