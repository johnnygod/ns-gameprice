'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var line = require('@line/bot-sdk');


var config = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET
};

var client = new line.Client(config);

var app = (0, _express2.default)();

var handleEvent = function handleEvent(event) {
	console.log(event);

	if (event.type !== 'message' || event.message.type !== 'text') {
		// ignore non-text-message event
		return _bluebird2.default.resolve(null);
	}

	// create a echoing text message
	var echo = { type: 'text', text: event.message.text };

	// use reply API
	return client.replyMessage(event.replyToken, echo);
};

app.post('/callback', line.middleware(config), function (req, res) {
	_bluebird2.default.all(req.body.events.map(handleEvent)).then(function (result) {
		console.log(result);
		res.end();
	}).catch(function (err) {
		console.log(err);
		res.status(500).end();
	});
});

var port = process.env.PORT || 3000;

app.listen(port, function () {
	console.log('listening on port:' + port);
});
