import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/app/lib/db';
import User from '@/app/models/User';
import {
  requireAuth,
  requireAdmin,
  isAdmin,
  apiError,
  handleAuthError,
} from '@/app/lib/permissions';

// GET /api/users - List users with filters
export async function GET(request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const department = searchParams.get('department') || '';
    const semester = searchParams.get('semester') || '';
    const status = searchParams.get('status') || 'active';

    let query = {};

    // Non-admin users can only see active users
    if (!isAdmin(session)) {
      query.status = 'active';
    } else if (status) {
      query.status = status;
    }

    if (role) {
      query.role = role;
    }

    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    if (semester) {
      query.semester = parseInt(semester);
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { prn: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ fullName: 1 })
      .lean();

    return NextResponse.json(users);
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/users - Create a new user (Admin only)
export async function POST(request) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { fullName, email, role, department, prn, semester, designation } = body;

    if (!fullName || !email || !role) {
      return apiError('Full name, email, and role are required', 400);
    }

    if (!['student', 'faculty'].includes(role)) {
      return apiError('Invalid role. Must be student or faculty.', 400);
    }

    // Check for duplicate email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return apiError('A user with this email already exists', 409);
    }

    // Student-specific validation
    if (role === 'student') {
      if (!prn) {
        return apiError('PRN is required for students', 400);
      }
      const existingPrn = await User.findOne({ prn });
      if (existingPrn) {
        return apiError('A student with this PRN already exists', 409);
      }
    }

    // Set default password per PRD policy
    // Student: password = PRN | Faculty: password = email
    const defaultPassword = role === 'student' ? prn : email.toLowerCase();
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const session = await requireAdmin();
    const userData = {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      department: department?.trim() || undefined,
      status: 'active',
      createdBy: session.user.id,
    };

    if (role === 'student') {
      userData.prn = prn.trim();
      userData.semester = semester ? parseInt(semester) : undefined;
    }

    if (role === 'faculty') {
      userData.designation = designation?.trim() || undefined;
    }

    const user = await User.create(userData);

    // TODO: Send welcome email with credentials

    return NextResponse.json(
      {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        prn: user.prn,
        semester: user.semester,
        designation: user.designation,
        status: user.status,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
