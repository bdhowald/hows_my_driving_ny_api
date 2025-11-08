import pLimit from 'p-limit'

type QueueTask = {
  asyncFunction: () => Promise<any>
  priority: number
  reject: (reason?: any) => void
  resolve: (value: any | PromiseLike<any>) => void
}

/**
 * Priority queue built on top of p-limit
 */
class PriorityQueue {
  private active: number
  private readonly concurrency: number
  private readonly limit: pLimit.Limit
  private readonly queue: QueueTask[]

  constructor(concurrency = 5) {
    this.active = 0
    this.concurrency = concurrency
    this.limit = pLimit(concurrency)
    this.queue = []
  }

  /**
   * Add a new async function with priority to the queue and attempt to run it.
   */
  add<T>(asyncFunction: () => Promise<T>, priority: number = 0): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ asyncFunction, priority, resolve, reject })
      // sort in ascending order of priority
      this.queue.sort((a, b) => b.priority - a.priority)
      this._dequeue()
    })
  }

  /**
   * Get the number of pending requests in the queue
   */
  get pending(): number {
    return this.queue.length;
  }

  /**
   * Dequeue requests from the queue and execute them until empty
   */
  private async _dequeue() {
    if (this.active >= this.concurrency || this.queue.length === 0) {
      return
    }

    const dequeuedTask = this.queue.shift() as QueueTask
    this.active += 1

    try {
      const result = await this.limit(() => dequeuedTask.asyncFunction())
      dequeuedTask.resolve(result)
    } catch(error) {
      dequeuedTask.reject(error)
    } finally {
      this.active -= 1
      this._dequeue()
    }
  }
}

export default PriorityQueue
