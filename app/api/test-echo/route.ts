export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[TEST ECHO] Received:', JSON.stringify(body, null, 2));
    return Response.json({ received: body, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[TEST ECHO] Error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
