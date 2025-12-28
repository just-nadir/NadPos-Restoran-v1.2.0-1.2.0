import { Controller, Post, Get, Body, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncPushDto, SyncPullDto } from './dto/sync-payload.dto';
import { RestaurantService } from '../restaurant/restaurant.service';

@Controller('sync')
export class SyncController {
    constructor(
        private readonly syncService: SyncService,
        private readonly restaurantService: RestaurantService
    ) { }

    @Post('push')
    async push(@Body() body: SyncPushDto, @Headers('x-access-key') accessKey: string) {
        await this.verifyAccess(body.restaurantId, accessKey);
        return this.syncService.push(body);
    }

    @Get('pull')
    async pull(@Query() query: SyncPullDto, @Headers('x-access-key') accessKey: string) {
        await this.verifyAccess(query.restaurantId, accessKey);
        return this.syncService.pull(query);
    }

    private async verifyAccess(id: string, key: string) {
        const result = await this.restaurantService.verify(id, key);
        if (!result.valid) {
            throw new UnauthorizedException('Invalid credentials');
        }
    }
}
