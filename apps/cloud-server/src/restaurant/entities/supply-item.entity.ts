import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('supply_items')
export class SupplyItem {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ name: 'restaurant_id' })
    restaurantId: string;

    @Column({ name: 'supply_id' })
    supplyId: string;

    @Column({ name: 'product_id' })
    productId: string;

    @Column({ type: 'float' })
    quantity: number;

    @Column({ type: 'float' })
    price: number;

    @Column({ type: 'float' })
    total: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
