const checkOwner = (req, res, next) => {
  if (req.article.author._id.toString() !== req.payload.id.toString()) {
    const err = new Error('Only the owner can perform this action')
    err.status = 403
    err.name = 'Forbidden'
    next(err)
  }
  return next()
}

module.exports = checkOwner
