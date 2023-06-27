// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import GDPRWebhookHandlers from "./gdpr.js";
import { Multipass } from "multipass";
import { querystring } from "querystring";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());
// 商品数の情報にAPIリクエストがあった時の処理
app.get("/api/products/count", async (_req, res) => {
  const countData = await shopify.api.rest.Product.count({
    session: res.locals.shopify.session,
  });
  res.status(200).send(countData);
});
// 商品追加のAPIリクエストがあった時の処理
app.get("/api/products/create", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

// 課題9：MultipassAPI実装
const multipassSecret = "4ebf7d5101bcb0b1c9d070bc9a65496e";
const multipass = new Multipass(multipassSecret);
const loginPath = "/account/login";

// ログイン
app.get("/login", (req, res) => {
  const { headers } = req;
  const { "email" : email, "first_name" : firstName, "lasr_name" : lastName } = headers;
  const userData = {
    "email" : email,
    "first_name" : firstName,
    "lasr_name" : lastName
  };
  const multipassToken = multipass.encode(userData);
  const redirectURL = `https://${process.env.HOST}${loginPath}?${querystring.stringify({ token: multipassToken })}`;
  res.redirect(redirectURL);
})

// Multipassトークンの検証とエンドユーザーの情報取得
app.get("/verify", (req, res) => {
  const multipassToken = req.query.token;
  if (multipassToken) {
    try {
      const userData = multipass.decode(multipassToken);
      res.json(userData);
    } catch (error) {
      console.error("取得失敗", error);
      res.status(400).json({ error: "マルチパストークンが有効でない"});
    }
  } else {
    res.status(400).json({ error: "マルチパストークンが無い"});
  }
})


app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
