'use strict';

const { apiKey, apiSecret, conferenceNumber, sipUsername, sipPassword } = require('../config');

const OpenTok = require('opentok');
const OT = new OpenTok(apiKey, apiSecret);

const defaultSessionOptions = { mediaMode: 'routed' };
let sipToken;

let activeSession;
let activePINCode;
let sipConnectionId;

/**
 * Returns options for token creation based on user type
 * @param {String} userType Host, guest, or viewer
 */
const tokenOptions = (userType) => {
  const role = {
    host: 'moderator',
    guest: 'publisher',
  }[userType];

  return { role };
};

const getPINCode = () => activePINCode;
const getSessionId = () => activeSession.sessionId;

/**
 * Create an OpenTok session
 * @param {Object} [options]
 * @returns {Promise} <Resolve => {Object}, Reject => {Error}>
 */
const createSession = async (options) => {
  return new Promise((resolve, reject) => {
    try {
      OT.createSession({ ...defaultSessionOptions, ...options }, (err, session) => {
        if (err) resolve(err);

        activeSession = session;
        activePINCode = Math.floor(Math.random() * 9000) + 1000;
        sipToken = OT.generateToken(activeSession.sessionId, { data: "sip=true" });

        resolve(session);
      });
    }
    catch (err) {
      reject(err);
    }
  });
}

/**
 * Create an OpenTok token
 * @param {String} userType Host, guest, or viewer
 * @returns {String}
 */
const createToken = userType => OT.generateToken(activeSession.sessionId, tokenOptions(userType));

/**
 * Creates an OpenTok session and generates an associated token
 * @returns {Promise} <Resolve => {Object}, Reject => {Error}>
 */
const getCredentials = async (userType) => {
  return new Promise(async (resolve, reject) => {
    if (!activeSession) {
      try {
        await createSession();
      }
      catch (err) {
        reject(err);
      }
    }
    const token = createToken(userType);
    resolve({ apiKey, sessionId: activeSession.sessionId, token, pinCode: activePINCode, conferenceNumber });
  });
}

const startArchive = async () => {
  return new Promise(async (resolve, reject) => {
    if (activeSession) {
      try {
        var archiveOptions = {
          hasAudio: true,
          hasVideo: true,
          outputMode: 'composed'
        };
        OT.startArchive(activeSession.sessionId, archiveOptions, function (err, archive) {
          if (err) {
            reject(err);
            return res.send(
              500,
              'Could not start archive for session ' + app.get('sessionId') + '. error=' + err.message
            );
          }
          return resolve(archive);
        });
      }
      catch (err) {
        reject(err);
      }
    } else {
      reject("You can't do that yo");
    }
  });
}

const stopArchive = async (archiveId) => {
  return new Promise(async (resolve, reject) => {
    if (archiveId && activeSession) {
      try {
        OT.stopArchive(archiveId, function (err, archive) {
          if (err) {
            reject(err);
          }
          resolve(archive);
        });
      }
      catch (err) {
        reject(err);
      }
    } else {
      reject("You can't do that yo");
    }
  });
}

const startSIP = async () => {
  if (activeSession) {
    let sipOptions = {
      auth: {
        username: sipUsername,
        password: sipPassword
      },
      secure: false,
    };

    return new Promise(async (resolve, reject) => {
      OT.dial(activeSession.sessionId, sipToken, `sip:${conferenceNumber}@sip.nexmo.com;transport=tls`, sipOptions, function (err, sipCall) {
        if (err) reject(err);
        sipConnectionId = sipCall.connectionId;
        resolve(sipCall);
      });
    });
  }
};

const stopSIP = async () => {
  return new Promise(async (resolve, reject) => {
    if (activeSession && sipConnectionId) {
      OT.forceDisconnect(activeSession.sessionId, sipConnectionId, (err) => {
        if (err) {
          console.log(err);
          reject();
        }
        resolve();
      });
    }
  });
}

module.exports = {
  getCredentials,
  getPINCode,
  getSessionId,
  startArchive,
  stopArchive,
  startSIP,
  stopSIP
};