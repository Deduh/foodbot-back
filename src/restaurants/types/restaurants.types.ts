import { Restaurant, User } from "@prisma/client"

export type RestaurantWithOwner = Restaurant & { owners: User[] }
