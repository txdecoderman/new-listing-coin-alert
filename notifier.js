const { default: axios } = require('axios')
const dotenv = require('dotenv')
const path = require('path')

const envFile = !process.env.NODE_ENV ? '.env' : `.env.${process.env.NODE_ENV}`
dotenv.config({ path: path.resolve(__dirname, envFile) })


const token = process.env.TELEGRAM_BOT_TOKEN
const target = process.env.TELEGRAM_CHAT_ID
const url = `https://api.telegram.org/bot${token}/sendMessage`

const sendTelegramMessage = async (msg, isHtmlMode = false) => {
    const data = {
        chat_id: target,
        text: msg,
    }
    if (isHtmlMode) {
        data.parse_mode = 'html'
        data.disable_web_page_preview = true
    }
    const options = {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data,
        url,
    }
    console.log('Sending message:', data)
    return await axios(options)
}

module.exports = {
    sendTelegramMessage,
}