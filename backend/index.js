const express = require('express');
const mqtt = require('mqtt');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json()); // Para permitir POST com JSON

// ✅ Conexão com MQTT
const client = mqtt.connect(process.env.MQTT_BROKER);

client.on('connect', () => {
  console.log('✅ Conectado ao broker MQTT');
  client.subscribe(process.env.MQTT_TOPIC, (err) => {
    if (err) {
      console.error('❌ Erro ao se inscrever no tópico:', err.message);
    } else {
      console.log(`📡 Inscrito no tópico ${process.env.MQTT_TOPIC}`);
    }
  });
});

client.on('message', async (topic, message) => {
  try {
    const { id, latitude, longitude, timestamp } = JSON.parse(message.toString());

    await pool.query(
      'INSERT INTO coordenadas (objeto_id, latitude, longitude, timestamp) VALUES (?, ?, ?, ?)',
      [id, latitude, longitude, timestamp]
    );

    console.log('✅ Salvo no banco:', id);
  } catch (err) {
    console.error('❌ Erro ao salvar mensagem no banco:', err.message);
  }
});

client.on('error', (err) => {
  console.error('❌ Erro no MQTT:', err.message);
});

// ✅ Verificação de conexão com MySQL
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado ao MySQL com sucesso');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar no MySQL:', err.message);
  });

// ✅ Rota de teste
app.get('/', (req, res) => {
  res.send('API do GPS Tracker funcionando!');
});

// ✅ (Opcional) Endpoint para pegar coordenadas do banco
app.get('/coordenadas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM coordenadas ORDER BY timestamp DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// ✅ Inicia o servidor
app.listen(process.env.PORT || 3001, () => {
  console.log(`🚀 Backend rodando na porta ${process.env.PORT || 3001}`);
});
