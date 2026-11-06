import { readFileSync } from 'node:fs'

const fixturesDir = new URL(
  '../services/tokenClaims/fixtures/',
  import.meta.url
)
const readFixture = (name) =>
  JSON.parse(readFileSync(new URL(name, fixturesDir), 'utf-8'))

const entraRequestFixture = readFixture(
  'entra-token-issuance-start-request.json'
)
const knownUserResponseFixture = readFixture(
  'entra-token-issuance-start-known-user-response.json'
)
const emptyRoleResponseFixture = readFixture(
  'entra-token-issuance-start-empty-role-response.json'
)

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

  test('Should return the approved Entra response envelope for the representative request fixture', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: entraRequestFixture
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual(knownUserResponseFixture)
  })

  test('Should return an empty applicationRoles collection for an unknown user', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: { data: { user: { id: 'unknown-user' } } }
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual(emptyRoleResponseFixture)
  })

  test('Should return an empty applicationRoles collection when data.user.id is missing', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: { data: {} }
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual(emptyRoleResponseFixture)
  })

  test('Should return an empty applicationRoles collection for an empty body', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: {}
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual(emptyRoleResponseFixture)
  })

  test('Should work without an Authorization header', async () => {
    const { statusCode } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: entraRequestFixture
    })

    expect(statusCode).toBe(200)
  })

  test('Should ignore a supplied Authorization header', async () => {
    const { result } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      headers: { authorization: '******' },
      payload: entraRequestFixture
    })

    expect(result).toEqual(knownUserResponseFixture)
  })

  test('Should ignore unrelated request properties', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: { ...entraRequestFixture, unexpectedTopLevelProperty: true }
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual(knownUserResponseFixture)
  })

  test('Should not let one response mutate the result of a later call', async () => {
    const first = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: entraRequestFixture
    })

    first.result.data.actions[0].claims.applicationRoles.push('injected-role')

    const second = await server.inject({
      method: 'POST',
      url: '/identity/token-claims',
      payload: entraRequestFixture
    })

    expect(second.result).toEqual(knownUserResponseFixture)
  })
})
