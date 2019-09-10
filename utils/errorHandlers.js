const throw404Error = (resource) => {
  const err = new Error(`${resource} not found`)
  err.status = 404
  err.name = 'Not Found'
  return err
}

module.exports = throw404Error
