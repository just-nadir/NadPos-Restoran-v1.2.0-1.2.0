import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import * as crypto from 'crypto';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant)
        private restaurantRepository: Repository<Restaurant>,
    ) { }

    async create(createRestaurantDto: CreateRestaurantDto) {
        const restaurant = this.restaurantRepository.create({
            id: crypto.randomUUID(),
            accessKey: crypto.randomBytes(16).toString('hex'), // Secure random key
            isActive: true, // Default to active
            ...createRestaurantDto
        });
        return await this.restaurantRepository.save(restaurant);
    }

    async findAll() {
        return await this.restaurantRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string) {
        const restaurant = await this.restaurantRepository.findOne({ where: { id } });
        if (!restaurant) {
            throw new NotFoundException(`Restaurant with ID ${id} not found`);
        }
        return restaurant;
    }

    async update(id: string, updateRestaurantDto: UpdateRestaurantDto) {
        const restaurant = await this.findOne(id);
        const updated = this.restaurantRepository.merge(restaurant, updateRestaurantDto);
        return await this.restaurantRepository.save(updated);
    }

    async remove(id: string) {
        const restaurant = await this.findOne(id);
        return await this.restaurantRepository.remove(restaurant);
    }

    async verify(id: string, accessKey: string) {
        const restaurant = await this.restaurantRepository.findOne({ where: { id, accessKey } });
        if (!restaurant) {
            throw new NotFoundException('Invalid credentials');
        }

        if (!restaurant.isActive) {
            throw new ForbiddenException('Restoran nofaol holatda. Administratorga boglaning.');
        }

        if (restaurant.subscriptionEndDate && new Date() > new Date(restaurant.subscriptionEndDate)) {
            throw new ForbiddenException('Obuna muddati tugagan. Administratorga boglaning.');
        }

        return { valid: true, restaurant };
    }
}
