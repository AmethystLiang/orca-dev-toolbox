// User-Agent strings broken into browser, engine, OS and device, with the caveats of reduced UAs.

const BOTS = [
  ['Googlebot', /Googlebot(?:-[\w]+)?\/([\d.]+)/], ['Google (other crawler)', /(?:AdsBot-Google|Mediapartners-Google|Google-InspectionTool|GoogleOther|Storebot-Google)/],
  ['Bingbot', /bingbot\/([\d.]+)/i], ['DuckDuckBot', /DuckDuckBot\/?([\d.]*)/], ['Baiduspider', /Baiduspider\/?([\d.]*)/],
  ['YandexBot', /YandexBot\/([\d.]+)/], ['Applebot', /Applebot\/([\d.]+)/], ['Yahoo Slurp', /Slurp/],
  ['GPTBot', /GPTBot\/([\d.]+)/], ['ChatGPT-User', /ChatGPT-User\/([\d.]+)/], ['OAI-SearchBot', /OAI-SearchBot\/([\d.]+)/],
  ['ClaudeBot', /ClaudeBot\/([\d.]+)/], ['Claude-User', /Claude-User\/?([\d.]*)/], ['PerplexityBot', /PerplexityBot\/([\d.]+)/],
  ['Facebook crawler', /facebookexternalhit\/([\d.]+)|meta-externalagent/], ['Twitterbot', /Twitterbot\/([\d.]+)/],
  ['LinkedInBot', /LinkedInBot\/([\d.]+)/], ['Slackbot', /Slackbot(?:-LinkExpanding)?\s?([\d.]*)/], ['Discordbot', /Discordbot\/([\d.]+)/],
  ['TelegramBot', /TelegramBot/], ['Zalo link preview', /Zalo(?:Bot|-?link)/i], ['AhrefsBot', /AhrefsBot\/([\d.]+)/], ['SemrushBot', /SemrushBot\/?([\d.~a-z]*)/],
  ['Uptime monitor', /UptimeRobot|Pingdom|StatusCake|Better ?Uptime/i]
]

const CLIENTS = [
  ['curl', /^curl\/([\d.]+)/], ['Wget', /^Wget\/([\d.]+)/], ['HTTPie', /^HTTPie\/([\d.]+)/], ['Postman', /PostmanRuntime\/([\d.]+)/],
  ['Insomnia', /insomnia\/([\d.]+)/], ['Python requests', /python-requests\/([\d.]+)/], ['Python httpx', /python-httpx\/([\d.]+)/],
  ['Python aiohttp', /aiohttp\/([\d.]+)/], ['Python urllib', /Python-urllib\/([\d.]+)/], ['Go net/http', /Go-http-client\/([\d.]+)/],
  ['OkHttp', /okhttp\/([\d.]+)/], ['axios', /axios\/([\d.]+)/], ['node-fetch', /node-fetch\/?([\d.]*)/], ['Node.js', /^node\/?([\d.]*)|undici/],
  ['Java', /^Java\/([\d._]+)|Apache-HttpClient\/([\d.]+)/], ['Dart', /^Dart\/([\d.]+)/], ['Ruby', /^Ruby|Faraday v([\d.]+)/],
  ['PHP Guzzle', /GuzzleHttp\/([\d.]+)/], ['.NET', /\.NET|HttpClient/], ['Deno', /^Deno\/([\d.]+)/], ['Bun', /^Bun\/([\d.]+)/]
]

