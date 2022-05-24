const express = require('express');
const kafka = require('kafka-node');
const app = express();
const sequelize = require('sequelize');
const axios = require('axios');

app.use(express.json());

const dbsAreRunning = async () => {
  const db = new sequelize(process.env.POSTGRES_URL);
  const User = db.define('user', {
    name: sequelize.STRING,
    email: sequelize.STRING,
    password: sequelize.STRING,
  });
  db.sync({ force: true });
  const client = new kafka.KafkaClient({
    kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS,
  });
  const producer = new kafka.Producer(client);
  producer.on('ready', async () => {
    console.log('producer ready');
    app.post('/', async (req, res) => {
      producer.send(
        [
          {
            topic: process.env.KAFKA_TOPIC,
            messages: JSON.stringify(req.body),
          },
        ],
        async (err, data) => {
          if (err) console.log('Error', err);
          else {
            var config = {
              method: 'get',
              url: `https://ubiquity.api.blockdaemon.com/v2/${req.body.platform}/${req.body.network}/account/${req.body.address}`,
              headers: {
                Authorization: `Bearer bd1aPlXYQn3WMpHKpDKXnmtXGfAAhddDQc2xHZ007LRtZif`,
              },
            };
            const response = await axios(config);
            // console.log('Response', response.data);
            res.send(response.data);
            // await User.create(req.body);
            // res.send(req.body);
          }
        }
      );
    });
  });
};

setTimeout(dbsAreRunning, 1000);

app.listen(process.env.PORT);
