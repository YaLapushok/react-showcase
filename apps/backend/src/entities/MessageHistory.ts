import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('message_history')
export class MessageHistory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text') // Текст отправленного сообщения
    messageText!: string;

    @Column('varchar') // Частота Cron, с которой было отправлено
    cronFrequency!: string;

    @Column('varchar') // Email получателя (в нашем случае - email пользователя)
    recipientEmail!: string;

    @CreateDateColumn() // Время фактической отправки
    sentAt!: Date;

    @Column({ type: 'boolean', default: true }) // Статус отправки
    isSuccess!: boolean;

    @Column({ type: 'text', nullable: true }) // Сообщение об ошибке, если isSuccess = false
    errorMessage?: string | null;

    // Связь с пользователем (много записей истории - один пользователь)
    @ManyToOne(() => User, (user: User) => user.messageHistory, { onDelete: 'CASCADE' }) // Удалять историю при удалении пользователя
    @JoinColumn({ name: 'userId' }) // Внешний ключ
    user!: User;

    @Column() // Храним userId для простоты запросов
    userId!: string;
} 