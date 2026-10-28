import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UsersService } from '../users/users.service.js';
import { ConfigService } from '@nestjs/config';
import { UserRoleEnum } from '../enums/index.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'supersecret_jwt_key_silayi_master',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) return null;
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete (userObj as any).password;
    if (!userObj.role) {
      userObj.role = payload.role || UserRoleEnum.ADMIN;
    }
    const shopRef: any = userObj.shop;
    userObj.shop_id = shopRef?._id ? shopRef._id.toString() : shopRef?.toString();
    return userObj;
  }
}
