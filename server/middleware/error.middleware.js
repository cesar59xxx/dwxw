/**
 * Middleware global de tratamento de erros
 */
export const errorHandler = (err, req, res, next) => {
  console.error("❌ Erro:", err)

  // Erro de validação do Mongoose
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({
      error: "Erro de validação",
      details: errors,
    })
  }

  // Erro de duplicação (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0]
    return res.status(409).json({
      error: `${field} já existe`,
    })
  }

  // Erro de cast do Mongoose (ID inválido)
  if (err.name === "CastError") {
    return res.status(400).json({
      error: "ID inválido",
    })
  }

  // Erro genérico
  res.status(err.statusCode || 500).json({
    error: err.message || "Erro interno do servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}

/**
 * Wrapper para async functions
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
