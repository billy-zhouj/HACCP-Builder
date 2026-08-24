import { NextResponse } from "next/server";

/**
 * Wraps an API route handler so that any uncaught error (Prisma exceptions,
 * JSON parse failures, unexpected throws) returns a standardized 500 response
 * instead of bubbling up as an unhandled promise rejection that leaks stack
 * traces in development and produces a generic Next.js error page in production.
 *
 * Usage:
 *   export const POST = apiHandler(async (req, { params }) => { ... });
 *   export const GET = apiHandler(async (_req, { params }) => { ... });
 *   export const GET = apiHandler(async () => { ... }); // no-arg GET
 */
export function apiHandler<TArgs extends unknown[], TRet extends NextResponse | Response>(
  fn: (...args: TArgs) => Promise<TRet>
): (...args: TArgs) => Promise<NextResponse | TRet> {
  return async (...args: TArgs) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Log the full error server-side for debugging; never expose to client.
      console.error("[API Error]", error);
      return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
  };
}
