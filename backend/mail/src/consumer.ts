import amqp from "amqplib";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export const startSendOtpEmailConsumer = async () => {
    try {
        const connection = await amqp.connect({
            protocol: "amqp"!,
            hostname: process.env.RABBITMQ_HOST!,
            port: 5672,
            username: process.env.RABBITMQ_USER!,
            password: process.env.RABBITMQ_PASSWORD!,
        });
        const channel = await connection.createChannel();
        const queue = "send-otp";
        await channel.assertQueue(queue, { durable: true });
        channel.consume(queue, async (msg) => {
            if (msg) {
                try {
                    const {to,subject,body} = JSON.parse(msg.content.toString());
                    // Process the email sending logic here
                    const transporter=nodemailer.createTransport({
                        host:"smtp.gmail.com",
                        port:465,
                        auth:{
                            user: process.env.USER,
                            pass: process.env.PASSWORD,
                        }
                    });

                    await transporter.sendMail({
                        from: "ChatApp",
                        to,
                        subject,
                        text: body,
                    });

                    console.log(`OTP mail sent to ${to}`);
                    channel.ack(msg);
                } catch (error) {
                    console.error("Failed to send OTP email:", error);
                }
            }
        });
        console.log(`Consumer Mail Service has started and is waiting for otp`);
    } catch (error) {        
        console.error("Error in consumer:", error);
    }
}
