const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conexión a la base de datos establecida');
  } catch (error) {
    console.error('Error al conectar con MongoDB', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
