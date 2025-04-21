import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum ScheduleStatus {
    Pending = 'pending',      // Ожидает выполнения
    Processing = 'processing', // В процессе выполнения
    Completed = 'completed',    // Успешно выполнено (для одноразовых)
    Error = 'error',          // Произошла ошибка
    // Active = 'active', // Больше не используем
}

@Entity('scheduled_messages')
export class ScheduledMessage {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    messageText!: string;

    @Column('varchar')
    cronFrequency!: string;

    @Column({ type: 'varchar', nullable: true }) // Уникальный ID задачи в node-cron (если нужно будет управлять ей извне)
    jobId?: string | null; 

    @Column({
        type: 'enum',
        enum: ScheduleStatus,
        default: ScheduleStatus.Pending,
    })
    status!: ScheduleStatus;

    @Column({ type: 'timestamp with time zone' })
    nextRunAt!: Date;
    
    @Column({ type: 'timestamp with time zone', nullable: true })
    lastRunAt?: Date | null;

    @Column({ type: 'text', nullable: true })
    errorMessage?: string | null;

    // Связь с пользователем
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    userId!: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt!: Date;
} 