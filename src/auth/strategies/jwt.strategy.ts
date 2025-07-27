import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthenticatedUser, JwtPayload } from '../types/jwt.types'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private configService: ConfigService) {
		const jwtSecret = configService.get<string>('JWT_SECRET')

		if (!jwtSecret) {
			throw new InternalServerErrorException(
				'JWT_SECRET не определен в переменных окружения!'
			)
		}

		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtSecret,
		})
	}

	validate(payload: JwtPayload): AuthenticatedUser {
		return {
			userId: payload.sub,
			email: payload.email,
			role: payload.role,
			restaurantId: payload.restaurantId,
		}
	}
}
