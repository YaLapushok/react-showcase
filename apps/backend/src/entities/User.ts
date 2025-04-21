import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { MessageHistory } from './MessageHistory'; // Раскомментирован импорт

@Entity('users') // Имя таблицы в БД
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 255 })
    password!: string; // Храниться будет хэш

    @Column({ type: 'boolean', default: false })
    isVerified!: boolean;

    @Column({ type: 'varchar', nullable: true }) // Токен для верификации email
    verificationToken?: string | null;

    @Column({ type: 'timestamp', nullable: true }) // Время жизни токена верификации
    verificationTokenExpires?: Date | null;

    @Column({ type: 'varchar', nullable: true }) // Токен для сброса пароля
    resetPasswordToken?: string | null;

    @Column({ type: 'timestamp', nullable: true }) // Время жизни токена сброса
    resetPasswordTokenExpires?: Date | null;

    // Связь с историей сообщений (один пользователь - много записей истории)
    @OneToMany(() => MessageHistory, (history: MessageHistory) => history.user)
    messageHistory!: MessageHistory[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 