const { formatBigNumber } = require('./format')
const { sendTelegramMessage } = require('./notifier')
const dotenv = require('dotenv')
const path = require('path')

const envFile = !process.env.NODE_ENV ? '.env' : `.env.${process.env.NODE_ENV}`
dotenv.config({ path: path.resolve(__dirname, envFile) })

const WebSocket = require('ws')

const EXPLORER_URL = process.env.EXPLORER_URL

const CHART = [
    {
        provider: 'GeckoTerminal',
        url: 'https://www.geckoterminal.com/solana/pools',
        type: 'pool',
    },

]
const main = async () => {
    // Connect through the WebSocket proxy with authentication
    const apiKey = process.env.TXDECODER_API_KEY
    const proxyUrl = process.env.TXDECODER_WSS
    const ws = new WebSocket(proxyUrl, { headers: { 'x-api-key': apiKey }, rejectUnauthorized: false })

    ws.on('open', () => {
        console.log('Connected to TxDecoder WebSocket server')

        // Send the DEX message after connection is established
        const message = {
            type: 'DEX',
            action: 'migrate',
        }
        ws.send(JSON.stringify(message))
        console.log('Sent message:', message)
    })

    ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        process.exit(1)
      })
    
      ws.on('close', (code, reason) => {
        console.log(`Connection closed. Code: ${code}, Reason: ${reason}`)
        process.exit(0)
      })
    ws.on('message', (data) => {
        const message = JSON.parse(data)
        if (message.error) {
            console.error('Error:', message.message)
            process.exit(1)
        }
        // Receive message from WebSocket, format is an object of User Actions
        // https://txdecoder.gitbook.io/docs/data-schema/user-action
        // {
        //     [transaction_hash_1]: [
        //         // List of user actions in transaction 1
        //     ],
        //     [transaction_hash_2]: [
        //         // List of user actions in transaction 2
        //     ]
        // }

        for (const txHash in message) {
            const userActions = message[txHash]
            if (!Array.isArray(userActions)) continue
            for (const action of userActions) {
                const chartInfo = `📈 View on ` + CHART.map(item => `<a href="${item.url}/${ item.type === 'pool' ? action.pool_id : action.tokens[0].address}">${item.provider}</a>`).join(' | ')
                const msg = `🚨 New Meme Coin Graduated\n\n` +
                `Token: <code>${action.tokens[0].address}</code>\n\n` +
                `Source: ${action.source}\n\n` +
                `Chart: ${chartInfo}\n` +
                `\n\n⚠️ DYOR — High risk\n` +
                `\n🔍 @txdecoder only decodes on-chain transactions and does not create, issue, or endorse tokens`
                sendTelegramMessage(msg, true)
            }
        }
    })

}

main().catch(console.error)
