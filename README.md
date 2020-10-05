# OpenTok Moderation Sample App for JavaScript

<img src="https://assets.tokbox.com/img/vonage/Vonage_VideoAPI_black.svg" height="48px" alt="Tokbox is now known as Vonage" />

This document describes how to use the OpenTok Moderation Sample App for JavaScript. Through
the exploration of this sample application, you will learn best practices for setting up and
managing hosts, guests, and viewers in a web-based application. In the OpenTok Moderation
Sample App, the host is the individual who controls and moderates the session.

You can configure and run this sample app within just a few minutes!

This guide has the following sections:

- [Prerequisites](#prerequisites): A checklist of everything you need to get started.
- [Quick start](#quick-start): A step-by-step tutorial to help you quickly run the sample app.
- [Exploring the code](#exploring-the-code): This describes the sample app code design, which
  uses recommended best practices to implement the OpenTok Moderation app features.

## Prerequisites

To be prepared to develop your OpenTok Moderation app:

1. Review the [OpenTok.js](https://tokbox.com/developer/sdks/js/) requirements.
2. Your app will need an OpenTok **API Key** and **API Secret**, which you can get from
   the [OpenTok Developer Dashboard](https://tokbox.com/account/). Set the API Key and
   API Secret in [config.json](./config.json).

To run the OpenTok Moderation Sample App, run the following commands or deploy the
application to Heroku.

```bash
npm i
npm start
```

_**IMPORTANT:** In order to deploy an OpenTok Moderation app, your web domain must use HTTPS._

## Quick start

The web page that loads the sample app for JavaScript must be served over HTTP/HTTPS. Browser
security limitations prevent you from publishing video using a `file://` path, as discussed in
the OpenTok.js [Release Notes](https://www.tokbox.com/developer/sdks/js/release-notes.html#knownIssues). To
support clients running [Chrome 47 or later](https://groups.google.com/forum/#!topic/discuss-webrtc/sq5CVmY69sc),
HTTPS is required. A web server such as [MAMP](https://www.mamp.info/) or
[XAMPP](https://www.apachefriends.org/index.html) will work, or you can use a cloud service such
as [Heroku](https://www.heroku.com/) to host the application.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Exploring the code

This section describes how the sample app code design uses recommended best practices to deploy
the moderation features.

For detail about the APIs used to develop this sample, see
the [OpenTok.js Reference](https://tokbox.com/developer/sdks/js/reference/).

- [Web page design](#web-page-design)
- [Server](#server)
- [Guest](#guest)
- [Host](#host)

_**NOTE:** The sample app contains logic used for logging. This is used to submit anonymous usage data for internal Vonage purposes only. We request that you do not modify or remove any logging code in your use of this sample application._

### Web page design

While Vonage hosts [OpenTok.js](https://tokbox.com/developer/sdks/js/), you must host the
sample app yourself. This allows you to customize the app as desired.

- **[server.js](./server.js)**: The server configures the routes for the host and guests.

- **[opentok-api.js](./services/opentok-api.js)**: Configures the **Session ID**, **Token**,
  and **API Key**, creates the OpenTok session, and generates tokens for hosts and guests. Set
  the API Key and API Secret in [config.json](./config.json).

- **[host.js](./public/js/host.js)**: The host is the individual who controls and moderates
  the session. The host uses the OpenTok [Signaling API](https://www.tokbox.com/developer/guides/signaling/js/)
  to send the signals to all clients in the session.

- **[guest.js](./public/js/guest.js)**: Guests can publish in the session. They can control
  their own audio and video.

- **[CSS files](./public/css)**: Defines the client UI style.

### Server

The methods in [server.js](./server.js) include the host and guest routes, as well
as the moderation routes. Each of the host, guest, and viewer routes retrieves
the credentials and creates the token for each user type (moderator or publisher)
defined in [opentok-api.js](./services/opentok-api.js):

```javascript
const tokenOptions = userType => {

  const role = {
    host: 'moderator',
    guest: 'publisher',
  }[userType];

  return { role };
};
```

The credentials are embedded in an EJS template as JSON. For example, the following host
route is configured in server.js:

```javascript
app.get('/host', (req, res) => {
  api.getCredentials('host')
    .then(credentials => res.render('pages/host', {
      credentials: JSON.stringify(credentials)
    }))
    .catch(error => res.status(500).send(error));
});
```

The credentials are then retrieved in [host.js](./public/js/host.js) and used to connect to the host to the session:

```javascript
  var getCredentials = function () {
    var el = document.getElementById('credentials');
    var credentials = JSON.parse(el.getAttribute('data'));
    el.remove();
    return credentials;
  };

  . . .

  var init = function () {

    . . .

    var credentials = getCredentials();
    var session = OT.initSession(credentials.apiKey, credentials.sessionId);
    var publisher = initPublisher();

    session.connect(credentials.token, function (error) {

      . . .

    });
  };

```

When the web page is loaded, those credentials are retrieved from the HTML and are used to initialize the session.

### Guest

The functions in [guest.js](./public/js/guest.js) retrieve the credentials from the HTML,
subscribe to the host stream and other guest streams, and publish audio and video to the
session. Guests can control their own video & audio streams.

### Host

The methods in [host.js](./public/js/host.js) retrieve the credentials from the HTML, set the
state of the session and update the UI, moderate the session, and subscribe to the guest
streams.

## Development and Contributing

Interested in contributing? We :heart: pull requests! See the [Contribution](CONTRIBUTING.md) guidelines.

## Getting Help

We love to hear from you so if you have questions, comments or find a bug in the project, let us
know! You can either:

- Open an issue on this repository
- See <https://support.tokbox.com/> for support options
- Tweet at us! We're [@VonageDev](https://twitter.com/VonageDev) on Twitter
- Or [join the Vonage Developer Community Slack](https://developer.nexmo.com/community/slack)

## Further Reading

- Check out the Developer Documentation at <https://tokbox.com/developer/>