// In-app browsers first: they wrap a normal Chrome or Safari UA.
const BROWSERS = [
  ['Facebook in-app', /FBAN|FBAV\/([\d.]+)/], ['Instagram in-app', /Instagram ([\d.]+)/], ['Messenger in-app', /FB_IAB\/MESSENGER|Messenger/],
  ['Zalo in-app', /Zalo(?:App)?(?: (?:iOS|android))?\/([\d.]+)/i], ['TikTok in-app', /musical_ly|BytedanceWebview|TikTok/], ['LINE in-app', /\bLine\/([\d.]+)/],
  ['WeChat in-app', /MicroMessenger\/([\d.]+)/], ['Electron', /Electron\/([\d.]+)/],
  ['Cốc Cốc', /coc_coc_browser\/([\d.]+)/], ['Microsoft Edge', /Edg(?:e|A|iOS)?\/([\d.]+)/], ['Opera', /(?:OPR|OPiOS|OPT)\/([\d.]+)|Opera\/.*Version\/([\d.]+)/],
  ['Samsung Internet', /SamsungBrowser\/([\d.]+)/], ['Yandex Browser', /YaBrowser\/([\d.]+)/], ['Vivaldi', /Vivaldi\/([\d.]+)/],
  ['UC Browser', /UCBrowser\/([\d.]+)/], ['Brave', /Brave\/([\d.]+)/], ['DuckDuckGo', /DuckDuckGo\/([\d.]+)|Ddg\/([\d.]+)/],
  ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/], ['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/], ['Chromium', /Chromium\/([\d.]+)/],
  ['Safari', /Version\/([\d.]+)(?: Mobile\/\w+)? Safari\//], ['Internet Explorer', /MSIE ([\d.]+)|Trident\/.*rv:([\d.]+)/]
]

const WINDOWS = { '10.0': '10 or 11', 6.3: '8.1', 6.2: '8', 6.1: '7', '6.0': 'Vista', 5.2: 'XP x64', 5.1: 'XP' }

function first(ua, list) {
  for (const [name, pattern] of list) {
    const match = ua.match(pattern)
    if (match) return { name, version: match.slice(1).find(Boolean) ?? '' }
  }
  return null
}

function operatingSystem(ua) {
  let m
  if ((m = ua.match(/(iPhone|iPod|iPad)[^)]*? OS (\d+(?:_\d+)*)/))) return { name: m[1] === 'iPad' ? 'iPadOS' : 'iOS', version: m[2].replaceAll('_', '.') }
  if ((m = ua.match(/Android[ /]?([\d.]*)/))) return { name: 'Android', version: m[1] }
  if ((m = ua.match(/HarmonyOS[ /]?([\d.]*)/))) return { name: 'HarmonyOS', version: m[1] }
  if ((m = ua.match(/Windows Phone(?: OS)? ([\d.]+)/))) return { name: 'Windows Phone', version: m[1] }
  if ((m = ua.match(/Windows NT ([\d.]+)/))) return { name: 'Windows', version: WINDOWS[m[1]] ?? `NT ${m[1]}` }
  if ((m = ua.match(/Mac OS X (\d+(?:[_.]\d+)*)/))) return { name: 'macOS', version: m[1].replaceAll('_', '.') }
  if (/Macintosh/.test(ua)) return { name: 'macOS', version: '' }
  if ((m = ua.match(/CrOS \S+ ([\d.]+)/))) return { name: 'ChromeOS', version: m[1] }
  if (/Ubuntu/.test(ua)) return { name: 'Ubuntu', version: '' }
  if (/Fedora/.test(ua)) return { name: 'Fedora', version: '' }
  if (/FreeBSD/.test(ua)) return { name: 'FreeBSD', version: '' }
  if (/Linux|X11/.test(ua)) return { name: 'Linux', version: '' }
  return null
}

