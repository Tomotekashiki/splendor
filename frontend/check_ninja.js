import { request } from 'https'

const apiKey = 'TIhWn8PnnUbFlGhPjR6miyHvFGSNSw6fFljuCNm5'

const req = request({
  hostname: 'api.api-ninjas.com',
  path: '/v1/cars?make=toyota',
  headers: {
    'X-Api-Key': apiKey
  }
}, (res) => {
  let body = ''
  res.on('data', (chunk) => body += chunk)
  res.on('end', () => {
    console.log('STATUS:', res.statusCode)
    console.log('HEADERS:', res.headers)
    console.log('BODY:', body)
  })
})

req.on('error', (e) => {
  console.error(e)
})

req.end()
