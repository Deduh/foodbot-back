import { AuthenticatedUser } from "./jwt.types"

export interface RequestWithJwtUser extends Express.Request {
	user: AuthenticatedUser
}
