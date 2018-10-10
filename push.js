const line = require('@line/bot-sdk');

const client = new line.Client({
	  channelAccessToken: 'w0Mw/03wtGD6+DURpawqo5SqyYz5twdRU+oTkOwi7tj8ovkqyiT+eJ6CJr2Fm+aWl06s/9fbmK4vqQVaeQEafrF5ycawfny/Mcd26mkhEl3MQw8j2M+qw0n6jzNrelYoCNsO0W5bdqxAyqJcAE2ShgdB04t89/1O/w1cDnyilFU='
});

const message = {
	  type: 'text',
		text: 'Hello World!'
};

client.pushMessage('U7b0a62f0316ec305801f695e4abe9a45', message)
  .then(() => {})
	.catch((err) => {});
