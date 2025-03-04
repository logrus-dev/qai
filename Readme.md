A simple OpenAI chat client for using in automated flows.

Define AI assistant configurations in [Directus](https://docs.directus.io/) headless CMS and use them by calling this app via simple HTTP API, just like:

```http
POST http://localhost:8080/ HTTP/1.1
Content-Type: application/x-www-form-urlencoded

q=Github&a=en_dict&t=***

```

In this example:

- `http://localhost:8080` - URL of an instance of this application
- `q` - prompt to the AI
- `a` - assistant code defined in Directus
- `t` - Directus user API token (defined in the back office)

Application will send the prompt to the AI, get completion, save it to Directus DB and return the completion ID. The result can be viewed at `http://localhost:8080/<ID>`.

As for Directus, there are just two collections used: `qai_assistant` and `qai_completion_cache`. Corresponding interfaces can be found in `directus.ts`.

Application supports AI configurations via [HashiCorp's Vault](https://www.hashicorp.com/products/vault) or environment variables. See `.env-cmdrc.example` file.

I personally use it as a part of [Tasker's AutoShare](https://joaoapps.com/autoshare/what-it-is/) command handlers. Selecting text in any app and then sharing it to a pre-configured AI assistant: dictionary, web summary, translator, etc.

CSS borrowed from beautiful [Cactus theme](https://github.com/monkeyWzr/hugo-theme-cactus).
