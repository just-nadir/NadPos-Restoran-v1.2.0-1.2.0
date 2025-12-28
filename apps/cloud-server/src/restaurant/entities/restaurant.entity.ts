import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('restaurants')
export class Restaurant {
    @PrimaryColumn('uuid')
    id: string;

    @Column()
    name: string;



    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ name: 'subscription_end_date', type: 'timestamp', nullable: true })
    subscriptionEndDate: Date;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'access_key', nullable: true })
    accessKey: string;
}
