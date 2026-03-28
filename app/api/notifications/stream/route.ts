import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { subscribeToNotificationStream } from "@/lib/notifications/sender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

export async function GET(request: NextRequest) {
  const user = await requireUser(request);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("event: ready\ndata: connected\n\n"));

      const unsubscribe = subscribeToNotificationStream((event) => {
        if (event.kind === "notification" && event.targetUserId !== user.id) {
          return;
        }
        controller.enqueue(
          encoder.encode(`event: ${event.kind}\ndata: ${JSON.stringify(event.payload)}\n\n`)
        );
      });

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode("event: ping\ndata: keep-alive\n\n"));
      }, 25000);

      const cleanup = () => {
        clearInterval(keepAlive);
        unsubscribe();
      };

      request.signal.addEventListener("abort", () => {
        cleanup();
        controller.close();
      });

      // @ts-expect-error - onCancel exists at runtime
      controller.onCancel = cleanup;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
