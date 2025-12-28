import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { SyncModule } from './sync/sync.module';
import { SyncController } from './sync/sync.controller';
import { SyncService } from './sync/sync.service';
import { RestaurantModule } from './restaurant/restaurant.module';
import { Restaurant } from './restaurant/entities/restaurant.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'nadpos_root',
      password: 'SecretPassword123!',
      database: 'nadpos_cloud',
      entities: [Restaurant],
      synchronize: false,
      logging: false, // Prod setting
    }),
    RestaurantModule,
  ],
  controllers: [AppController, SyncController],
  providers: [AppService, SyncService],
})
export class AppModule { }
