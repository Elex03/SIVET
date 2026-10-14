const fs = require("node:fs");
const ts = require("typescript");
const storage = new Map();
global.sessionStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, v),
  removeItem: (k) => storage.delete(k),
};
global.window = { dispatchEvent: () => {} };
require.extensions[".ts"] = (module, filename) => {
  let source = fs.readFileSync(filename, "utf8");
  source = source
    .replaceAll(
      "import.meta.env.VITE_API_URL",
      JSON.stringify(
        process.env.SIVET_API_TEST_URL ,
      ),
    )
    .replaceAll("import.meta.env.BASE_URL", "'/'");
  module._compile(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    filename,
  );
};
async function main() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  const accounts = JSON.parse(input);
  const { apiData } = require("../src/shared/api/client.ts");
  const { saveTokens } = require("../src/shared/api/session.ts");
  const { loadServerDatabase } = require("../src/shared/api/server.ts");
  for (const account of accounts) {
    try {
      saveTokens(await apiData("/auth/login", "POST", account));
      const db = await loadServerDatabase();
      console.log(
        account.username,
        "ADAPTER OK",
        Object.fromEntries(Object.entries(db).map(([k, v]) => [k, v.length])),
      );
      if (account.username === "sivet_admin") {
        const users =
          await require("../src/shared/api/accounts.ts").readAccounts();
        console.log("users adapter", users.length);
      }
    } catch (error) {
      console.log(
        account.username,
        "FAILED",
        error.response?.status,
        error.response?.data?.message || error.message,
      );
      process.exitCode = 1;
    } finally {
      const tokens = require("../src/shared/api/session.ts").getTokens();
      if (tokens)
        await apiData("/auth/logout", "POST", {
          refresh_token: tokens.refresh_token,
        });
      saveTokens(null);
    }
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
