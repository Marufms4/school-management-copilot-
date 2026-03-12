import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';
import type { ApiResponse, User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      tenantId?: string;
    };
    const { email, password, tenantId } = body;

    if (!email || !password || !tenantId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Email, password and tenantId are required' },
        { status: 400 }
      );
    }

    // Demo auth - in production, verify against DB
    if (password !== 'demo123') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user: User = {
      id: '1',
      tenantId,
      email,
      role: email.includes('admin') ? 'SchoolAdmin' : 'Staff',
      name: email.split('@')[0],
    };

    const token = createToken(user);

    const response = NextResponse.json<ApiResponse<User>>({
      success: true,
      data: user,
      message: 'Login successful',
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
