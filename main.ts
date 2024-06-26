import { Hono, HTTPException } from "hono/mod.ts";
import { contentType } from "std/media_types/mod.ts";
import { Status } from "std/http/http_status.ts";
import { serve } from "std/http/mod.ts";
import Qrcode from "qrcode";

const app = new Hono();

app.get("/", (ctx) => {
  return ctx.text(
    "このサービスはDeno Deployでホスティングされ、Honoとnode-qrcodeによって構築されています。",
  );
});

type Extention = "png" | "svg";

const generateQrcode = async (
  url: string,
  options: Qrcode.QRCodeToBufferOptions | Qrcode.QRCodeToStringOptions,
) => {
  if (options.type === "png") return await Qrcode.toBuffer(url, options);
  else if (options.type === "svg") return await Qrcode.toString(url, options);
  throw new HTTPException(Status.BadRequest, {
    message: "`type`でpngかsvgを設定してください",
  });
};

app.get("/api", async (ctx) => {
  const {
    type = "png",
    url,
    width,
    qrcolor = "000000ff",
    bgcolor = "ffffffff",
  } = ctx.req.query();
  const extention = type as Extention;

  if (!url) {
    throw new HTTPException(Status.BadRequest, {
      message: "クエリパラメータに`url`を設定してください",
    });
  }

  const qrcode = await generateQrcode(url, {
    type: extention,
    width: Number(width),
    color: {
      dark: `#${qrcolor}`,
      light: `#${bgcolor}`,
    },
  });

  return ctx.body(qrcode, Status.OK, {
    "Content-Type": contentType(extention),
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
