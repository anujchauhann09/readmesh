import { APP_NAME, PASSWORD_RESET_TTL_MINUTES } from '@readmesh/shared';

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Copy for the password reset message, kept out of the service. */
export const resetEmail = (link) => ({
  subject: `Reset your ${APP_NAME} password`,
  text: [
    `Someone asked to reset the password for your ${APP_NAME} account.`,
    '',
    `Open this link to choose a new one (valid for ${PASSWORD_RESET_TTL_MINUTES} minutes):`,
    link,
    '',
    "If this wasn't you, you can ignore this email — nothing has changed.",
  ].join('\n'),
  html:
    `<p>Someone asked to reset the password for your ${APP_NAME} account.</p>` +
    `<p><a href="${escapeHtml(link)}">Choose a new password</a> ` +
    `(valid for ${PASSWORD_RESET_TTL_MINUTES} minutes).</p>` +
    "<p>If this wasn't you, you can ignore this email — nothing has changed.</p>",
});
