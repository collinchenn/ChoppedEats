import { NextRequest } from 'next/server'
import { eventStreams } from '@/lib/party-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params

  let controllerRef: ReadableStreamDefaultController | null = null

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller
      
      // Add this connection to the party's event stream
      if (!eventStreams.has(code)) {
        eventStreams.set(code, new Set())
      }
      eventStreams.get(code)!.add(controller)

      // Send initial connection message
      const message = `data: ${JSON.stringify({ type: 'connected' })}\n\n`
      controller.enqueue(new TextEncoder().encode(message))

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        const streams = eventStreams.get(code)
        if (streams && controllerRef) {
          streams.delete(controllerRef)
          if (streams.size === 0) {
            eventStreams.delete(code)
          }
        }
      })
    },
    cancel() {
      // Clean up when client disconnects
      const streams = eventStreams.get(code)
      if (streams && controllerRef) {
        streams.delete(controllerRef)
        if (streams.size === 0) {
          eventStreams.delete(code)
        }
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

