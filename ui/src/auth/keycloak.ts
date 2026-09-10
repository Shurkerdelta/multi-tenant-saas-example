import Keycloak from 'keycloak-js'

// Demo-appropriate defaults matching docker-compose.yml / keycloak/realm-export.json.
// Override via .env (see .env.example) if you point this at a different Keycloak.
export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'multitenant-saas',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'multitenant-saas-api',
})
