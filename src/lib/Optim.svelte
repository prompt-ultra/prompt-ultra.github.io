<script lang="ts">
  import Data from "./Data.svelte";
  import Prompt from "./Prompt.svelte";
  import GeneticResult from "./GeneticResult.svelte";
  import Process from "./Process.svelte";
  import { checkKey, openai } from "./stores";
  import OptimParameters from "./OptimParameters.svelte";

  let fileName: string = "";
  let data: any[];

  let population: any[] = [];
  let prompt_params: any;
  let prompt_valid: boolean;
  let params: any;
  let params_valid: any;

  let process: Process;
  let results: any[];
  const mutate = async (
    {
      metaprompt,
      model,
      max_prompt_tokens,
      temperature,
    }: {
      metaprompt: string;
      model: string;
      max_prompt_tokens: number;
      temperature: number;
    },
    prompt: string
  ) => {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: metaprompt.replace("{prompt}", prompt),
        },
      ],
      model: model,
      max_tokens: max_prompt_tokens,
      temperature: temperature,
    });
    return completion.choices[0].message.content || "";
  };
  let running = false;
  let stop = false;
  $: bestPrompt = population.reduce((a, b) => (a.score > b.score ? a : b), {
    score: -Infinity,
  });
  const optimize = async (
    prompt_params: {
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
    {
      metaprompt,
      model,
      max_prompt_tokens,
      pop_size,
      gen_multiplier,
      generations,
      temperature,
    }: {
      metaprompt: string;
      model: string;
      max_prompt_tokens: number;
      pop_size: number;
      gen_multiplier: number;
      generations: number;
      temperature: number;
    },
    data: any[]
  ) => {
    if (running) return;
    if (!(await checkKey())) return;
    running = true;
    population = [];

    const first_prompt = prompt_params.prompt;
    let p_params: any = { ...prompt_params };
    delete p_params.prompt;

    const score_cache: Map<string, number> = new Map();
    const score = async (prompt: string) => {
      if (score_cache.has(prompt)) {
        return score_cache.get(prompt);
      }
      let params = { ...p_params, prompt };
      await process.process(data, params);
      return process.accuracy(results);
    };

    population = [
      {
        id: 0,
        text: first_prompt,
        score: await score(first_prompt),
        parent: null,
        generation: 0,
        level: 0,
      },
    ];
    let current_gen = [population[0]];
    for (let gen = 1; gen <= generations; gen++) {
      let new_gen = current_gen.slice();
      for (let prompt of current_gen) {
        for (let j = 0; j < gen_multiplier; j++) {
          let new_prompt_text = await mutate(
            {
              metaprompt,
              model,
              max_prompt_tokens,
              temperature,
            },
            prompt.text
          );
          let new_prompt: any = {
            id: population.length + 1,
            text: new_prompt_text,
            score: await score(new_prompt_text),
            parent: prompt.id,
            generation: gen,
            level: gen,
          };
          new_gen.push(new_prompt);
          population = [...population, new_prompt];
          if (stop) {
            stop = false;
            running = false;
            return;
          }
        }
      }
      current_gen = new_gen;
      current_gen.sort((a, b) => a.score - b.score);
      current_gen = current_gen.slice(-pop_size);
    }
  };
</script>

<main>
  <Data bind:fileName bind:data requireLabel={true} />
  <Prompt bind:params={prompt_params} bind:valid={prompt_valid} />
  <OptimParameters bind:params bind:valid={params_valid} />
  <section>
    <div class="section-title">Optimize</div>
    <button
      class="button"
      id="process-run"
      on:click={() => optimize(prompt_params, params, data)}
      disabled={fileName === "" || !prompt_valid || !params_valid || running}
      >Run</button
    >
    <button
      class="button"
      id="process-stop"
      on:click={() => {
        stop = true;
      }}
      disabled={!running || stop}>Stop</button
    >
    {#if stop && running}
      <div class="message">
        The process will be stopped after the current evaluation.
      </div>
    {/if}
    {#if running && results}
      <div class="progress">
        <progress id="progress-bar" value={results.length} max={data.length}
        ></progress>
        <div class="progress-message">
          {results.length}/{data.length}
        </div>
      </div>
    {/if}
  </section>
  <Process bind:this={process} bind:results />
  <GeneticResult {population} />
  <section>
    <div class="section-title">Results</div>
    {#if population.length > 0}
      <div class="results">
        Best prompt:
        <br />
        <span
          style="font-family:  Courier New, Courier, monospace; font-weight: normal;"
          >{bestPrompt.text}</span
        >
        <br />
        Score: {bestPrompt.score}
      </div>
    {/if}
  </section>
</main>

<style>
  @import "../app.css";
  .results {
    font-weight: bold;
    font-family: sans-serif;
    line-height: 2em;
  }
</style>
