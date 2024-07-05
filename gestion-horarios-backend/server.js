const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const Usuario = require('./models/Usuario');
const Evento = require('./models/Evento');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const PORT = process.env.PORT || 3000;

// Ruta de registro de usuario
app.post('/registro', async (req, res) => {
  const { nombre, correo, contraseña, rol } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const usuario = await Usuario.create({ nombre, correo, contraseña: hashedPassword, rol });
    res.status(201).json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

// Ruta de login
app.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isPasswordValid = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Ruta para crear un evento
app.post('/eventos', upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'documento', maxCount: 1 }]), async (req, res) => {
  const { titulo, descripcion, fecha } = req.body;
  const imagen = req.files['imagen'] ? req.files['imagen'][0].filename : null;
  const documento = req.files['documento'] ? req.files['documento'][0].filename : null;

  try {
    const evento = await Evento.create({ titulo, descripcion, fecha, imagen, documento });
    res.status(201).json(evento);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el evento' });
  }
});

// Ruta para obtener todos los eventos
app.get('/eventos', async (req, res) => {
  try {
    const eventos = await Evento.findAll();
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los eventos' });
  }
});

// Sincronizar la base de datos y empezar a escuchar
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
