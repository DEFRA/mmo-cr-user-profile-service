describe('#userRoles route', () => {
  let server

  beforeAll(async () => {
    // Dynamic import needed due to config being updated by vitest-mongodb
    const { createServer } = await import('#/server.js')

    server = await createServer()
    await server.initialize()
    // Let the MongoDB driver's background topology monitor settle before any
    // test stops the server, otherwise a forced client close races an
    // in-flight heartbeat and raises an unhandled rejection unrelated to the
    // behaviour under test.
    await new Promise((resolve) => setTimeout(resolve, 300))
  })

  afterAll(async () => {
    await server.stop({ timeout: 1000 })
  })

  test('Should return assigned roles for a known user', async () => {
    const { statusCode, result } = await server.inject({
      method: 'GET',
      url: '/users/11111111-2222-3333-4444-555555555555/roles'
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual({
      schemaVersion: '1.0',
      definitionsVersion: '1',
      userId: '11111111-2222-3333-4444-555555555555',
      roles: ['PLDN--Skipper', 'VRO5--Owner']
    })
  })

  test('Should return an empty role collection for an unknown user', async () => {
    const { statusCode, result } = await server.inject({
      method: 'GET',
      url: '/users/unknown-user-id/roles'
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual({
      schemaVersion: '1.0',
      definitionsVersion: '1',
      userId: 'unknown-user-id',
      roles: []
    })
  })

  test('Should not require authentication', async () => {
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/users/11111111-2222-3333-4444-555555555555/roles'
    })

    expect(statusCode).toBe(200)
  })
})
