import superagent from 'superagent'
import cheerio from 'cheerio'
import Promise from 'bluebird'

const baseUrl = `https://finance.google.com.cn/finance/converter?a=[price]&from=[currency]&to=TWD`

const getExchangeRateData = (currency, price) => {
    const url = baseUrl.replace(/\[currency\]/, currency).replace(/\[price\]/, price)
	return new Promise((resolve, reject) => {
		superagent.get(url).end((err, res) => {
			if(err){
				throw Error(err)
				reject(err)
			}

			let $ = cheerio.load(res.text)
			
			const price_tw = +/(\d+\.\d+)/.exec($('#currency_converter_result span.bld').text())[1]

			resolve(price_tw)
		})
	})
}

export default getExchangeRateData