const mqtt = require('mqtt');
const pool = require('./db');
require('dotenv').config();

const client = mqtt.connect(process.env.MQTT_BROKER);

// ✅ Conexão com MQTT e inscrição
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

// ✅ Tratamento de mensagens recebidas
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

// ✅ Erros de conexão MQTT
client.on('error', (err) => {
  console.error('❌ Erro no MQTT:', err.message);
});

// ✅ Verificar conexão com o banco MySQL
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado ao MySQL com sucesso');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar no MySQL:', err.message);
  });
app.listen(process.env.PORT || 3001, () => {
  console.log(`🚀 Backend rodando na porta ${process.env.PORT || 3001}`);
});

