<svelte:options accessors />

<script lang="ts">
  import { checkKey, openai } from "./stores";
  import mapLimit from "async/mapLimit";

  export let results: any[] = [];
  export let running = false;

  const process_one = async (
    text: string,
    {
      prompt,
      model = "gpt-3.5-turbo",
      max_tokens = 20,
      temperature = 0.1,
      postprocess_fun = (s: string) => s,
      default_class = "",
      whitelist = null,
      retries = 1,
    }: {
      prompt: string;
      model: string;
      max_tokens: number;
      temperature: number;
      postprocess_fun: any;
      default_class: string;
      whitelist: string[] | null;
      retries: number;
    },
    wait = false
  ) => {
    const key = JSON.stringify({
      text,
      prompt,
      model,
      max_tokens,
      temperature,
      postprocess_fun: postprocess_fun.toString(),
      default_class,
      whitelist,
      retries,
    });
    const cached = localStorage.getItem(key);
    if (cached !== null) {
      if (wait) await new Promise((r) => setTimeout(r, 10));
      return JSON.parse(cached);
    }
    if (wait) throw new Error("Not in cache");

    let requests = 0;
    let raw_prediction = null;
    for (let i = 0; i < retries; i++) {
      requests += 1;
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: text },
        ],
        model: model,
        max_tokens,
        temperature,
      });
      raw_prediction = completion.choices[0].message.content || "";
      const prediction = postprocess_fun(raw_prediction);
      if (prediction === null) continue;
      if (whitelist !== null && !whitelist.includes(prediction)) continue;
      const ans = { raw_prediction, prediction, requests };
      localStorage.setItem(key, JSON.stringify(ans));
      return ans;
    }
    const ans = {
      raw_prediction,
      prediction: default_class.length > 0 ? default_class : null,
      requests,
    };
    localStorage.setItem(key, JSON.stringify(ans));
    return ans;
  };
  export const accuracy = (results: any[]) => {
    let correct = 0;
    for (let row of results) {
      if (row.prediction === row.label) correct += 1;
    }
    return correct;
  };
  export const process = async (
    data: any[],
    {
      prompt,
      model,
      max_tokens = 20,
      temperature = 0.1,
      postprocess_fun = (s: string) => s,
      default_class = "",
      whitelist = null,
      retries = 1,
      threads = 4,
    }: {
      prompt: string;
      model: string;
      max_tokens: number;
      temperature: number;
      postprocess_fun: any;
      default_class: string;
      whitelist: string[] | null;
      retries: number;
      threads: number;
    },
    fake = false
  ) => {
    if (!fake && !(await checkKey())) return;
    running = true;

    const indexedData = data.map((row, index) => ({ row, index }));
    const pool = new Map();
    results = [];
    return new Promise<void>((resolve, reject) => {
      mapLimit(
        indexedData,
        threads,
        async ({ row, index }: { row: any; index: number }) => {
          try {
            let predicted = await process_one(
              row.text,
              {
                prompt,
                model,
                max_tokens,
                temperature,
                postprocess_fun,
                default_class,
                whitelist,
                retries,
              },
              fake
            );
            pool.set(index, { ...row, ...predicted });
            while (pool.has(results.length)) {
              const key = results.length;
              const ans = pool.get(key);
              results = [...results, ans];
              pool.delete(key);
            }
          } catch (error: any) {
            if (error.message == "Not in cache") {
              throw error;
            }
            running = false;
            reject(error);
          }
        },
        (err: any) => {
          running = false;
          if (err) {
            if (err.message == "Not in cache") {
              process(
                data,
                {
                  prompt,
                  model,
                  max_tokens,
                  temperature,
                  postprocess_fun,
                  default_class,
                  whitelist,
                  retries,
                  threads,
                },
                false
              ).then(resolve);
            } else {
              alert(err);
              reject(err);
            }
          } else {
            resolve();
          }
        }
      );
    });
  };
</script>
