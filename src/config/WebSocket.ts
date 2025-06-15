import {Server, Socket} from "socket.io";
import {Server as HTTPServer} from "http";
import NotificationService from "@/service/NotificationService";
import {INotification} from "@/types/Notification";

class WebSocket {
    private static io: Server | undefined;

    static boot(server: HTTPServer): void {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                allowedHeaders: ["Content-Type"],
                credentials: true
            }
        });

        this.io.on('connection', (socket: Socket) => {
            console.log('A user connected with socket id:', socket.id);
            socket.on('join', async (userId: string) => {
                if (!userId) return;
                socket.join(userId);
                console.log(`User with ID ${userId} joined room.`);
                const initialData = await NotificationService.getNotificationsByUser(userId, { page: 1, limit: 10 });

                socket.emit('initial_notifications', initialData);
            });

            socket.on('disconnect', () => {
                console.log('User disconnected', socket.id);
            });
        });
    }

    static sendNotificationToUser(userId: string, notification: INotification) {
        if (this.io) {
            this.io.to(userId).emit('new_notification', notification);
            console.log(`📡 WebSocket | Sent notification to user ID: ${userId}`);
        }
    }
}

export default WebSocket;
