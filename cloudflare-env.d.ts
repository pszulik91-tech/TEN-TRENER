// The optional scaffold DB is absent from this game's hosting configuration.
// Keep its guard typed for projects that enable a real D1 binding later.
declare namespace Cloudflare { interface Env { DB?: D1Database; } }
