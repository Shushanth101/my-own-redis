const express = require("express");
const mongoose = require("mongoose");
const { LRUCache, list } = require("./datastructures");
const KVP = require("./models/model");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors())


mongoose
  .connect("mongodb://127.0.0.1:27017/memorystore")
  .then(() => console.log("[✅] Connected to MongoDB"))
  .catch((err) => console.error("[❌] MongoDB connection error:", err));


const cache = new LRUCache(20); 
const stats = {
  cacheHits: 0,
  dbLookups: 0,
};
cache.startCleanup(60000); 


app.post("/put", async (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined)
    return res.status(400).send("Key and value required");

  cache.put(key, value); 
  await KVP.findOneAndUpdate({ key }, { value }, { upsert: true });

  res.send({ message: "Added to cache and DB", key, value });
});

app.post("/cache", (req, res) => {
  const { key, value, ttl } = req.body;
  if (!key || value === undefined || !ttl)
    return res
      .status(400)
      .send("Key, value and ttl (in seconds) are required");

  cache.put(key, value, ttl);
  res.send({ message: "Added to cache (temporary)", key, value, ttl });
});


app.get("/get/:key", async (req, res) => {
  const key = req.params.key;
  const cachedValue = cache.get(key);

  if (cachedValue !== -1) {
    stats.cacheHits++;
    return res.send({ source: "cache", key, value: cachedValue });
  }

  stats.dbLookups++;
  const kvp = await KVP.findOne({ key });

  if (!kvp) return res.status(404).send({ message: "Key not found" });

  cache.put(key, kvp.value);
  res.send({ source: "database", key, value: kvp.value });
});

app.get("/getall", (req, res) => {
  res.send({ cache: cache.getAll() });
});


app.delete("/flush/:key", (req, res) => {
  const key = req.params.key;
  if (!cache.map.has(key))
    return res.status(404).send({ message: "Key not found in cache" });

  cache.flush(key);
  res.send({ message: `Flushed key '${key}' from cache` });
});

app.delete("/flush-all", (req, res) => {
  cache.flushAll();
  stats.cacheHits = 0;
  stats.dbLookups = 0;
  res.send({ message: "All cache entries flushed", cacheSize: 0 });
});


app.post("/lpush", (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).send("Value required");
  list.unshift(value);
  res.send({ message: "Value pushed to left", list });
});

app.post("/rpush", (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).send("Value required");
  list.push(value);
  res.send({ message: "Value pushed to right", list });
});

app.delete("/lpop", (req, res) => {
  if (list.length === 0) return res.status(404).send({ message: "List empty" });
  const value = list.shift();
  res.send({ message: "Removed from left", value, list });
});

app.delete("/rpop", (req, res) => {
  if (list.length === 0) return res.status(404).send({ message: "List empty" });
  const value = list.pop();
  res.send({ message: "Removed from right", value, list });
});

app.get("/lget", (req, res) => {
  res.send({ list });
});


app.get("/stats", (req, res) => {
  res.send({
    cacheCapacity: cache.capacity,
    cacheSize: cache.map.size,
    cacheHits: stats.cacheHits,
    dbLookups: stats.dbLookups,
  });
});


const PORT = 3000;
app.listen(PORT, () =>
  console.log(`[✅] Server running at http://localhost:${PORT}`)
);

