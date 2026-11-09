import pLimit from 'p-limit'

type QueueTask<T = unknown> = {
  asyncFunction: () => Promise<T>
  priority: number
  reject: (reason?: unknown) => void
  resolve: (value: T | PromiseLike<T>) => void
}

/**
 * Priority queue built on top of p-limit
 */
class PriorityQueue {
  private active: number
  private readonly concurrency: number
  private readonly limit: pLimit.Limit
  private readonly queue: QueueTask<unknown>[]

  constructor(concurrency = 5) {
    console.log('requested concurrency:', concurrency)
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
      const task: QueueTask<unknown> = {
        asyncFunction: asyncFunction as () => Promise<unknown>,
        priority,
        resolve: resolve as (value: unknown | PromiseLike<unknown>) => void,
        reject: reject as (reason?: unknown) => void,
      }

      this.queue.push(task)

      // sort in ascending order of priority
      this.queue.sort((a, b) => b.priority - a.priority)
      this._dequeue()
    })
  }

  /**
   * Get the number of pending requests in the queue
   */
  get pending(): number {
    return this.queue.length
  }

  /**
   * Dequeue requests from the queue and execute them until empty
   */
  private async _dequeue() {
    console.log('active tasks:', this.active)
    if (this.active >= this.concurrency || this.queue.length === 0) {
      if (this.active >= this.concurrency) {
        console.log('active tasks meet or exceed concurrency limit')
      } else if (this.queue.length === 0) {
        console.log('queue is empty')
      }
      return
    }

    console.log('active tasks below concurrency limit')

    const dequeuedTask = this.queue.shift() as QueueTask
    this.active += 1

    try {
      const result = await this.limit(() => dequeuedTask.asyncFunction())
      console.log('task complete')
      dequeuedTask.resolve(result)
    } catch (error) {
      console.log('task errored')
      dequeuedTask.reject(error)
    } finally {
      console.log('returning concurrency lock')
      this.active -= 1
      this._dequeue()
    }
  }
}

export default PriorityQueue
