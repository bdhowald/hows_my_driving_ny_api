import PriorityQueue from './priorityQueue'

describe('PriorityQueue', () => {
  it('should instantiate a new priority queue with a supplied concurrency', () => {
    const priorityQueue = new PriorityQueue(5)

    expect(priorityQueue.pending).toBe(0)
  })

  it('should enqueue and dequeue tasks', async () => {
    const priorityQueue = new PriorityQueue(5)

    const answerToLifeUniverseAndEverything = 42

    const newTask = () => Promise.resolve(answerToLifeUniverseAndEverything)
    const result = await priorityQueue.add(newTask, 0)

    expect(result).toBe(answerToLifeUniverseAndEverything)
  })

  it('should prioritize tasks based on given priority', async () => {
    const priorityQueue = new PriorityQueue(1)
    const executionOrder: string[] = []

    // The purpose of this task is simply to ensure none of the others
    // are dequeued before they can be sorted by priority.
    const blockingTask = async () => {
      await new Promise(res => setTimeout(res, 1000))
    }

    const lowPriorityTask = async () => {
      executionOrder.push('low')
    }
    const mediumPriorityTask = async () => {
      executionOrder.push('medium')
    }
    const highPriorityTask = async () => {
      executionOrder.push('high')
    }

    const promises = [
      priorityQueue.add(blockingTask, 0),
      priorityQueue.add(lowPriorityTask, 0),
      priorityQueue.add(mediumPriorityTask, 5),
      priorityQueue.add(highPriorityTask, 10),
    ]

    await Promise.all(promises)

    expect(executionOrder).toEqual(['high', 'medium', 'low'])
  })
})