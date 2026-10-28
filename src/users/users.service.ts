import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .populate('shop')
      .exec();
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    return this.userModel
      .findOne({ phone: { $regex: cleanPhone, $options: 'i' } })
      .populate('shop')
      .exec();
  }

  async findByIdentifier(identifier: string): Promise<UserDocument | null> {
    const clean = identifier.trim();
    if (clean.includes('@')) {
      return this.findByEmail(clean);
    }
    return this.findByPhone(clean);
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).populate('shop').exec();
  }

  async update(id: string | Types.ObjectId, updateData: Partial<User>): Promise<UserDocument> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('shop')
      .exec();
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }
}
