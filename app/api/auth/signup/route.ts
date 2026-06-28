import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, studentId, batchYear, phone, constitutionAcknowledged } = await request.json();

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and fullName are required' },
        { status: 400 }
      );
    }

    if (!constitutionAcknowledged) {
      return NextResponse.json(
        { error: 'You must acknowledge the CSEDU Constitution to register' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if student ID exists
    if (studentId) {
      const existingStudent = await prisma.members.findUnique({
        where: { student_id: studentId },
      });
      if (existingStudent) {
        return NextResponse.json(
          { error: 'Student ID already registered' },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and member in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          email,
          password_hash: hashedPassword,
          role: 'MEMBER',
        },
      });

      const newMember = await tx.members.create({
        data: {
          user_id: newUser.id,
          full_name: fullName,
          student_id: studentId || `STU-${Date.now()}`,
          batch_year: parseInt(batchYear) || new Date().getFullYear(),
          phone: phone || null,
          constitution_acknowledged: true,
          status: 'PENDING',
        },
      });

      return { user: newUser, member: newMember };
    });

    // Send notification email to EC
    const ecEmails = (process.env.EC_NOTIFICATION_EMAIL || 'ec@csedu-club.com').split(',');
    
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: ecEmails.join(','),
        subject: `New Registration: ${fullName}`,
        html: `
          <h2>New Member Registration</h2>
          <p>A new user has registered for the CSEDU Portal:</p>
          <ul>
            <li><strong>Name:</strong> ${fullName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Student ID:</strong> ${studentId || 'N/A'}</li>
            <li><strong>Batch Year:</strong> ${batchYear || 'N/A'}</li>
            <li><strong>Phone:</strong> ${phone || 'N/A'}</li>
          </ul>
          <p>Please review and approve this registration in the admin dashboard.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the registration if email fails
    }

    // Log audit
    await prisma.audit_log.create({
      data: {
        actor_id: result.user.id as any,
        action: 'USER_SIGNUP',
        entity_type: 'users',
        entity_id: result.user.id as any,
      },
    });

    return NextResponse.json(
      {
        message: 'User registered successfully',
        userId: result.user.id,
        memberId: result.member.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
