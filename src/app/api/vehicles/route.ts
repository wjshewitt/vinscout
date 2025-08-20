import { NextResponse } from 'next/server';

const vehicleData = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get('make');

  if (make) {
    const models = (vehicleData as any)[make] || [];
    return NextResponse.json({ models });
  }

  const makes = Object.keys(vehicleData);
  return NextResponse.json({ makes });
}
