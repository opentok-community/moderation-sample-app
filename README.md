# OpenTok Moderation Sample App for JavaScript

This document describes how to use the OpenTok Moderation Sample App for JavaScript. In the OpenTok Moderation Sample App, the host is the individual who controls and moderates the session.

You can configure and run this sample app within just a few minutes!

This guide has the following sections:

- [Prerequisites](#prerequisites): A checklist of everything you need to get started.
- [Quick start](#quick-start): A step-by-step tutorial to help you quickly run the sample app.

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

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/opentok-community/moderation-sample-app/tree/main)

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
