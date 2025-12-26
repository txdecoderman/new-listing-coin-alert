const { formatBigNumber } = require('./format')
const { sendTelegramMessage } = require('./notifier')
const dotenv = require('dotenv')
const path = require('path')

const envFile = !process.env.NODE_ENV ? '.env' : `.env.${process.env.NODE_ENV}`
dotenv.config({ path: path.resolve(__dirname, envFile) })

const WebSocket = require('ws')

const EXPLORER_URL = process.env.EXPLORER_URL


const main = async () => {
    // Connect through the WebSocket proxy with authentication
    const apiKey = process.env.TXDECODER_API_KEY
    const proxyUrl = process.env.TXDECODER_WSS
    const ws = new WebSocket(proxyUrl, { headers: { 'x-api-key': apiKey }, rejectUnauthorized: false })

   ws.on('open', () => {
    console.log('Connected to TxDecoder WebSocket server')

    // Send the DEX message after connection is established
    
     const message = { type: 'DEX', action: 'pool_initialized'}
     
     ws.send(JSON.stringify(message))
     console.log('Sent message:', message)
  })

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data)
      
        for (const txHash in message) {
            const userActions = message[txHash]
            if (!Array.isArray(userActions)) continue
            for (const userAction of userActions) {
                const { tokens, participants, tx_hash: txHash, action } = userAction
                if (!txHash) continue
                if (action !== 'pool_initialize') continue

                // TODO: process new pool here
                const msg = `New pool initialized on ${userAction?.source}\n` +
                    `Pool Name: ${tokens[0].symbol} - ${tokens[1].symbol}\n` +
                    `Token 0: ${tokens[0].address} \n` +
                    `Token 1: ${tokens[1].address} \n` +
                    `Pool Address: ${userAction.pool_id} \n` +
                    `Liquidity: ${userAction.value_usd} \n` +
                 sendTelegramMessage(msg, true)
            }
        }
        
    } catch (error) {
      console.log('Received raw data:', data.toString())
    }
  })

}

main().catch(console.error)
