describe('#roleDefinitions route', () => {
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

  test('Should return only enabled roles and matching capabilities for a known service', async () => {
    const { statusCode, result } = await server.inject({
      method: 'GET',
      url: '/roles-definitions/services/catch-recording'
    })

    expect(statusCode).toBe(200)
    expect(result.schemaVersion).toBe('1.0')
    expect(result.definitionsVersion).toBe('1')
    expect(result.serviceId).toBe('catch-recording')
    expect(result.roles).toEqual([
      {
        roleId: 'Owner',
        capabilityIds: [
          'catch-record.create',
          'catch-record.read',
          'catch-record.submit',
          'catch-record.update'
        ]
      },
      { roleId: 'ReadOnlyUser', capabilityIds: ['catch-record.read'] },
      {
        roleId: 'Skipper',
        capabilityIds: ['catch-record.amend', 'catch-record.read']
      }
    ])
  })

  test('Should return an empty role collection for an unknown service', async () => {
    const { statusCode, result } = await server.inject({
      method: 'GET',
      url: '/roles-definitions/services/unknown-service'
    })

    expect(statusCode).toBe(200)
    expect(result.serviceId).toBe('unknown-service')
    expect(result.roles).toEqual([])
  })

  test('Should not require authentication', async () => {
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/roles-definitions/services/catch-recording'
    })

    expect(statusCode).toBe(200)
  })
})
