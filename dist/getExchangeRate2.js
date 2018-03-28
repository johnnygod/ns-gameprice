'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const baseUrl = `https://finance.google.com.cn/finance/converter?a=[price]&from=[currency]&to=TWD`;

const getExchangeRateData = (currency, price) => {
	const url = baseUrl.replace(/\[currency\]/, currency).replace(/\[price\]/, price);
	return new _bluebird2.default((resolve, reject) => {
		_superagent2.default.get(url).end((err, res) => {
			if (err) {
				throw Error(err);
				reject(err);
			}

			let $ = _cheerio2.default.load(res.text);

			const price_tw = +/(\d+\.\d+)/.exec($('#currency_converter_result span.bld').text())[1];

			resolve(price_tw);
		});
	});
};

exports.default = getExchangeRateData;