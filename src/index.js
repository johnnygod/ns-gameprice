const line = require('@line/bot-sdk')
import express from 'express'
import Promise from 'bluebird'
import checkPrice from './checkPrice'
import getExchangeRate from './getExchangeRate2'
import ccMapping from './country-currency-mapping'

const config = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET,
}

const client = new line.Client(config)

const app = express()

const handleEvent = (event) => {
	// if (event.type !== 'message' || event.message.type !== 'text') {
	//     // ignore non-text-message event
	//     return Promise.resolve(null);
 //  	}

	  // create a echoing text message
	  // const echo = { type: 'text', text: event.message.text };

	  // use reply API
	  // return client.replyMessage(event.replyToken, echo);

	if(event.type === 'message'){
		if(event.message.type !== 'text')
			return Promise.resolve(null)

		const txt = event.message.text
	  	const userId = event.source.userId

	  	console.log(txt, userId, /^\$/.test(txt))

	  	// return client.pushMessage(userId, {type: 'text', text: txt})

	  	if(!/^\$/.test(txt))
	  		return Promise.resolve(null)

	  	const showAll = /-al{1,2}(\s|$)/.test(txt)
		const game2search = showAll ? txt.replace(/^\$/, '').replace(/-al{1,2}(\s|$)/, '') : txt.replace(/^\$/, '')
		  
		return checkPrice(game2search.trim())
				.then(gameDatas => {
					if(gameDatas.length == 0)
						return client.replyMessage(event.replyToken, {type: 'text', text: '查無此遊戲資料!'});

					const top5Games = gameDatas.slice(0, 5)
					return Promise.map(top5Games, gameData => {
						return Promise.all(Object.keys(gameData.price).map(key => {
							const price = gameData.price[key], mapping = ccMapping[key]
				
							if(mapping == null){
								console.log(`can't find currency for ${key}`)
								return Promise.resolve(null)
							}
				
							return getExchangeRate(mapping.currency, price)
						}))		
					})
					.then(priceTWArrByGame => {
						top5Games.forEach((item, idx) => {
							const {title, price} = item, priceTWArr = priceTWArrByGame[idx]
				
							const keys_price = Object.keys(price)

							let allListMsg = ''
							const bestPrice = priceTWArr.reduce((acc, cur, pidx) => {
								const key_price = keys_price[pidx], mapping = ccMapping[key_price]
								const country = mapping.name, currency = mapping.currency

								if(cur != null)
									allListMsg += `販售地區: ${country}\n價格: ${currency} ${price[key_price]} (台幣約${cur})\n`													

								if(cur == null || (acc != null && acc.priceTW < cur)){
									return acc
								}
				
								return {price: price[key_price], priceTW: cur, country, currency}
							}, null)

							const {price: price_best, priceTW, country, currency} = bestPrice
				
							let text = `遊戲名稱: ${title}\n最佳價格: ${currency} ${price_best} (台幣約${priceTW})`
							if(showAll)
								text += `\n\n全區價格:\n${allListMsg}`
							
							client.replyMessage(event.replyToken, msgs)
						})

						return
					})
				})
				.catch(err => {
					console.log(err)
					return Promise.resolve(null)
				})
	}
	//handle show all price
	else if(event.type === 'postback'){
		const {replyToken, postback:{data}} = event

		return client.replyMessage(replyToken, {type: 'text', text: data})
	}
	else
		return Promise.resolve(null)
  	
}

app.post('/callback', line.middleware(config), (req, res) => {
	Promise.all(req.body.events.map(handleEvent))
			.then(result => res.json(result))
			.catch(err => {
				console.log(err)
				res.end()
			})
})

const port = process.env.PORT || 3000

app.listen(port, () => {
	console.log(`listening on port:${port}`)
})