function engine(ua, os, browser) {
  let m
  if (os?.name === 'iOS' || os?.name === 'iPadOS') return { name: 'WebKit', version: (ua.match(/AppleWebKit\/([\d.]+)/) ?? [])[1] ?? '', note: 'Every iOS browser uses WebKit.' }
  if ((m = ua.match(/Trident\/([\d.]+)/))) return { name: 'Trident', version: m[1] }
  if ((m = ua.match(/(?:Chrome|Chromium)\/([\d.]+)/))) return { name: 'Blink', version: m[1] }
  if ((m = ua.match(/rv:([\d.]+)\) Gecko\//))) return { name: 'Gecko', version: m[1] }
  if ((m = ua.match(/AppleWebKit\/([\d.]+)/))) return { name: 'WebKit', version: m[1] }
  if ((m = ua.match(/Presto\/([\d.]+)/))) return { name: 'Presto', version: m[1] }
  return browser ? { name: 'Unknown', version: '' } : null
}

function device(ua, os) {
  let m
  if (/iPad/.test(ua)) return { type: 'Tablet', vendor: 'Apple', model: 'iPad' }
  if (/iPhone/.test(ua)) return { type: 'Mobile', vendor: 'Apple', model: 'iPhone' }
  if (/iPod/.test(ua)) return { type: 'Mobile', vendor: 'Apple', model: 'iPod touch' }
  if (os?.name === 'Android' || os?.name === 'HarmonyOS') {
    const type = /Mobile/.test(ua) ? 'Mobile' : /\bTV\b|SmartTV|AFT\w/.test(ua) ? 'TV' : 'Tablet'
    m = ua.match(/;\s*([^;)]+?)\s+Build\//) ?? ua.match(/Android [\d.]+;\s*([^;)]+)\)/)
    const model = m?.[1]?.trim()
    const vendor = !model ? '' : /^SM-|Galaxy|samsung/i.test(model) ? 'Samsung' : /^Pixel/.test(model) ? 'Google' : /^(Redmi|M\d{4}|2\d{3}|Xiaomi|POCO)/i.test(model) ? 'Xiaomi'
      : /^(CPH|OPPO)/i.test(model) ? 'OPPO' : /^(RMX|realme)/i.test(model) ? 'realme' : /^(V\d{4}|vivo)/i.test(model) ? 'vivo' : /HUAWEI|^[A-Z]{3}-[A-Z]{2}\d/.test(model) ? 'Huawei' : ''
    return { type, vendor, model: model === 'K' ? '' : model ?? '' }
  }
  if (/SmartTV|SMART-TV|Tizen.*TV|webOS.*TV|AppleTV|CrKey/.test(ua)) return { type: 'TV', vendor: '', model: '' }
  if (/PlayStation|Xbox|Nintendo/.test(ua)) return { type: 'Console', vendor: '', model: ua.match(/PlayStation \w+|Xbox(?: One| Series [XS])?|Nintendo \w+/)?.[0] ?? '' }
  if (os) return { type: 'Desktop', vendor: os.name === 'macOS' ? 'Apple' : '', model: '' }
  return null
}

/**
 * Breaks a User-Agent string into its parts. `kind` is 'browser', 'bot' or 'client' (a library or
 * command-line tool). `notes` explains what the string cannot say, as for reduced Chrome UAs.
 */
export function parseUserAgent(input) {
  const ua = String(input).trim().replace(/^user-agent:\s*/i, '')
  if (!ua) throw new Error('Paste a User-Agent string.')
  const notes = []
  const bot = first(ua, BOTS)
  const client = bot ? null : first(ua, CLIENTS)
  const browser = bot || client ? null : first(ua, BROWSERS)
  const os = operatingSystem(ua)
  const kind = bot ? 'bot' : client ? 'client' : browser ? 'browser' : 'unknown'
  const eng = kind === 'browser' ? engine(ua, os, browser) : null
  const dev = kind === 'browser' ? device(ua, os) : null
  if (os?.name === 'Windows' && os.version === '10 or 11') notes.push('Browsers send “Windows NT 10.0” for Windows 11 too; only Client Hints (Sec-CH-UA-Platform-Version) tell them apart.')
  if (os?.name === 'macOS' && os.version === '10.15.7') notes.push('macOS has been frozen at 10.15.7 in browser UAs since Big Sur; the real version is likely newer.')
  if (dev && dev.type !== 'Desktop' && /Android 10; K\)/.test(ua)) notes.push('Reduced Android UA: Chrome hides the device model and Android version (“Android 10; K”).')
  if (browser && /^(Chrome|Microsoft Edge|Opera)$/.test(browser.name) && /\.0\.0\.0\b/.test(browser.version)) notes.push('Reduced Chrome UA: only the major version is real.')
  if (/Macintosh/.test(ua) && /Version\/[\d.]+ Safari/.test(ua) && !/Mobile/.test(ua)) notes.push('iPads ask for desktop sites with this same Mac UA; check navigator.maxTouchPoints to tell them apart.')
  if (bot) notes.push('Bots can be spoofed: verify crawlers by reverse DNS or the operator’s published IP ranges.')
  return { ua, kind, bot, client, browser, engine: eng, os, device: dev, notes }
}
