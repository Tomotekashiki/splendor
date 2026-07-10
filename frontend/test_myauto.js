import { request } from 'https'

const endpoints = [
  '/api/v1/get-mans',
  '/api/v1/mans',
  '/api/v1/makes',
  '/api/v1/carmakes',
  '/api/v1/manufacturers',
  '/api/v1/get-models',
  '/api/v1/models',
  '/api/v1/cats'
]

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = request({
      hostname: 'api.myauto.ge',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          length: body.length,
          preview: body.slice(0, 200)
        })
      })
    })
    req.on('error', (e) => resolve({ path, error: e.message }))
    req.end()
  })
}

async function run() {
  for (const ep of endpoints) {
    const res = await testEndpoint(ep)
    console.log(res)
  }
}

run()
