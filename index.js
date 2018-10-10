process.on('unhandledRejection', console.dir);

const watson = require('watson-developer-cloud');
const admin = require('firebase-admin');
const serviceAccount = require('/app/cert/can-i-granma-firebase-adminsdk-8cnv6-af9c27b17a.json');
const express = require('express');
const request = require('request');
const line = require('@line/bot-sdk');
const rpromise = require('request-promise');
const fs = require('fs');
const bparser = require('body-parser');
require('date-utils');

const PORT = process.env.PORT || 3000;

const app = express();
app.listen(PORT);
console.log(`Server running at ${PORT}`);
app.use('/addreq',bparser.json());

// watson設定
const assistant = new watson.AssistantV1({
   username: 'aadb4a3d-ab32-436b-880f-9227359a8b6d',
   password: '6y6GE7RHC4pm',
   version: '2018-02-16'
});

// firebase設定
admin.initializeApp( {
		credential: admin.credential.cert(serviceAccount),
		databaseURL: 'https://can-i-granma.firebaseio.com'
});
const db = admin.database();
let ref_mw = db.ref('magic_words');
let ref_user = db.ref('line_ids_mago');

// line設定
const config = {
	channelAccessToken:'w0Mw/03wtGD6+DURpawqo5SqyYz5twdRU+oTkOwi7tj8ovkqyiT+eJ6CJr2Fm+aWl06s/9fbmK4vqQVaeQEafrF5ycawfny/Mcd26mkhEl3MQw8j2M+qw0n6jzNrelYoCNsO0W5bdqxAyqJcAE2ShgdB04t89/1O/w1cDnyilFU=',
	channelSecret: 'c846bb734fd1bbde3da1ec90cc3b9943'
};

app.post('/webhook', line.middleware(config), (req,res) => {
	console.log(req.body.events);

	Promise
		.all(req.body.events.map(handleEvent))
		.then((result) => res.json(result));
});

const client = new line.Client(config);

app.post('/addreq', async function(req, res) {
	await addreq(req.body);
});


let user_input;
//返答の登録
async function handleEvent(event) {
  //ユーザ認証
  let lineid = event.source.userId;
  let magicword = "";
  let workspaceId;
  let usersdb;
  await ref_user.onse("value", async function(snapshot) {
    usersdb = snapshot.child(lineid).val();
  });

  if(usersdb==null) {
    magicword = event.message.text;
    await ref_user.child(lineid).set(magicword);
    await ref_mw.child(magicword).update({
      mago_id : lineid
    });
    return client.replyMessage(event.replyToken, {
      type:'text',
      text: `合言葉は${userjson[index].magic_word}だね．用があったら連絡するよ．`
    });
  } else {
    magicword = usersdb;
    let intent;
    await ref_mw.onse("value",async function(ss) {
      workspaceId = ss.child(magicword).val().workspace_id;
      intent = ss.child(magicword).val().intent;
    });
    //普通の登録

    //addA(lineId, event.source.message.text);
    let answer = event.message.text;
    await ref_mw.child(magicword).update({
      intent : null
    });
    let params;
    if (answer == '雑談だよ') {
      params = {
        workspace_id: workspaceId,
        intent: 'zatsudan',
        text:intent
      };
      await assistant.createExample(params, function(err, response) {
        if (err) {
          console.error(err);
        } else {
          console.log(JSON.stringify(response, null, 2));
          return client.replyMessage(event.replyToken, {
            type:'text',
            text:'雑談だったんだね！次はお話できるといいなあ'
          });
        }
      });
    } else {
      params = {
        workspace_id: workspaceId,
        intent: intent,
        examples: [{
          text: intent
        }]
      };

      await assistant.createIntent(params, async function(err, res) {
        if (err) {
          console.log(`workspaceId:${params.workspace_id}`);
          console.log(`intent:${params.intent}`);
          console.error("watsonのエラー！！！"+err);
        } else {
          console.log(JSON.stringify(res, null, 2));
          const dt = new Date();
          const formatted = dt.toFormat('YYMMDDHHMISS');
          params = {
            workspace_id: workspaceId,
            dialog_node: formatted,
            conditions:`#${intent}`,
            output: {
              text: answer
            },
            title: intent
          };

          await assistant.createDialogNode(params, function(error, response) {
            if (error) {
              console.error("dialogのエラー！！！"+error);
            } else {
              console.log(JSON.stringify(response, null, 2));

              return client.replyMessage(event.replyToken, {
                type:'text',
                text:'今度きかれたらそう言うね'
              });
            }
          });
        }
      });
    }
  }
}

//返答依頼
async function addreq(body) {
//intent候補を記録しておく
	let magicword = body.magic_word;
	let intent = body.intent;
	await ref_mw.child(magicword).update({
		intent: intent
	});

	let lineid;
	await ref_mw.onse("value", async function(snapshot) {
		lineid = snapshot.child(magicword).val().mago_id;
		//push通知をする
		const message = {
			type: 'text',
			text: `「${body.intent}」だって．なんて答えればいいかなあ？雑談のときは「雑談だよ」って言ってね`
		};

		await client.pushMessage(lineid, message).then(() => {
			console.log('success');
		}).catch((err) => {
			console.error(err);
		});
	});
}


//ユーザ情報の削除
// workspaceの削除
