import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, studentId, batchYear, phone, constitutionAcknowledged } = await request.json();

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!constitutionAcknowledged) {
      return NextResponse.json(
        { error: 'You must acknowledge the CSEDUSC Constitution to register' },
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
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.users.create({
      data: {
        email,
        password_hash: hashedPassword,
        role: 'MEMBER',
      },
    });

    // Create member profile
    const member = await prisma.members.create({
      data: {
        user_id: user.id,
        full_name: fullName,
        student_id: studentId || `STU-${Date.now()}`,
        batch_year: parseInt(batchYear) || new Date().getFullYear(),
        phone: phone || null,
        constitution_acknowledged: true,
      },
    });

    // Send notification email to EC (get EC officers' emails from environment or config)
    const ecEmails = (process.env.EC_NOTIFICATION_EMAIL || 'ec@csedu-club.com').split(',');
    
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL,
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
          <p>Please review and approve/reject this registration.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json(
      {
        message: 'User registered successfully',
        userId: user.id,
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
