/**
 * Readers for the API's response envelope.
 *
 * Every endpoint answers `{ success, data, meta? }` (see the backend's
 * `sendSuccess`), and until now each call site reached into `r.data.data.thing`
 * by hand — 26 separate spellings of the same contract, each free to drift and
 * none of them saying what shape they expected. These three helpers are the only
 * places that know the envelope's layout.
 */

/** Reads one key out of `data`, e.g. `unwrap('user')`. */
export const unwrap = (key) => (response) => response.data.data[key];

/** Reads the whole `data` object, for endpoints that return a bare payload. */
export const unwrapData = (response) => response.data.data;

/**
 * Reads a collection plus its paging metadata as `{ items, meta }`.
 *
 * Uniform naming matters here: the hooks that page through documents, annotations,
 * saved repos and conversations are otherwise identical, and a per-resource key
 * would force each of them to differ for no reason.
 */
export const unwrapPage = (key) => (response) => ({
  items: response.data.data[key],
  meta: response.data.meta,
});

/** For endpoints whose useful answer is the acknowledgement itself. */
export const unwrapAck = (response) => response.data;
