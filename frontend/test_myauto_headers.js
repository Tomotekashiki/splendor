import { request } from 'https'

const urls = [
  { hostname: 'api.myauto.ge', path: '/api/v1/get-mans' },
  { hostname: 'api2.myauto.ge', path: '/ka/products/mans' }
]

async function test(urlObj) {
  return new Promise((resolve) => {
    const req = request({
      hostname: urlObj.hostname,
      path: urlObj.path,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,ka;q=0.8',
        'Referer': 'https://www.myauto.ge/',
        'Origin': 'https://www.myauto.ge'
      }
    }, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        resolve({
          url: `${urlObj.hostname}${urlObj.path}`,
          status: res.statusCode,
          length: body.length,
          preview: body.slice(0, 500)
        })
      })
    })
    req.on('error', (e) => resolve({ url: `${urlObj.hostname}${urlObj.path}`, error: e.message }))
    req.end()
  })
}

async function run() {
  for (const url of urls) {
    console.log('Testing', url.hostname)
    const res = await test(url)
    console.log(res)
  }
}

run()
