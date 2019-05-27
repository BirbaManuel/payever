const { findBase64 } = require('./server')

test('test if a object Array contain a specific URL', () => {
  const arrayObject = [
    { base64: 'huerigheg', url: '/api/user/12/avatar' },
    { base64: 'grejghberjg', url: '/api/user/11/avatar' },
    { base64: 'frekjhfjkreh', url: '/api/user/10/avatar' },
  ]

  expect(findBase64('/api/user/11/avatar', arrayObject)).toEqual({
    base64: 'grejghberjg',
    url: '/api/user/11/avatar',
  })
})
