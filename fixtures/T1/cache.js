const cache = new Map();
function getUser(id) {
  if (!cache.has(id)) {
    cache.set(id, db.findUser(id));
  }
  return cache.get(id);
}
