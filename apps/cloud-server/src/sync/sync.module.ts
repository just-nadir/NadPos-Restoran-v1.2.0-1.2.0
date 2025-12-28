import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { RestaurantModule } from '../restaurant/restaurant.module';

@Module({
    imports: [RestaurantModule],
    controllers: [SyncController],
    providers: [SyncService],
})
export class SyncModule { }
