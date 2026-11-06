import Boom from '@hapi/boom'

vi.mock('#/services/tokenClaims/tokenClaimsService.js', () => ({
  buildTokenClaimsResponse: vi.fn(() => {
    throw Boom.internal('Mock user-role assignment data is invalid')
  })
}))

describe('#identity token-claims route (data failure)', () => {
  let server

  beforeAll(async () => {
    // Dynamic import needed due to config being updated by vitest-mongodb
    const { createServer } = await import('#/server.js')

    server = await createServer()
    await server.initialize()
    await new Promise((resolve) => setTimeout(resolve, 300))
  })

  afterAll(async () => {
    await server.stop({ timeout: 1000 })
  })

  test('Should return a safe 500 response when mock data cannot be loaded or validated', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: {
        data: { user: { id: '11111111-2222-3333-4444-555555555555' } }
      }
    })

    expect(statusCode).toBe(500)
    expect(result).toEqual({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An internal server error occurred'
    })
    expect(JSON.stringify(result)).not.toMatch(/\/Users\/|\/src\/|node_modules/)
  })
})
