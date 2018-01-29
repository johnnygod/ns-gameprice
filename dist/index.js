'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const line = require('@line/bot-sdk');


const config = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);

const app = (0, _express2.default)();

const handleEvent = event => {
	// if (event.type !== 'message' || event.message.type !== 'text') {
	//     // ignore non-text-message event
	//     return Promise.resolve(null);
	//  	}

	// create a echoing text message
	// const echo = { type: 'text', text: event.message.text };

	// use reply API
	// return client.replyMessage(event.replyToken, echo);

	if (event.type === 'message') {
		if (event.message.type !== 'text') return _bluebird2.default.resolve(null);

		const txt = event.message.text;
		const userId = event.source.userId;

		if (!/^$/.test(txt)) return _bluebird2.default.resolve(null);

		return _bluebird2.default.all([checkPrice('ss'), getExchangeRate()]).then(results => {
			const gameData = results[0],
			      rateInfos = results[1];

			if (gameData.length == 0) return client.replyMessage(event.replyToken, { type: 'text', text: '查無此遊戲資料!' });

			gameData.forEach(item => {
				const { title, price, images: { cover }, url } = item;

				let allListMsg = '';
				const bestPrice = Object.keys(price).reduce((acc, key) => {
					const mapping = ccMapping[key];

					if (mapping == null) return `can't find currency for ${key}`;

					const rInfo = rateInfos.find(item => item.currency == mapping.currency);

					const priceTW = rInfo == null || rInfo.cashSell == null ? null : (price[key] * rInfo.cashSell).toFixed(0);

					const exchangeMsg = priceTW == null ? '' : `-> NTD: ${price[key] * rInfo.cashSell}`;

					const country = mapping.name,
					      currency = mapping.currency;

					allListMsg += `販售地區: ${country}\n價格: ${currency} ${price} (台幣約${priceTW})\n`;

					if (priceTW != null && (acc == null || acc.priceTW > priceTW)) return { price: price[key], priceTW, country, currency };else return acc;
				}, null);

				const { price: price_best, priceTW, country, currency } = bestPrice;

				client.pushMessage(userId, {
					type: 'template',
					altText: '查詢結果',
					template: {
						type: 'buttons',
						thumbnailImageUrl: cover,
						text: `遊戲名稱: ${title}\n最佳價格: ${currency} ${price_best} (台幣約${priceTW})`,
						actions: [{
							type: 'uri',
							label: '查看遊戲介紹',
							uri: url
						}, {
							type: 'postback',
							label: '查看所有價格',
							data: allListMsg
						}]
					}
				});
			});
		});
	}
	//handle show all price
	else if (event.type === 'postback') {
			const { replyToken, postback: { data } } = event;

			return client.replyMessage(replyToken, { type: 'text', text: data });
		} else return _bluebird2.default.resolve(null);
};

app.post('/callback', line.middleware(config), (req, res) => {
	_bluebird2.default.all(req.body.events.map(handleEvent)).then(result => res.json(result)).catch(err => {
		console.log(err);
		res.end();
	});
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`listening on port:${port}`);
});