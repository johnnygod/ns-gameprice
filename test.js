var checkPrice = require('./dist/checkPrice').default
var getExchangeRate = require('./dist/getExchangeRate').default
var ccMapping = require('./dist/country-currency-mapping').default
var Promise = require('bluebird')


Promise.all([
	checkPrice('ss'),
	getExchangeRate(),
])
.then(results => {
	const gameData = results[0], rateInfos = results[1]

	gameData.forEach(item => {
		const {title, price} = item

		let bestPrice
		const msg = Object.keys(price).map(key => {
			const mapping = ccMapping[key]

			if(mapping == null)
				return `can't find currency for ${key}`

			const rInfo = rateInfos.find(item => item.currency == mapping.currency )

			const priceTW = rInfo == null || rInfo.cashSell == null ? null : (price[key] * rInfo.cashSell).toFixed(0)

			const exchangeMsg = priceTW == null ? '' : `-> NTD: ${price[key] * rInfo.cashSell}`

			const country = mapping.name, currency = mapping.currency

			if(priceTW != null && (bestPrice == null || bestPrice.priceTW > priceTW))
				bestPrice = {price: price[key], priceTW, country, currency}

			return `${country}: ${price[key]} (${currency}) ${exchangeMsg}`
		})

		console.log(`best price for "${title}" is: ${bestPrice.currency} ${bestPrice.price} (NTD:${bestPrice.priceTW})\n`)
		console.log(`price list: \n${msg.join('\n')}`)
		console.log(`\n---------------------------------\n`)
	})
})