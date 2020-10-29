'use strict';

const { apiKey, apiSecret } = require('../config');

const OpenTok = require('opentok');
const OT = new OpenTok(apiKey, apiSecret);

const defaultSessionOptions = { mediaMode: 'routed' };

let activeSession;

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
    resolve({ apiKey, sessionId: activeSession.sessionId, token });
  });
}

module.exports = {
  getCredentials,
  getSessionId,
};