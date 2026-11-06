describe('#router', () => {
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

  test('Should register all Mock User Profile Service routes', () => {
    const routes = server
      .table()
      .map((route) => `${route.method.toUpperCase()} ${route.path}`)

    expect(routes).toEqual(
      expect.arrayContaining([
        'GET /health',
        'POST /identity/token-claims',
        'GET /users/{entraObjectId}/roles',
        'GET /roles-definitions/services/{serviceId}'
      ])
    )
  })
})
