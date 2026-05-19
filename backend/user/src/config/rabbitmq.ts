import ampl from "amqplib"

let channel: ampl.Channel;

export const connectRabbit = async () => {
    try {
        const connection = await ampl.connect({
            protocol: "amqp"!,
            hostname: process.env.RABBITMQ_HOST || "localhost"!,
            port: 5672,
            username: process.env.RABBITMQ_USER!,
            password: process.env.RABBITMQ_PASSWORD!,
        });
        channel = await connection.createChannel();
        console.log("Connected to RabbitMQ");
    } catch (error) {
        console.error("Failed to connect to RabbitMQ", error);
        process.exit(1);
    }
};

export const publishToQueue = async (queueName: string, message: any) => {
  if (!channel) {
    console.log("Rabbitmq channel is not initalized");
    return;
  }

  await channel.assertQueue(queueName, { durable: true });

  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
};