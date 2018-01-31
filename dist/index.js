'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _checkPrice = require('./checkPrice');

var _checkPrice2 = _interopRequireDefault(_checkPrice);

var _getExchangeRate = require('./getExchangeRate2');

var _getExchangeRate2 = _interopRequireDefault(_getExchangeRate);

var _countryCurrencyMapping = require('./country-currency-mapping');

var _countryCurrencyMapping2 = _interopRequireDefault(_countryCurrencyMapping);

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

		console.log(txt, userId, /^\$/.test(txt));

		// return client.pushMessage(userId, {type: 'text', text: txt})

		if (!/^\$/.test(txt)) return _bluebird2.default.resolve(null);

		const showAll = /-al{1,2}(\s|$)/.test(txt);
		const game2search = showAll ? txt.replace(/^\$/, '').replace(/-al{1,2}(\s|$)/, '') : txt.replace(/^\$/, '');

		return (0, _checkPrice2.default)(game2search.trim()).then(gameDatas => {
			if (gameDatas.length == 0) return client.replyMessage(event.replyToken, { type: 'text', text: '查無此遊戲資料!' });

			const top5Games = gameDatas.slice(0, 5);
			return _bluebird2.default.map(top5Games, gameData => {
				return _bluebird2.default.all(Object.keys(gameData.price).map(key => {
					const price = gameData.price[key],
					      mapping = _countryCurrencyMapping2.default[key];

					if (mapping == null) {
						console.log(`can't find currency for ${key}`);
						return _bluebird2.default.resolve(null);
					}

					return (0, _getExchangeRate2.default)(mapping.currency, price);
				}));
			}).then(priceTWArrByGame => {
				const msgs = top5Games.map((item, idx) => {
					const { title, price } = item,
					      priceTWArr = priceTWArrByGame[idx];

					const keys_price = Object.keys(price);

					let allListMsg = '';
					const bestPrice = priceTWArr.reduce((acc, cur, pidx) => {
						const key_price = keys_price[pidx],
						      mapping = _countryCurrencyMapping2.default[key_price];
						const country = mapping.name,
						      currency = mapping.currency;

						if (cur != null) allListMsg += `販售地區: ${country}\n價格: ${currency} ${price[key_price]} (台幣約${cur})\n`;

						if (cur == null || acc != null && acc.priceTW < cur) {
							return acc;
						}

						return { price: price[key_price], priceTW: cur, country, currency };
					}, null);

					const { price: price_best, priceTW, country, currency } = bestPrice;

					let text = `遊戲名稱: ${title}\n最佳價格: ${currency} ${price_best} (台幣約${priceTW})`;
					if (showAll) text += `\n\n全區價格:\n${allListMsg}`;

					return { type: 'text', text: event.message.text };
				});

				return client.replyMessage(event.replyToken, msgs);
			});
		}).catch(err => {
			console.log(err);
			return _bluebird2.default.resolve(null);
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