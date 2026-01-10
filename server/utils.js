const { store } = require("./datastructures");

const timeouts = {};

function setCache(key, value, ttlInSeconds) {
  store[key] = value;
  console.log(`[💨 CACHE SET] key="${key}" TTL=${ttlInSeconds}s`);

  if (timeouts[key]) clearTimeout(timeouts[key]);

  timeouts[key] = setTimeout(() => {
    delete store[key];
    delete timeouts[key];
    console.log(`[⌛ CACHE EXPIRED] key="${key}" has been removed from cache`);
  }, ttlInSeconds * 1000);
}

module.exports = { setCache };
