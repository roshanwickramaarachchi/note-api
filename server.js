const express = require('express')
const dotenv = require('dotenv')
const colors = require('colors')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')
const connectDB = require('./config/db')
const morgan = require('morgan')
const errorHandler = require('./middleware/error')

//load env var
dotenv.config({ path: './config/config.env' })

// Connect to database
connectDB();

// Route files
const notes = require('./routes/notes')
const auth = require('./routes/auth')

const app = express()

// Body parser
app.use(express.json({ limit: '15mb' }))

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Sanitize data // My-avoid NoSQL injecter
app.use(mongoSanitize())

// set security headers
app.use(helmet())

// Prevent XSS attacks
app.use(xss())

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100
});
app.use(limiter)

// Prevent http param pollution
app.use(hpp())

// Enable CORS
app.use(cors())

// Mount routers
app.use('/api/v1/notes', notes)
app.use('/api/v1/auth', auth)

// my-error hadle
app.use(errorHandler);

const PORT = process.env.PORT || 5000

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold,
  ),
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red)
  // Close server & exit process
  server.close(() => process.exit(1))
})