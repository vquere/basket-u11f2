const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('Testing database connection...');

    // Check environment variables
    const envCheck = {
      hasNetlifyUrl: !!process.env.NETLIFY_DATABASE_URL,
      hasUnpooled: !!process.env.NETLIFY_DATABASE_URL_UNPOOLED,
      nodeEnv: process.env.NODE_ENV,
      urlPrefix: process.env.NETLIFY_DATABASE_URL ? process.env.NETLIFY_DATABASE_URL.substring(0, 20) + '...' : 'not found'
    };

    console.log('Environment check:', envCheck);

    if (!process.env.NETLIFY_DATABASE_URL && !process.env.NETLIFY_DATABASE_URL_UNPOOLED) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'No database URL found',
          env: envCheck
        })
      };
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED);

    // Test simple query
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;

    console.log('Database test successful:', result[0]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Database connection successful',
        timestamp: result[0].current_time,
        version: result[0].pg_version,
        env: envCheck
      })
    };

  } catch (error) {
    console.error('Database test failed:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Database connection failed',
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    };
  }
};