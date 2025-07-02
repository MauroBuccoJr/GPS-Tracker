const mqtt = require('mqtt'); const pool = require('./db'); 
require('dotenv').config(); const client = mqtt.connect(process.env.MQTT_BROKER); 
client.on('connect', () => {
  console.log('MQTT conectado'); client.subscribe(process.env.MQTT_TOPIC);
});
client.on('message', async (topic, message) => { try { const { id, latitude, 
    longitude, timestamp } = JSON.parse(message.toString()); await pool.query(
      'INSERT INTO coordenadas (objeto_id, latitude, longitude, timestamp) VALUES 
      (?, ?, ?, ?)', [id, latitude, longitude, timestamp]
    ); console.log('Salvo no banco:', id);
  } catch (err) {
    console.error('Erro ao salvar:', err.message);
  }
});
