import { isMainThread } from 'node:worker_threads'

import { SERVER_PORT } from 'constants/endpoints'
import createServer from 'services/server'

const server = createServer()

interface DiagnosticReport {
  workers: DiagnosticReport[]
  javascriptHeap: {
    usedMemory: number
  }
}

console.log(`isMainThread: ${isMainThread}`)

if (isMainThread) {
  const timer = setInterval(() => {
    const processReport = process.report
    const diagnosticReport = processReport.getReport() as DiagnosticReport

    console.log('Memory diagnostics', {
      time: new Date().toISOString(),
      rssMiB: Math.round(process.memoryUsage.rss() / 1024 / 1024),
      workerCount: diagnosticReport.workers.length,
      workerHeapMiB: diagnosticReport.workers.map(worker =>
        Math.round(worker.javascriptHeap.usedMemory / 1024 / 1024)
      )
    })
  }, 60_000)

  timer.unref()
}

server.listen(SERVER_PORT)
