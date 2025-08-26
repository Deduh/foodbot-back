import { Restaurant, User } from "@prisma/client"

export type UserWithRestaurant = User & { restaurant: Restaurant | null }
