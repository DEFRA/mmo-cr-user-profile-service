import { buildTokenClaimsResponse } from './tokenClaimsService.js'

describe('#tokenClaimsService', () => {
  test('Should return assigned applicationRoles for a known user', () => {
    const response = buildTokenClaimsResponse(
      '11111111-2222-3333-4444-555555555555'
    )

    expect(response).toEqual({
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

  test('Should return an empty applicationRoles collection for an unknown user', () => {
    const response = buildTokenClaimsResponse('unknown-user')

    expect(response.data.actions[0].claims.applicationRoles).toEqual([])
  })

  test('Should return an empty applicationRoles collection when the user identifier is missing', () => {
    const response = buildTokenClaimsResponse(undefined)

    expect(response.data.actions[0].claims.applicationRoles).toEqual([])
  })

  test('Should not return role capabilities in the claims response', () => {
    const response = buildTokenClaimsResponse(
      '11111111-2222-3333-4444-555555555555'
    )

    expect(response.data.actions[0].claims).not.toHaveProperty('capabilities')
  })
})
