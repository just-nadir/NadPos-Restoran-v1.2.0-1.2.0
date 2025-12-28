export class CreateRestaurantDto {
    name: string;
    phone?: string;
    address?: string;
    subscriptionEndDate?: Date;
    isActive?: boolean;
}
