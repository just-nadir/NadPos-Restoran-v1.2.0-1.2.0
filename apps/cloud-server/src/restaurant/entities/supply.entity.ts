import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('supplies')
export class Supply {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ name: 'restaurant_id' })
    restaurantId: string;

    @Column({ name: 'supplier_name', nullable: true })
    supplierName: string;

    @Column({ type: 'timestamp', nullable: true })
    date: Date;

    @Column({ default: 'draft' })
    status: string;

    @Column({ name: 'total_amount', type: 'float', default: 0 })
    totalAmount: number;

    @Column({ nullable: true })
    note: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
    completedAt: Date;

    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
