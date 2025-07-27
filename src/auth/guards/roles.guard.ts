import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '@prisma/client'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { RequestWithJwtUser } from '../types/auth.types'

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()]
		)

		if (!requiredRoles || requiredRoles.length === 0) {
			return true
		}

		const request = context.switchToHttp().getRequest<RequestWithJwtUser>()
		const user = request.user

		if (!user || !user.role) {
			throw new ForbiddenException(
				'Пользователь не аутентифицирован или не имеет роли.'
			)
		}

		const hasRequiredRole = requiredRoles.some(role => user.role === role)

		if (hasRequiredRole) {
			return true
		} else {
			throw new ForbiddenException(
				'У вас недостаточно прав для доступа к этому ресурсу.'
			)
		}
	}
}
