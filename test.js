var checkPrice = require('./dist/checkPrice').default
var getExchangeRate = require('./dist/getExchangeRate2').default
var ccMapping = require('./dist/country-currency-mapping').default
var Promise = require('bluebird')

/*
checkPrice('sti')
.then(gameDatas => {
	return Promise.map(gameDatas, gameData => {
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
		gameDatas.forEach((item, idx) => {
			const {title, price} = item, priceTWArr = priceTWArrByGame[idx]

			let bestPriceIdx
			const bestPrice = priceTWArr.reduce((acc, cur, pidx) => {
				if(cur == null || (acc != null && acc < cur))
					return acc

				bestPriceIdx = pidx
				return cur
			}, null)

			const keys_price = Object.keys(price)

			console.log(`best price for "${title}" is (${keys_price[bestPriceIdx]}) ${price[keys_price[bestPriceIdx]]} (almost TWD: ${bestPrice})`)
		})
	})
})

*/

const showAll = true

return checkPrice('ss')
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
					
					// client.replyMessage(event.replyToken, msgs)
					console.log(text)
				})

				return
			})
		})