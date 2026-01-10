class Node {
  constructor(key, value, expireAt = null) {
    this.key = key
    this.value = value
    this.expireAt = expireAt
    this.next = null
    this.prev = null
  }
}

class LRUCache {
  constructor(capacity = 20) {
    this.capacity = capacity
    this.size = 0
    this.map = new Map()

    this.head = new Node(null, null)
    this.tail = new Node(null, null)
    this.head.next = this.tail
    this.tail.prev = this.head

    this.cleanupTimer = null
  }


  _deleteNode(node) {
    node.prev.next = node.next
    node.next.prev = node.prev
    node.next = node.prev = null
  }

  _addToHead(node) {
    node.next = this.head.next
    node.prev = this.head
    this.head.next.prev = node
    this.head.next = node
  }

  _isExpired(node) {
    return node.expireAt !== null && Date.now() > node.expireAt
  }


  get(key) {
    const node = this.map.get(key)
    if (!node) return -1

    if (this._isExpired(node)) {
      this._deleteNode(node)
      this.map.delete(key)
      this.size--
      return -1
    }

    this._deleteNode(node)
    this._addToHead(node)
    return node.value
  }

  put(key, value, ttl = null) {
    if (this.map.has(key)) {
      const node = this.map.get(key)
      node.value = value
      node.expireAt = ttl ? Date.now() + ttl * 1000 : null
      this._deleteNode(node)
      this._addToHead(node)
      return
    }

    if (this.size === this.capacity) {
      const lru = this.tail.prev
      this._deleteNode(lru)
      this.map.delete(lru.key)
      this.size--
    }

    const expireAt = ttl ? Date.now() + ttl * 1000 : null
    const newNode = new Node(key, value, expireAt)

    this._addToHead(newNode)
    this.map.set(key, newNode)
    this.size++
  }

  flush(key) {
    const node = this.map.get(key)
    if (!node) return false

    this._deleteNode(node)
    this.map.delete(key)
    this.size--
    return true
  }

  flushAll() {
    this.map.clear()
    this.head.next = this.tail
    this.tail.prev = this.head
    this.size = 0
  }

  getAll() {
    const result = []
    let curr = this.head.next

    while (curr !== this.tail) {
      result.push({
        key: curr.key,
        value: curr.value,
        ttlRemaining: curr.expireAt
          ? Math.max(0, Math.floor((curr.expireAt - Date.now()) / 1000))
          : null
      })
      curr = curr.next
    }

    return result
  }

  startCleanup(intervalMs = 60000) {
    if (this.cleanupTimer) return

    this.cleanupTimer = setInterval(() => {
      let curr = this.tail.prev
      while (curr !== this.head) {
        const prev = curr.prev
        if (this._isExpired(curr)) {
          this._deleteNode(curr)
          this.map.delete(curr.key)
          this.size--
        }
        curr = prev
      }
    }, intervalMs)
  }

  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}

module.exports = { LRUCache }



module.exports = {
    LRUCache,
    list
};
