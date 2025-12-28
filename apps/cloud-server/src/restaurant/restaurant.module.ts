import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { AdminRestaurantController } from './admin-restaurant.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant])],
    providers: [RestaurantService],
    controllers: [RestaurantController, AdminRestaurantController],
    exports: [RestaurantService],
})
export class RestaurantModule { }
