import { NextResponse } from 'next/server';
import { getAPIClient } from '@/lib/api-client';

export async function GET() {
  try {
    // Try to get API client (optional for mock data mode)
    let apiClient;
    try {
      apiClient = getAPIClient();
      const rateLimitInfo = apiClient.getRateLimitInfo();
      
      return NextResponse.json({
        ...rateLimitInfo,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Return default values when API client is not available
      return NextResponse.json({
        requestsLastMinute: 0,
        monthlyCalls: 0,
        maxPerMinute: 20,
        maxMonthly: 500,
        timestamp: new Date().toISOString(),
        note: 'Using mock data mode - rate limits not tracked',
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

