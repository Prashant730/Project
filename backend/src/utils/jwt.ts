import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  // Log a visible warning to help developers notice missing configuration
  // In production, you should set a strong secret via environment variable.
  // Falling back to an insecure default here to avoid runtime crashes in demos.
  // DO NOT use this default in production.
  // eslint-disable-next-line no-console
  console.warn(
    'Warning: JWT_SECRET is not set. Using insecure default (for development only).',
  )
}
const SECRET = JWT_SECRET || 'change_me_in_production'

export const generateToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, SECRET, {
    expiresIn: '1d',
  })
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET)
}
