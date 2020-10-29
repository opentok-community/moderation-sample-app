/* global analytics http Clipboard */
/* eslint-disable object-shorthand */

/* eslint-disable vars-on-top */
(function () {

  /** The state of things */
  let subscribers = [];
  let session;

  /**
   * Options for adding OpenTok publisher and subscriber video elements
   */
  const insertOptions = {
    width: '100%',
    height: '100%',
    showControls: false
  };

  /**
   * Get our OpenTok http Key, Session ID, and Token from the JSON embedded
   * in the HTML.
   */
  const getCredentials = function () {
    const el = document.getElementById('credentials');
    const credentials = JSON.parse(el.getAttribute('data'));
    el.remove();
    credentialData = credentials;
    return credentials;
  };

  let credentialData;

  /**
   * Create an OpenTok publisher object
   */
  const initPublisher = function () {
    const properties = Object.assign({ name: 'Host', insertMode: 'before' }, insertOptions);
    const publisher = OT.initPublisher('hostDivider', properties);

    const subscriberData = {
      subscriber: publisher
    };
    subscribers.push(subscriberData);
    return publisher;
  };

  /**
   * Send the broadcast status to everyone connected to the session using
   * the OpenTok signaling API
   * @param {Object} session
   * @param {String} status
   * @param {Object} [to] - An OpenTok connection object
   */
  const signal = function (session, status, to) {
    const signalData = Object.assign({}, { type: 'broadcast', data: status }, to ? { to } : {});
    session.signal(signalData, function (error) {
      if (error) {
        console.log(['signal error (', error.code, '): ', error.message].join(''));
      } else {
        console.log('signal sent');
      }
    });
  };

  /**
   * Subscribe to a stream
   */
  const subscribe = function (session, stream) {
    const properties = Object.assign({ name: 'Guest', insertMode: 'after' }, insertOptions);
    const subscriber = session.subscribe(stream, 'hostDivider', properties, function (error) {
      if (error) {
        console.log(error);
      }
    });
    subscribers.push({ subscriber });
    addModerationControls(subscriber);
    setSubscriberEventListeners(session, subscriber);
  };

  /**
   * Toggle publishing audio/video to allow host to mute
   * their video (publishVideo) or audio (publishAudio)
   * @param {Object} publisher The OpenTok publisher object
   * @param {Object} el The DOM element of the control whose id corresponds to the action
   */
  const toggleMedia = function (publisher, el) {
    const enabled = el.classList.contains('disabled');
    el.classList.toggle('disabled');
    publisher[el.id](enabled);
  };

  const setEventListeners = function (session, publisher) {

    // Subscribe to new streams as they're published
    session.on('streamCreated', function (event) {
      subscribe(session, event.stream);
      if (subscribers.length > 2) {
        document.getElementById('videoContainer').classList.add('wrap');
      }
    });

    session.on('streamDestroyed', function (event) {
      subscribers = subscribers.filter(f => f.subscriber.streamId !== event.stream.id);
      if (subscribers.length <= 3) {
        document.getElementById('videoContainer').classList.remove('wrap');
      }
    });

    document.getElementById('publishVideo').addEventListener('click', function () {
      toggleMedia(publisher, this);
    });

    document.getElementById('publishAudio').addEventListener('click', function () {
      toggleMedia(publisher, this);
    });

    document.getElementById('publishScreen').addEventListener('click', function () {
      toggleScreen(this);
    });
  };

  const setSubscriberEventListeners = function (session, subscriber) {

    document.getElementById('subscriberDisconnect').addEventListener('click', function () {
      disconnectSubscriber(subscriber, this);
    });

    document.getElementById('subscriberUnpublish').addEventListener('click', function () {
      unpublishSubscriber(subscriber, this);
    });

  };

  /**
   * Disconnects a subscriber from the session
   * @param {Object} subscriber The OpenTok subscriber object
   * @param {Object} el The DOM element of the control whose id corresponds to the action
   */
  const disconnectSubscriber = function (subscriber, el) {
    if (session.capabilities.forceDisconnect == 1) {
      session.forceDisconnect(subscriber.stream.connection);
    }
  };

  /**
   * Force unpublishes a subscriber int the session
   * @param {Object} subscriber The OpenTok subscriber object
   * @param {Object} el The DOM element of the control whose id corresponds to the action
   */
  const unpublishSubscriber = function (subscriber, el) {
    if (session.capabilities.forceUnpublish == 1) {
      session.forceUnpublish(subscriber.stream);
    }
  };

  const addPublisherControls = function (publisher) {
    const publisherContainer = document.getElementById(publisher.element.id);
    const el = document.createElement('div');
    const controls = [
      '<div class="publisher-controls-container">',
      '<div id="publishVideo" title="Toggle Video" class="control video-control"></div>',
      '<div id="publishAudio" title="Toggle Audio" class="control audio-control"></div>',
      '<div id="publishScreen" title="Toggle Screen-share" class="control screen-control"></div>',
      '</div>',
    ].join('\n');
    el.innerHTML = controls;
    publisherContainer.appendChild(el.firstChild);
  };

  const addModerationControls = function (subscriber) {
    const subscriberContainer = document.getElementById(subscriber.element.id);
    const el = document.createElement('div');
    const controls = [
      '<div class="subscriber-controls-container">',
      '<div id="subscriberUnpublish" title="Stop publisher" class="control video-control"></div>',
      '<div id="subscriberDisconnect" title="Force disconnect" class="control disconnect-control"></div>',
      '</div>',
    ].join('\n');
    el.innerHTML = controls;
    subscriberContainer.appendChild(el.firstChild);
  };

  /**
   * The host starts publishing and signals everyone else connected to the
   * session so that they can start publishing and/or subscribing.
   * @param {Object} session The OpenTok session
   * @param {Object} publisher The OpenTok publisher object
   */
  const publishAndSubscribe = function (session, publisher) {
    session.publish(publisher);
    addPublisherControls(publisher);
    setEventListeners(session, publisher);
  };

  const init = function () {
    const credentials = getCredentials();
    const props = { connectionEventsSuppressed: true };
    session = OT.initSession(credentials.apiKey, credentials.sessionId, props);
    const publisher = initPublisher();

    session.connect(credentials.token, function (error) {
      if (error) {
        console.log(error);
        analytics.init(session);
        analytics.log('initialize', 'variationAttempt');
        analytics.log('initialize', 'variationError');
      } else {
        publishAndSubscribe(session, publisher);
        analytics.init(session);
        analytics.log('initialize', 'variationAttempt');
        analytics.log('initialize', 'variationSuccess');
      }
    });
  };

  let screenShare;

  const toggleScreen = function () {
    if (screenShare) {
      stopScreenShare();
    } else {
      if (!subscribers.find(f => f.subscriber.stream.videoType === 'screen')) {
        startScreenShare();
      }
    }
  }

  const startScreenShare = function () {
    OT.checkScreenSharingCapability(function (response) {
      if (!response.supported || response.extensionRegistered === false) {
        // This browser does not support screen sharing.
        alert("You can't do the do.");
      } else {
        // Screen sharing is available. Publish the screen.
        const properties = Object.assign({ videoSource: 'screen', name: 'Host', insertMode: 'before' }, insertOptions);
        screenShare = OT.initPublisher('screenPreview',
          properties,
          function (error) {
            if (error) {
              console.log(error);
            } else {
              session.publish(screenShare, function (error) {
                if (error) {
                  console.log(error);
                } else {
                  const subscriberData = {
                    subscriber: screenShare
                  };
                  subscribers.push(subscriberData);
                }
              });
            }
          }
        );
      }
    });
  }

  const stopScreenShare = function () {
    subscribers = subscribers.filter(f => f.subscriber.streamId !== screenShare.stream.streamId)
    screenShare.destroy();
    screenShare = undefined;
  }

  document.addEventListener('DOMContentLoaded', init);
}());
