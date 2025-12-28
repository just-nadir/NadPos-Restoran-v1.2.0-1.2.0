import { Controller, Get, Param, Headers } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';

@Controller('restaurants')
export class RestaurantController {
    constructor(private readonly restaurantService: RestaurantService) { }

    @Get(':id/verify')
    async verify(@Param('id') id: string, @Headers('x-access-key') accessKey: string) {
        return await this.restaurantService.verify(id, accessKey);
    }
}
