const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

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

app.get('*', (req, res) => {
  res.redirect('/guest');
});

/*
 * Listen
 */
app.listen(port, () => console.log(`app listening on port ${port}`));
