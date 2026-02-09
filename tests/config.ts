// Configuration des tests E2E
export const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  headless: process.env.TEST_HEADLESS !== 'false',
  slowMo: parseInt(process.env.TEST_SLOW_MO || '0'),
  timeout: 60000,

  // Credentials de test
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test@evalup.fr',
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
  },

  // Stripe test card
  stripe: {
    cardNumber: '4242424242424242',
    expiry: '12/28',
    cvc: '123',
    zip: '75001',
  },

  // Paths
  paths: {
    logs: './tests/logs',
    reports: './tests/reports',
    screenshots: './tests/screenshots',
  },
}

// SIRENs de test valides (entreprises réelles pour tests)
export const TEST_SIRENS = {
  // PME classiques
  boulangerie: '443061841',      // Une boulangerie réelle
  restaurant: '523456789',       // Restaurant (fictif mais Luhn valid)

  // Entreprises connues (pour tests avec vraies données Pappers)
  totalEnergies: '552032534',    // Total Energies
  carrefour: '652014051',        // Carrefour
  orange: '380129866',           // Orange

  // Pour tests d'erreur
  invalid: '123456789',          // Invalide Luhn
  inexistant: '732829320',       // Valide Luhn mais peut ne pas exister
}
