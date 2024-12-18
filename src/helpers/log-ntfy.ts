import build from 'pino-abstract-transport';

const { NTFY_ENDPOINT, NTFY_TOPIC, NTFY_USER, NTFY_PASSWORD } = process.env;

export default async function (opts: any) {
  return build(async function (source) {
    for await (let obj of source) {
      if (NTFY_ENDPOINT && NTFY_TOPIC && NTFY_USER && NTFY_PASSWORD) {
        const headers = new Headers();
        headers.set('Authorization', 'Basic ' + Buffer.from(`${NTFY_USER}:${NTFY_PASSWORD}`).toString('base64'));
        await fetch(NTFY_ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({
            topic: NTFY_TOPIC,
            title: 'QAI Error',
            message: obj.msg,
            tags: ["warning"]
          }),
        });
      }
    }
  });
};
