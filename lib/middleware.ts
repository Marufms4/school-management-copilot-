import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import { getSession } from '@/lib/auth';

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  return handler(request);
}

export function handleError(error: unknown): NextResponse {
  console.error('[API Error]', error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json<ApiResponse<null>>(
    { success: false, error: message },
    { status: 500 }
  );
}
