/// <reference types="node" />
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User';

const env = (process as any).env;

const createAdmin = async () => {
  try {
    await mongoose.connect(env.MONGO_URI as string);
    (console as any).log('MongoDB connected');
    const existing = await User.findOne({ email: 'Vastuarya@Admin.com' });
    if (existing) {
      existing.password = 'Admin@2407@';
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save();
      (console as any).log('Admin password updated');
    } else {
      await User.create({
        name: 'Vastu Arya Admin',
        email: 'Vastuarya@Admin.com',
        password: 'Admin@2407@',
        role: 'admin',
        isActive: true,
        phone: '9999999999',
      });
      (console as any).log('Admin created');
    }
    (console as any).log('Email: Vastuarya@Admin.com');
    (console as any).log('Password: Admin@2407@');
  } catch (error) {
    (console as any).error('Error:', error);
  } finally {
    await mongoose.disconnect();
    (process as any).exit(0);
  }
};

createAdmin();
