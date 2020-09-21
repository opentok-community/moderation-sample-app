/* eslint-disable object-shorthand */
(function () {

  /**
   * Options for adding OpenTok publisher and subscriber video elements
   */
  const insertOptions = {
    width: '100%',
    height: '100%',
    showControls: false
  };

  /**
   * Get our OpenTok API Key, Session ID, and Token from the JSON embedded
   * in the HTML.
   */
  const getCredentials = function () {
    const el = document.getElementById('credentials');
    const credentials = JSON.parse(el.getAttribute('data'));
    el.remove();
    return credentials;
  };

  /**
   * Subscribe to a stream
   * @returns {Object} A subscriber object
   */
  const subscribe = function (session, stream) {
    const name = stream.name;
    const insertMode = name === 'Host' ? 'before' : 'after';
    const properties = Object.assign({ name: name, insertMode: insertMode }, insertOptions);
    return session.subscribe(stream, 'hostDivider', properties, function (error) {
      if (error) {
        console.log(error);
      }
    });
  };

  /**
   * Listen for events on the OpenTok session
   */
  const setEventListeners = function (session) {
    const streams = [];
    const subscribers = [];

    /** Subscribe to new streams as they are published */
    session.on('streamCreated', function (event) {
      streams.push(event.stream);
      subscribers.push(subscribe(session, event.stream));
      if (streams.length > 3) {
        document.getElementById('videoContainer').classList.add('wrap');
      }
    });

    session.on('streamDestroyed', function (event) {
      const index = streams.indexOf(event.stream);
      streams.splice(index, 1);
      if (streams.length < 4) {
        document.getElementById('videoContainer').classList.remove('wrap');
      }
    });

    /** Listen for a broadcast status update from the host */
    session.on('signal:broadcast', function (event) {
      const status = event.data;
      broadcastActive = status === 'active';

    });
  };

  const init = function () {
    const credentials = getCredentials();
    const props = { connectionEventsSuppressed: true };
    const session = OT.initSession(credentials.apiKey, credentials.sessionId, props);

    session.connect(credentials.token, function (error) {
      if (error) {
        console.log(error);
      } else {
        setEventListeners(session);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', init);
}());
