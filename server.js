const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(require('cookie-parser')());

// Enable CORS
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));


// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/products', require('./routes/product'));
app.use('/api/v1/categories', require('./routes/category'));
app.use('/api/v1/product-types', require('./routes/productType'));
app.use('/api/v1/users', require('./routes/user'));
app.use('/api/v1/payments', require('./routes/payment'));
app.use('/api/v1/queries', require('./routes/query'));

app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'API is running...' });
});

app.use(require('./middleware/error'));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
