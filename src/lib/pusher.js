let pusherClient = null

export function getPusherClient() {
  if (pusherClient) return pusherClient
  const key = import.meta.env.VITE_PUSHER_KEY
  if (!key) {
    console.info('Pusher key not set. Using polling only.')
    return null
  }
  import('pusher-js').then(({ default: Pusher }) => {
    pusherClient = new Pusher(key, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'eu',
    })
  })
  return null
}

export function subscribeToRoom(roomId, onUpdate) {
  const client = getPusherClient()
  if (!client) return null
  const channel = client.subscribe(`game-${roomId}`)
  channel.bind('state-update', onUpdate)
  return () => {
    channel.unbind('state-update', onUpdate)
    client.unsubscribe(`game-${roomId}`)
  }
}
