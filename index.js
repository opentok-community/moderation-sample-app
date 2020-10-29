const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

const { serverUrl, conferenceNumber } = require('./config');

app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

const opentok = require('./services/opentok-api');

/*
 * Routes
 */
app.get('/', (req, res) => {
  res.redirect('/guest');
});

app.get('/host', (req, res) => {
  opentok.getCredentials('host')
    .then(credentials => res.render('pages/host', { credentials: JSON.stringify(credentials) }))
    .catch(error => res.status(500).send(error));
});

app.get('/guest', (req, res) => {
  opentok.getCredentials('guest')
    .then(credentials => res.render('pages/guest', { credentials: JSON.stringify(credentials) }))
    .catch(error => res.status(500).send(error));
});

app.post('/archive/start', async (req, res) => {
  try {
    const archive = await opentok.startArchive();
    res.status(200).json(archive);
  }
  catch (err) {
    console.dir(err);
    res.status(500).json(err);
  }
});

app.post('/archive/stop', async (req, res) => {
  try {
    const archiveId = req.body.archiveId;
    const archive = await opentok.stopArchive(archiveId);
    res.status(200).json(archive);
  }
  catch (err) {
    res.status(500).json(err);
  }
});


app.post('/archive', (req, res) => {
  console.dir(req.body);
  res.status(200).send();
});

/* POST to start SIP call. */
app.post('/sip/start', async function (req, res) {
  try {
    const sipCall = await opentok.startSIP();
    return res.status(200).json(sipCall);
  }
  catch (err) {
    return res.status(500).send();
  }
});

/* POST to stop SIP call. */
app.post('/sip/stop', async function (req, res) {
  await opentok.stopSIP();
  return res.status(200).json({})
});

app.get('/vonage/answer', async function (req, res) {
  const ncco = [];
  if (req.query['SipHeader_X-OpenTok-SessionId']) {
    ncco.push({
      action: 'conversation',
      name: req.query['SipHeader_X-OpenTok-SessionId'],
    });
  } else {
    ncco.push(
      {
        action: 'talk',
        text: 'Please enter a a pin code to join the session'
      },
      {
        action: 'input',
        eventUrl: [`${serverUrl}/vonage/nexmo-dtmf`]
      }
    )
  }

  res.json(ncco);
});

app.get('/vonage/events', function (req, res) {
  res.status(200).send();
});

app.post('/vonage/nexmo-dtmf', (req, res) => {
  const { dtmf } = req.body;

  const pinCode = opentok.getPINCode();
  const sessionId = opentok.getSessionId();

  let ncco;
  if (`${pinCode}` === dtmf) {
    ncco = [
      {
        action: 'conversation',
        name: sessionId,
      }];
  } else {
    ncco = [
      {
        action: 'conversation',
        name: null,
      }];
  }

  res.json(ncco)
})

app.get('*', (req, res) => {
  res.redirect('/guest');
});

/*
 * Listen
 */
app.listen(port, () => console.log(`app listening on port ${port}`));
