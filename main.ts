import { Buffer } from "node:buffer";
import process from "node:process";
import { Hono, HTTPException } from "hono/mod.ts";
import { contentType } from "std/media_types/mod.ts";
import { Status } from "std/http/http_status.ts";
import { serve } from "std/http/mod.ts";
// @deno-types=https://esm.sh/v126/qrcode@1.5.3
import * as Qrcode from "qrcode";

// @ts-ignore: グローバル変数にブチ込む必要があるため
globalThis.Buffer = Buffer;
// @ts-ignore: グローバル変数にブチ込む必要があるため
globalThis.process = process;

const generateQrcode = async (url: string) => {
  const qr = await Qrcode.toBuffer(url);
  return qr;
};

const app = new Hono();

app.get("/", async (ctx) => {
  const { url } = ctx.req.query();
  if (!url) {
    throw new HTTPException(Status.BadRequest, {
      message: "クエリパラメータに`url`を設定してください",
    });
  }
  const qrcode = await generateQrcode(url);
  return ctx.body(qrcode, Status.OK, {
    "Content-Type": contentType("png"),
  });
});

app.all("*", () => {
  throw new HTTPException(Status.NotFound, {
    message: "お探しのページは存在しません",
  });
});

app.onError((err, ctx) => {
  if (err instanceof HTTPException) {
    return ctx.json(
      {
        status: err.status,
        message: err.message,
      },
      err.status,
    );
  }

  return ctx.json(
    {
      status: Status.InternalServerError,
      message: "不明なエラーが発生しました",
    },
    Status.InternalServerError,
  );
});

serve(app.fetch, { port: 8080 });
