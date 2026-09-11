import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import { requireAdmin, requireAuth } from "./auth.middleware";

function createContext(user?: { id: number; username: string; role: string }) {
  let statusCode = 200;
  let payload: unknown;
  let nextCalled = false;

  const req = {
    session: user ? { user } : {},
  } as Request;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      payload = value;
      return this;
    },
  } as unknown as Response;
  const next = (() => {
    nextCalled = true;
  }) as NextFunction;

  return {
    req,
    res,
    next,
    result: () => ({ statusCode, payload, nextCalled }),
  };
}

test("requireAuth rejects an anonymous request", () => {
  const context = createContext();
  requireAuth(context.req, context.res, context.next);
  assert.equal(context.result().statusCode, 401);
  assert.equal(context.result().nextCalled, false);
});

test("requireAuth accepts an authenticated user", () => {
  const context = createContext({ id: 7, username: "operatore", role: "user" });
  requireAuth(context.req, context.res, context.next);
  assert.equal(context.result().nextCalled, true);
});

test("requireAdmin rejects an anonymous request", () => {
  const context = createContext();
  requireAdmin(context.req, context.res, context.next);
  assert.equal(context.result().statusCode, 401);
  assert.equal(context.result().nextCalled, false);
});

test("requireAdmin rejects a non-admin user", () => {
  const context = createContext({ id: 7, username: "operatore", role: "user" });
  requireAdmin(context.req, context.res, context.next);
  assert.equal(context.result().statusCode, 403);
  assert.equal(context.result().nextCalled, false);
});

test("requireAdmin accepts an admin user", () => {
  const context = createContext({ id: 1, username: "admin", role: "admin" });
  requireAdmin(context.req, context.res, context.next);
  assert.equal(context.result().nextCalled, true);
});