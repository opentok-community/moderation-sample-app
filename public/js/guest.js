/* global analytics */
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

  let screenShare = false;
  let session;
  let publisher;

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
   * Create an OpenTok publisher object
   */
  const initPublisher = function () {
    const properties = Object.assign({ name: 'Guest', insertMode: 'after' }, insertOptions);
    return OT.initPublisher('hostDivider', properties);
  };

  /**
   * Subscribe to a stream
   */
  const subscribe = function (session, stream) {
    const name = stream.name;
    const insertMode = name === 'Host' ? 'before' : 'after';
    const properties = Object.assign({ name: name, insertMode: insertMode }, insertOptions);
    session.subscribe(stream, 'hostDivider', properties, function (error) {
      if (error) {
        console.log(error);
      }
      if (stream.videoType === 'screen') {
        screenShare = true;
      }
    });
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

  const addPublisherControls = function (publisher) {
    const publisherContainer = document.getElementById(publisher.element.id);
    const el = document.createElement('div');
    const controls = [
      '<div class="publisher-controls-container">',
      '<div id="publishVideo" class="control video-control"></div>',
      '<div id="publishAudio" class="control audio-control"></div>',
      '<div id="publishScreen" title="Toggle Screen-share" class="control screen-control"></div>',
      '</div>',
    ].join('\n');
    el.innerHTML = controls;
    publisherContainer.appendChild(el.firstChild);
  };

  /**
   * Start publishing our audio and video to the session. Also, start
   * subscribing to other streams as they are published.
   * @param {Object} session The OpenTok session
   * @param {Object} publisher The OpenTok publisher object
   */
  const publishAndSubscribe = function (session, publisher) {

    let streams = 1;

    session.publish(publisher);
    addPublisherControls(publisher);

    session.on('streamCreated', function (event) {
      subscribe(session, event.stream);
      streams++;
      if (streams > 3) {
        document.getElementById('videoContainer').classList.add('wrap');
      }
    });

    session.on('streamDestroyed', function (event) {
      if (event.stream.videoType === 'screen') {
        screenShare = false;
      }
      streams--;
      if (streams < 4) {
        document.getElementById('videoContainer').classList.remove('wrap');
      }
    });

    session.on("signal:mute signal:muteAll", function (event) {
      muteAudio();
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

  let myScreenShare;

  const muteAudio = () => {
    const el = document.getElementById('publishAudio');
    el.classList.add('disabled');
    publisher.publishAudio(false);
  }

  const toggleScreen = function () {
    if (myScreenShare) {
      stopScreenShare();
      screenShare = false;
    } else {
      if (!screenShare) {
        startScreenShare();
        screenShare = true;
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
        const properties = Object.assign({ videoSource: 'screen', publishAudio: true, name: 'Host', insertMode: 'before' }, insertOptions);
        myScreenShare = OT.initPublisher('screenPreview',
          properties,
          function (error) {
            if (error) {
              console.log(error);
            } else {
              session.publish(myScreenShare, function (error) {
                if (error) {
                  console.log(error);
                } else {
                  screenShare = true;
                }
              });
            }
          }
        );
      }
    });
  }

  const stopScreenShare = function () {
    myScreenShare.destroy();
    myScreenShare = undefined;
    screenShare = false;
  }

  const init = function () {
    const credentials = getCredentials();
    const props = { connectionEventsSuppressed: true };
    session = OT.initSession(credentials.apiKey, credentials.sessionId, props);
    publisher = initPublisher();

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

  document.addEventListener('DOMContentLoaded', init);
}());
