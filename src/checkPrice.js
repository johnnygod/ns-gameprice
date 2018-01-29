import request from 'superagent'
import cheerio from 'cheerio'
import Promise from 'bluebird'
import getExchangeRateData from './getExchangeRate'

const targetUrl = 'http://eshop-checker.xyz/games.json'

const checkPrice = (gameName) => {
	const reg = new RegExp(gameName, 'i')

	return new Promise((resolve, reject) => {
		request.get(targetUrl).buffer().end((err, res) => {
			if(err){
				throw Error(err)
				reject(err)
			}

			// let $ = cheerio.load(res.text)

			// let results = []

			// console.log($('.item-visible-container').length)

			// $('.item-visible-container').each((i, elem) => {
			// 	const _t = $(this)

			// 	const gname = _t.find('div.item-detail-title a').text()

			// 	console.log(gname, _t.find('div.item-detail-title a').length)

			// 	if(!reg.test(gname))
			// 		return

			// 	const linkContainer = _t.children().first()
			// 	const glink = linkContainer.attr('href')
			// 	const imgUrl = linkContainer.children('img.cover-img').attr('src')
				
			// 	const releaseDate = _t.find('div.item-detail-release').text()

			// 	const region = _t.find('div.item-detail-region').text()

			// 	const priceGroup = /\(([\d\.]+)\s(\w+)\)/.exec(_t.find('div.item-detail-price').text())
			// 	const price = priceGroup[1], currency = priceGroup[2]

			// 	results.push({
			// 		gname, glink, imgUrl, releaseDate, region, price, currency
			// 	})
			// })

			// resolve(results)

			const buf = Buffer.from(res.body)

			const gameData = JSON.parse(buf.toString()).list

			resolve(gameData.filter(item => {
				return reg.test(item.title)
			})) 
		})
	})
}

export default checkPrice

