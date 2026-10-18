import { handleNodeRequest } from "../../../../server/neon.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = handleNodeRequest;
export const POST = handleNodeRequest;
export const PATCH = handleNodeRequest;
export const DELETE = handleNodeRequest;
