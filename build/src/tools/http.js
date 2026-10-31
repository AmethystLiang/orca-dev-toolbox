// HTTP status codes from RFC 9110 and the other registered RFCs, with when each is used.

export const STATUS = [
  [100, 'Continue', 'The server got the request headers; send the body.'],
  [101, 'Switching Protocols', 'Upgrading the connection, as to WebSocket.'],
  [102, 'Processing', 'WebDAV: the request is still being worked on.'],
  [103, 'Early Hints', 'Preload hints sent before the final response.'],
  [200, 'OK', 'The request succeeded.'],
  [201, 'Created', 'A new resource was created; Location points to it.'],
  [202, 'Accepted', 'Queued for processing, not finished yet.'],
  [203, 'Non-Authoritative Information', 'A proxy changed the origin’s response.'],
  [204, 'No Content', 'Succeeded with no body, as for a DELETE or a save.'],
  [205, 'Reset Content', 'Succeeded; the client should reset its form.'],
  [206, 'Partial Content', 'The byte range asked for with Range.'],
  [207, 'Multi-Status', 'WebDAV: several results in one XML body.'],
  [208, 'Already Reported', 'WebDAV: members already listed earlier.'],
  [226, 'IM Used', 'Delta encoding applied to the response.'],
  [300, 'Multiple Choices', 'Several representations; the client picks one.'],
  [301, 'Moved Permanently', 'The resource moved for good; clients may switch POST to GET.'],
  [302, 'Found', 'Temporarily elsewhere; clients may switch POST to GET.'],
  [303, 'See Other', 'Fetch the result with GET at Location, as after a form POST.'],
  [304, 'Not Modified', 'The cached copy is still fresh (ETag or Last-Modified matched).'],
  [307, 'Temporary Redirect', 'Temporarily elsewhere; repeat the same method and body.'],
  [308, 'Permanent Redirect', 'Moved for good; repeat the same method and body.'],
  [400, 'Bad Request', 'Malformed syntax or invalid input.'],
  [401, 'Unauthorized', 'Missing or invalid credentials: authenticate and retry.'],
  [402, 'Payment Required', 'Reserved; some APIs use it for billing limits.'],
  [403, 'Forbidden', 'Authenticated but not allowed; retrying will not help.'],
  [404, 'Not Found', 'No resource at this URL, or it is hidden from you.'],
  [405, 'Method Not Allowed', 'The URL exists but not for this method; see Allow.'],
  [406, 'Not Acceptable', 'No representation matches the Accept headers.'],
  [407, 'Proxy Authentication Required', 'Authenticate with the proxy first.'],
  [408, 'Request Timeout', 'The client took too long to send the request.'],
  [409, 'Conflict', 'Clashes with the current state, as an edit conflict or a duplicate.'],
  [410, 'Gone', 'Removed for good, with no forwarding address.'],
  [411, 'Length Required', 'Send a Content-Length header.'],
  [412, 'Precondition Failed', 'If-Match or If-Unmodified-Since did not hold.'],
  [413, 'Content Too Large', 'The body is larger than the server accepts.'],
  [414, 'URI Too Long', 'The URL is longer than the server accepts.'],
  [415, 'Unsupported Media Type', 'The Content-Type is not accepted here.'],
  [416, 'Range Not Satisfiable', 'The Range lies outside the resource.'],
  [417, 'Expectation Failed', 'The Expect header cannot be met.'],
  [418, 'I’m a teapot', 'An April Fools’ joke (RFC 2324) that stuck.'],
  [421, 'Misdirected Request', 'This server cannot answer for that host.'],
  [422, 'Unprocessable Content', 'Well-formed but semantically invalid, as failed validation.'],
  [423, 'Locked', 'WebDAV: the resource is locked.'],
  [424, 'Failed Dependency', 'WebDAV: an earlier request it depends on failed.'],
  [425, 'Too Early', 'Refused to process data that might be replayed.'],
  [426, 'Upgrade Required', 'Switch to the protocol named in Upgrade.'],
  [428, 'Precondition Required', 'Send a conditional request, such as If-Match.'],
  [429, 'Too Many Requests', 'Rate limited; Retry-After says when to try again.'],
  [431, 'Request Header Fields Too Large', 'Headers, often cookies, are too big.'],
  [451, 'Unavailable For Legal Reasons', 'Blocked for legal reasons, as a court order.'],
  [500, 'Internal Server Error', 'An unexpected failure on the server.'],
  [501, 'Not Implemented', 'The server does not support this method.'],
  [502, 'Bad Gateway', 'A proxy got an invalid response from upstream.'],
  [503, 'Service Unavailable', 'Overloaded or down for maintenance; Retry-After may say when.'],
  [504, 'Gateway Timeout', 'A proxy timed out waiting for upstream.'],
  [505, 'HTTP Version Not Supported', 'The HTTP version is not supported.'],
  [506, 'Variant Also Negotiates', 'A content-negotiation loop on the server.'],
  [507, 'Insufficient Storage', 'WebDAV: no room to store the result.'],
  [508, 'Loop Detected', 'WebDAV: an infinite loop while processing.'],
  [511, 'Network Authentication Required', 'Sign in to the network first, as on hotel Wi-Fi.']
]

export const CLASSES = { 1: 'Informational', 2: 'Success', 3: 'Redirection', 4: 'Client error', 5: 'Server error' }

/** Codes whose number, name or description contains every word of the query. */
export function searchStatus(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return STATUS
  // "4xx" or "40" match by number prefix.
  if (words.length === 1 && /^[1-5](\d|x){0,2}$/.test(words[0])) {
    const prefix = words[0].replace(/x+$/, '')
    return STATUS.filter(([code]) => String(code).startsWith(prefix))
  }
  return STATUS.filter(([code, name, about]) => {
    const haystack = `${code} ${name} ${about}`.toLowerCase()
    return words.every((word) => haystack.includes(word))
  })
}
