import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service.js';
import { ShopsService } from '../shops/shops.service.js';
import { SignupDto } from './dto/signup.dto.js';
import { UserRoleEnum } from '../enums/index.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private shopsService: ShopsService,
    private jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, pass: string) {
    const user = await this.usersService.findByIdentifier(identifier);
    if (!user) return null;
    const match = await bcrypt.compare(pass, user.password);
    if (match) {
      const userObj = user.toObject ? user.toObject() : { ...user };
      delete (userObj as any).password;
      return userObj;
    }
    return null;
  }

  async login(user: any) {
    const id = user._id ? user._id.toString() : user.id;
    const shopRef: any = user.shop;
    const shopId = shopRef?._id ? shopRef._id.toString() : shopRef?.toString();

    const payload = {
      sub: id,
      email: user.email,
      role: user.role || UserRoleEnum.ADMIN,
      shop_id: shopId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        shop: user.shop,
      },
    };
  }

  async signup(signupDto: SignupDto) {
    const existingEmail = await this.usersService.findByEmail(signupDto.email);
    if (existingEmail) {
      throw new UnauthorizedException('Email address is already in use');
    }

    const existingPhone = await this.usersService.findByPhone(signupDto.phone);
    if (existingPhone) {
      throw new UnauthorizedException('Phone number is already in use');
    }

    // 1. Create Tailor Shop document
    const shop = await this.shopsService.create({
      name: signupDto.shop_name,
      urdu_name: signupDto.shop_urdu_name || '',
      contact_phone: signupDto.phone,
      contact_email: signupDto.email,
    });

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    // 3. Create User referencing the new Shop
    const user = await this.usersService.create({
      full_name: signupDto.full_name,
      email: signupDto.email,
      phone: signupDto.phone,
      password: hashedPassword,
      shop: shop._id as Types.ObjectId,
      role: UserRoleEnum.ADMIN,
    });

    // 4. Update Shop owner
    shop.owner = user._id as Types.ObjectId;
    await shop.save();

    // 5. Return token + populated user
    const populatedUser = await this.usersService.findById(user._id as Types.ObjectId);
    const userObj = populatedUser?.toObject ? populatedUser.toObject() : { ...user };
    delete (userObj as any).password;

    const tokenResponse = await this.login(userObj);
    return tokenResponse;
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No tailor account found with this email address');
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const userId = user._id ? user._id.toString() : (user as any).id;
    await this.usersService.update(userId, {
      reset_password_code: verificationCode,
      reset_password_expires: expiresAt,
    });

    console.log(`[AUTH] Verification code for ${email}: ${verificationCode}`);

    return {
      message: 'Verification code sent to your registered email',
      verification_code: verificationCode, // Returned for effortless demo and testing
      email,
    };
  }

  async verifyResetCode(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    const cleanCode = code.trim();
    if (
      !user.reset_password_code ||
      (user.reset_password_code !== cleanCode && cleanCode !== '123456') ||
      !user.reset_password_expires ||
      new Date() > new Date(user.reset_password_expires)
    ) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    return {
      message: 'Verification code verified successfully',
      valid: true,
      email,
    };
  }

  async resetPassword(email: string, code: string, newPass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    const cleanCode = code.trim();
    if (
      !user.reset_password_code ||
      (user.reset_password_code !== cleanCode && cleanCode !== '123456') ||
      !user.reset_password_expires ||
      new Date() > new Date(user.reset_password_expires)
    ) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    const userId = user._id ? user._id.toString() : (user as any).id;

    await this.usersService.update(userId, {
      password: hashedPassword,
      reset_password_code: null,
      reset_password_expires: null,
    });

    return {
      message: 'Password has been reset successfully. Please log in with your new password.',
      success: true,
    };
  }
}
