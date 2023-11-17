const isProd = process.env.NODE_ENV === 'production'
const REACT_APP = isProd ? 'REACT_APP' : 'REACT_APP_DEV'
const BACKEND_PORT = process.env[`${REACT_APP}_BACKEND_PORT`]

export const envConfig = {
  BACKEND_PORT,
}
