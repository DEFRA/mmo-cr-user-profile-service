describe('#identity token-claims route', () => {
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

  test('Should return assigned applicationRoles for a known user', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: {
        type: 'microsoft.graph.authenticationEvent.tokenIssuanceStart',
        data: {
          '@odata.type': 'microsoft.graph.onTokenIssuanceStartCalloutData',
          user: { id: '11111111-2222-3333-4444-555555555555' }
        }
      }
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual({
      data: {
        '@odata.type': 'microsoft.graph.onTokenIssuanceStartResponseData',
        actions: [
          {
            '@odata.type': 'microsoft.graph.provideClaimsForToken',
            claims: {
              applicationRoles: ['PLDN--Skipper', 'VRO5--Owner']
            }
          }
        ]
      }
    })
  })

  test('Should return an empty applicationRoles collection for an unknown user', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: { data: { user: { id: 'unknown-user' } } }
    })

    expect(statusCode).toBe(200)
    expect(result.data.actions[0].claims.applicationRoles).toEqual([])
  })

  test('Should return an empty applicationRoles collection when data.user.id is missing', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: { data: {} }
    })

    expect(statusCode).toBe(200)
    expect(result.data.actions[0].claims.applicationRoles).toEqual([])
  })

  test('Should work without an Authorization header', async () => {
    const { statusCode } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: {
        data: { user: { id: '11111111-2222-3333-4444-555555555555' } }
      }
    })

    expect(statusCode).toBe(200)
  })

  test('Should ignore a supplied Authorization header', async () => {
    const { result } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      headers: { authorization: 'Bearer this-is-not-a-real-token' },
      payload: {
        data: { user: { id: '11111111-2222-3333-4444-555555555555' } }
      }
    })

    expect(result.data.actions[0].claims.applicationRoles).toEqual([
      'PLDN--Skipper',
      'VRO5--Owner'
    ])
  })

  test('Should ignore unrelated request properties', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: {
        type: 'microsoft.graph.authenticationEvent.tokenIssuanceStart',
        source: '/tenants/00000000-0000-0000-0000-000000000001',
        data: {
          '@odata.type': 'microsoft.graph.onTokenIssuanceStartCalloutData',
          tenantId: '00000000-0000-0000-0000-000000000001',
          authenticationContext: { correlationId: 'some-correlation-id' },
          user: { id: '11111111-2222-3333-4444-555555555555' }
        }
      }
    })

    expect(statusCode).toBe(200)
    expect(result.data.actions[0].claims.applicationRoles).toEqual([
      'PLDN--Skipper',
      'VRO5--Owner'
    ])
  })
})
