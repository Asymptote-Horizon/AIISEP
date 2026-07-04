import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/app/lib/db';
import User from '@/app/models/User';
import { requireAdmin, apiError, handleAuthError } from '@/app/lib/permissions';

// POST /api/load-data - Bulk upload users from Excel (Admin only)
export async function POST(request) {
  try {
    const session = await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { users: usersData, role } = body;

    if (!usersData || !Array.isArray(usersData) || usersData.length === 0) {
      return apiError('No user data provided', 400);
    }

    if (!['student', 'faculty'].includes(role)) {
      return apiError('Invalid role. Must be student or faculty.', 400);
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < usersData.length; i++) {
      const row = usersData[i];
      const rowNum = i + 1;

      try {
        // Validate required fields
        if (role === 'student') {
          if (!row.fullName || !row.prn || !row.department || !row.semester || !row.email) {
            results.errors.push({ row: rowNum, error: 'Missing required fields (fullName, prn, department, semester, email)' });
            results.skipped++;
            continue;
          }

          // Check duplicate PRN
          const existingPrn = await User.findOne({ prn: row.prn });
          if (existingPrn) {
            results.errors.push({ row: rowNum, error: `Duplicate PRN: ${row.prn}` });
            results.skipped++;
            continue;
          }
        } else {
          // Faculty
          if (!row.fullName || !row.email || !row.department) {
            results.errors.push({ row: rowNum, error: 'Missing required fields (fullName, email, department)' });
            results.skipped++;
            continue;
          }
        }

        // Check duplicate email
        const existingEmail = await User.findOne({ email: row.email.toLowerCase() });
        if (existingEmail) {
          results.errors.push({ row: rowNum, error: `Duplicate email: ${row.email}` });
          results.skipped++;
          continue;
        }

        // Set default password per PRD policy
        const defaultPassword = role === 'student' ? row.prn : row.email.toLowerCase();
        const passwordHash = await bcrypt.hash(defaultPassword, 12);

        const userData = {
          fullName: row.fullName.trim(),
          email: row.email.toLowerCase().trim(),
          passwordHash,
          role,
          department: row.department?.trim(),
          status: 'active',
          createdBy: session.user.id,
        };

        if (role === 'student') {
          userData.prn = row.prn.trim();
          userData.semester = parseInt(row.semester);
        }

        if (role === 'faculty') {
          userData.designation = row.designation?.trim() || undefined;
        }

        await User.create(userData);
        results.created++;

        // TODO: Send welcome email

      } catch (err) {
        results.errors.push({ row: rowNum, error: err.message });
        results.skipped++;
      }
    }

    return NextResponse.json({
      message: `Bulk upload complete: ${results.created} created, ${results.skipped} skipped`,
      ...results,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
