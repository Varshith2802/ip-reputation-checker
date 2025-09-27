require('dotenv').config();

'use strict'
const fastify = require('fastify')({ logger: true });
const { Pool } = require('pg');

// Database connection details
// The hostname 'db' refers to the service name in your docker-compose.yaml
const pool = new Pool({
  user: 'user',
  host: 'db', // <-- MUST BE 'localhost' for local testing
  database: 'ip_reputation',
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});
// Simple health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Main endpoint to check IP reputation
fastify.get('/internal/check-ip', async (request, reply) => {
  try {
    // You'll need to secure this endpoint later with an internal token
    const { ip } = request.query;
    const result = await pool.query('SELECT verdict FROM unsafe_ips WHERE ip_address = $1', [ip]);

    const verdict = result.rows.length > 0 ? result.rows[0].verdict : 'clean';

    return { ip: ip, status: verdict };
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Internal server error' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();