import superagent from 'superagent'
import cheerio from 'cheerio'
import Promise from 'bluebird'

const targetUrl = 'http://rate.bot.com.tw/xrt?Lang=en-US'

const getExchangeRateData = () => {
	return new Promise((resolve, reject) => {
		superagent.get(targetUrl).end((err, res) => {
			if(err){
				throw Error(err)
				reject(err)
			}

			let $ = cheerio.load(res.text)

			const exchangeRateData = []

			$('.table.table-striped.table-bordered.table-condensed.table-hover tbody tr').each(function(i, elem){
				const _t = $(this)
				
				let info = {}

				_t.find('td').filter(i => i < 5).each(function(i, elem){
					const _td = $(this)

					let value
					switch(i){
						case 0:{					
							const currency = _td.children().first().children().eq(3).text()
							const reg = /\((\w*)\)/.exec(currency)
							if(reg)
								info.currency = reg[1]
							break
						}
						case 1:{
							info.cashBuy = _td.text() == '-' ? null : _td.text()
							break
						}
						case 2:{
							info.cashSell = _td.text() == '-' ? null : _td.text()
							break
						}
						case 3:{
							info.buy = _td.text() == '-' ? null : _td.text()
							break
						}
						case 4:{
							info.sell = _td.text() == '-' ? null : _td.text()
							break
						}
						default:
							break
					}
				})

				exchangeRateData.push(info)
			})

			resolve(exchangeRateData)
		})
	})
}

export default getExchangeRateData