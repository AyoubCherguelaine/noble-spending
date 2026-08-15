import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ error: 'Google authentication is disabled' }, { status: 410 });
}
