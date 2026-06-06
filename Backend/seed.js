import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.model.js';
import Vendor from './models/Vendor.model.js';

const seed = async () => {
  // Connect to Database
  await connectDB();

  console.log('Clearing existing test users and vendors...');
  
  // Clean up existing test accounts (we only delete users with emails starting with test_)
  await User.deleteMany({ email: /^test_/ });
  await Vendor.deleteMany({ email: /^test_vendor/ });

  console.log('Generating password hashes...');
  const hashedPassword = await bcrypt.hash('TestPass123', 12);

  // 1. Create Admin
  const admin = await User.create({
    firstName: 'System',
    lastName: 'Admin',
    email: 'test_admin@vendorbridge.com',
    password: hashedPassword,
    role: 'admin',
    isVerified: true,
    isActive: true,
  });
  console.log('Created Admin User: test_admin@vendorbridge.com');

  // 2. Create Manager
  const manager = await User.create({
    firstName: 'Procurement',
    lastName: 'Manager',
    email: 'test_manager@vendorbridge.com',
    password: hashedPassword,
    role: 'manager',
    isVerified: true,
    isActive: true,
  });
  console.log('Created Manager User: test_manager@vendorbridge.com');

  // 3. Create Officer
  const officer = await User.create({
    firstName: 'Procurement',
    lastName: 'Officer',
    email: 'test_officer@vendorbridge.com',
    password: hashedPassword,
    role: 'officer',
    isVerified: true,
    isActive: true,
  });
  console.log('Created Officer User: test_officer@vendorbridge.com');

  // 4. Create Vendor User
  const vendorUser = await User.create({
    firstName: 'Acme',
    lastName: 'Supplier',
    email: 'test_vendor@vendorbridge.com',
    password: hashedPassword,
    role: 'vendor',
    isVerified: true,
    isActive: true,
  });
  console.log('Created Vendor User: test_vendor@vendorbridge.com');

  // 5. Create corresponding Vendor Profile
  await Vendor.create({
    companyName: 'Acme Supplies Pvt Ltd',
    category: 'Electronics',
    gstNumber: '29AAAAA1111A1Z1',
    contactPerson: 'Acme Supplier',
    email: 'test_vendor@vendorbridge.com',
    phone: '+919876543210',
    country: 'India',
    address: '123 Industrial Area, Phase II, Bangalore, KA, 560001',
    status: 'active',
    rating: 4.8,
    totalOrders: 12,
    totalSpend: 450000,
    linkedUser: vendorUser._id,
    createdBy: officer._id,
  });
  console.log('Created Vendor Profile for Acme Supplies Pvt Ltd');

  console.log('\n==================================================');
  console.log('SEEDING COMPLETED SUCCESSFULLY!');
  console.log('==================================================');
  console.log('Use the following credentials to log in:');
  console.log('Password for all users: TestPass123\n');
  console.log('1. Admin:     test_admin@vendorbridge.com');
  console.log('2. Manager:   test_manager@vendorbridge.com');
  console.log('3. Officer:   test_officer@vendorbridge.com');
  console.log('4. Vendor:    test_vendor@vendorbridge.com');
  console.log('==================================================\n');

  mongoose.connection.close();
};

seed().catch(err => {
  console.error('Error seeding database:', err);
  mongoose.connection.close();
});
