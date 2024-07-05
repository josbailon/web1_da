const sequelize = require('./config/database');
const Usuario = require('./models/Usuario');
const Evento = require('./models/Evento');

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Base de datos sincronizada.');
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
  }
};

syncDatabase();
