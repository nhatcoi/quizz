import { NextResponse } from 'next/server';

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function handleOptions(): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  });
} 