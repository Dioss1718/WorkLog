const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const express = require('express');

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const dataRoutes = require('./routes/data');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.send('Productivity Tracker API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));