// Central error handler. Converts common Mongo/Mongoose errors into clean JSON responses.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 11000) {
    // Duplicate key error (unique index violation)
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: `${field} already exists` });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id format' });
  }

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
