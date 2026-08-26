import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Outbound email behind a driver seam.
 *
 * `log` (the default) writes the message to the application log, which is what a
 * local or free-tier deployment wants: password reset works end-to-end without a
 * mail provider, and the link is right there in the console. Point MAIL_DRIVER at
 * `smtp` with an SMTP_URL to deliver for real.
 */

let transportPromise = null;

const smtpTransport = () => {
  if (!transportPromise) {
    transportPromise = import('nodemailer')
      .then((nodemailer) => nodemailer.default.createTransport(config.mail.smtpUrl))
      .catch((err) => {
        transportPromise = null;
        throw err;
      });
  }
  return transportPromise;
};

const drivers = {
  log: async ({ to, subject, text }) => {
    logger.info({ to, subject, body: text }, 'Email (log driver — not actually sent)');
  },
  smtp: async ({ to, subject, text, html }) => {
    if (!config.mail.smtpUrl) throw new Error('MAIL_DRIVER=smtp requires SMTP_URL');
    const transport = await smtpTransport();
    await transport.sendMail({ from: config.mail.from, to, subject, text, html });
  },
};

/**
 * Sends a message. Never throws into the caller: a mail outage must not turn a
 * "we sent you a link" response into a 500 that also reveals the account exists.
 */
export const sendMail = async (message) => {
  try {
    await drivers[config.mail.driver](message);
    return true;
  } catch (err) {
    logger.error({ err, to: message.to, subject: message.subject }, 'Failed to send email');
    return false;
  }
};
