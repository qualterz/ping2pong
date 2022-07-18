import Hyperswarm from 'hyperswarm'

import random from 'random'

import timers from 'node:timers'

const asHexString = (buffer) => buffer.toString('hex');

const swarm = new Hyperswarm()
swarm.listen()

const localPeerName = asHexString(swarm.keyPair.publicKey)

console.log(`Started local peer: ${localPeerName}`)

swarm.on('connection', (connection) => {
    const remotePeerName = asHexString(connection.remotePublicKey)

    console.log(`Connected to peer ${remotePeerName}`)
    console.log(`${swarm.connections.size} peers are connected`)

    const pingTimer = setInterval(() => {
        console.log(`Sending ping to peer ${remotePeerName}`)
        new Promise(executor => setTimeout(executor, random.integer(3000, 24000)))
            .then(() => connection.write('ping'))
    }, 5000)

    connection.on('data', data => {
        const message = data.toString()

        if (message === 'ping') {
            console.log(`Received ping from peer ${remotePeerName}`)

            connection.write('pong')

            console.log(`Sent pong to peer ${remotePeerName}`)

        } else if (message === 'pong') {
            console.log(`Received pong from peer ${remotePeerName}`)
        } else {
            console.error(`Received invalid message: ${message}`)
        }
    })

    connection.on('error', () => {
        console.log(`Disconnecting from peer ${remotePeerName}`)

        timers.clearInterval(pingTimer)
        connection.destroy()

        console.log(`${swarm.connections.size - 1} peers remaining`)
    })
})

const topic = Buffer.alloc(32).fill(1337)
const discovery = swarm.join(topic)
await discovery.flushed()