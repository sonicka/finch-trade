import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'backend-test-secret';
const { requireAuth } = await import('../middleware/auth.js');

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test('auth rejects requests without a bearer token', () => {
  const response = createResponse();
  let nextCalled = false;

  requireAuth({ headers: {} }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.equal(
    response.body.message,
    'Missing or invalid authorization header',
  );
  assert.equal(nextCalled, false);
});

test('auth rejects invalid tokens and tokens without a user id', () => {
  for (const token of [
    'not-a-jwt',
    jwt.sign({ email: 'user@example.com' }, process.env.JWT_SECRET),
  ]) {
    const response = createResponse();
    let nextCalled = false;

    requireAuth(
      { headers: { authorization: `Bearer ${token}` } },
      response,
      () => {
        nextCalled = true;
      },
    );

    assert.equal(response.statusCode, 401);
    assert.equal(nextCalled, false);
  }
});

test('auth attaches the verified user and continues', () => {
  const user = { id: 17, email: 'user@example.com' };
  const token = jwt.sign(user, process.env.JWT_SECRET);
  const request = { headers: { authorization: `Bearer ${token}` } };
  const response = createResponse();
  let nextCalled = false;

  requireAuth(request, response, () => {
    nextCalled = true;
  });

  assert.equal(request.userId, '17');
  assert.equal(request.user.id, user.id);
  assert.equal(request.user.email, user.email);
  assert.equal(typeof request.user.iat, 'number');
  assert.equal(nextCalled, true);
});
