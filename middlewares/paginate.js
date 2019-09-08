
const paginate = (req, res, next) => {
  let { limit, page } = req.query

  page = (typeof page === 'string') ? parseInt(page, 10) || 1 : 1
  limit = (typeof limit === 'string') ? parseInt(limit, 10) || 0 : 10

  if (page < 1) { page = 1 }
  if (limit < 0) { limit = 0 }

  const offset = limit * (page - 1)

  req.query.limit = limit
  req.query.offset = offset
  req.query.page = page
  return next()
}

module.exports = paginate
