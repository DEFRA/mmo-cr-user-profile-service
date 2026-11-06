import { health } from '#/routes/health.js'
import { example } from '#/routes/example.js'
import { identity } from '#/routes/identity.js'
import { userRoles } from '#/routes/userRoles.js'
import { roleDefinitions } from '#/routes/roleDefinitions.js'

export const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route(
        [health, identity, userRoles, roleDefinitions].concat(example)
      )
    }
  }
}
