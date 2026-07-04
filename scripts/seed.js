const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema definitions (running outside Next.js context)
const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'admin'], required: true },
  department: { type: String, trim: true },
  prn: { type: String, unique: true, sparse: true },
  semester: { type: Number, min: 1, max: 8 },
  designation: { type: String, trim: true },
  phone: { type: String, trim: true },
  cabinNumber: { type: String, trim: true },
  about: { type: String, maxlength: 500 },
  profilePhoto: { type: String },
  status: { type: String, enum: ['active', 'blocked', 'deleted'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-compass';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing users
    console.log('Clearing existing users...');
    await User.deleteMany({});

    // ─── Admin Account ──────────────────────────────────────────────
    const adminHash = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      fullName: 'System Administrator',
      email: 'admin@campus.edu',
      passwordHash: adminHash,
      role: 'admin',
      status: 'active',
    });
    console.log('✅ Admin: admin@campus.edu / admin123');

    // ─── Faculty Accounts ───────────────────────────────────────────
    const facultyData = [
      {
        fullName: 'Dr. Alan Turing',
        email: 'alan@faculty.edu',
        department: 'Computer Engineering',
        designation: 'Professor',
        phone: '9876543210',
        cabinNumber: 'A-201',
        about: 'Head of Computer Engineering department with research interests in AI and computation theory.',
      },
      {
        fullName: 'Dr. Ada Lovelace',
        email: 'ada@faculty.edu',
        department: 'Computer Engineering',
        designation: 'Associate Professor',
        phone: '9876543211',
        cabinNumber: 'A-202',
        about: 'Specializes in algorithms, programming languages, and computational mathematics.',
      },
      {
        fullName: 'Dr. Marie Curie',
        email: 'marie@faculty.edu',
        department: 'Electronics Engineering',
        designation: 'Professor',
        phone: '9876543212',
        cabinNumber: 'B-101',
        about: 'Expert in semiconductor physics and electronic materials.',
      },
      {
        fullName: 'Dr. Nikola Tesla',
        email: 'nikola@faculty.edu',
        department: 'Electrical Engineering',
        designation: 'Assistant Professor',
        phone: '9876543213',
        cabinNumber: 'C-305',
        about: 'Research in power systems, electric machines, and renewable energy.',
      },
    ];

    const facultyAccounts = [];
    for (const f of facultyData) {
      // Faculty default password = their email
      const hash = await bcrypt.hash(f.email, 12);
      const user = await User.create({
        ...f,
        passwordHash: hash,
        role: 'faculty',
        status: 'active',
        createdBy: admin._id,
      });
      facultyAccounts.push(user);
      console.log(`✅ Faculty: ${f.email} / ${f.email}`);
    }

    // ─── Student Accounts ───────────────────────────────────────────
    const studentData = [
      {
        fullName: 'Alice Smith',
        email: 'alice@student.edu',
        prn: 'PRN2024001',
        department: 'Computer Engineering',
        semester: 5,
      },
      {
        fullName: 'Bob Jones',
        email: 'bob@student.edu',
        prn: 'PRN2024002',
        department: 'Computer Engineering',
        semester: 5,
      },
      {
        fullName: 'Charlie Brown',
        email: 'charlie@student.edu',
        prn: 'PRN2024003',
        department: 'Electronics Engineering',
        semester: 3,
      },
      {
        fullName: 'Diana Prince',
        email: 'diana@student.edu',
        prn: 'PRN2024004',
        department: 'Electrical Engineering',
        semester: 7,
      },
    ];

    for (const s of studentData) {
      // Student default password = their PRN
      const hash = await bcrypt.hash(s.prn, 12);
      await User.create({
        ...s,
        passwordHash: hash,
        role: 'student',
        status: 'active',
        createdBy: admin._id,
      });
      console.log(`✅ Student: ${s.email} / ${s.prn}`);
    }

    console.log('\n──────────────────────────────────────────');
    console.log('✅ Seed complete!');
    console.log('──────────────────────────────────────────');
    console.log('Admin:    admin@campus.edu / admin123');
    console.log('Faculty:  alan@faculty.edu / alan@faculty.edu');
    console.log('Faculty:  ada@faculty.edu / ada@faculty.edu');
    console.log('Faculty:  marie@faculty.edu / marie@faculty.edu');
    console.log('Faculty:  nikola@faculty.edu / nikola@faculty.edu');
    console.log('Student:  alice@student.edu / PRN2024001');
    console.log('Student:  bob@student.edu / PRN2024002');
    console.log('Student:  charlie@student.edu / PRN2024003');
    console.log('Student:  diana@student.edu / PRN2024004');
    console.log('──────────────────────────────────────────');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
