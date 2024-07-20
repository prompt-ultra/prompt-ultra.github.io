<script lang="ts">
  import Data from "./Data.svelte";
  import Prompt from "./Prompt.svelte";
  import GeneticResult from "./GeneticResult.svelte";
  import Process from "./Process.svelte";
  import { checkKey, openai } from "./stores";
  import OptimParameters from "./OptimParameters.svelte";

  let dataEl: Data;
  let promptEl: Prompt;

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
  <section id="help">
    <p>
      In this tab, you can perform automatic prompt optimization to optimize the
      accuracy of the labelling instructions taken as input by the LLM to label
      your dataset.
    </p>
    <p>
      Upload a labelled dataset in the Dataset section, input starting
      instructions in the Instructions section, input meta-instructions in the
      Meta-instructions section, and start the optimization process in the
      Process section.
    </p>
  </section>
  <section id="new">
    <b>New here?</b>
    <button
      class="smallbutton"
      on:click={() => {
        dataEl.loadExample();
        promptEl.loadExample();
      }}
      >Load Example
    </button>
    <div class="message">
      Load an already labeled example dataset and instructions for this dataset
      (you need an OpenAI API key to process this example).
    </div>
  </section>

  <Data bind:fileName bind:data requireLabel={true} bind:this={dataEl} />
  <Prompt
    bind:params={prompt_params}
    bind:valid={prompt_valid}
    bind:this={promptEl}
    message="Write initial instructions asking the LLM to label the dataset. They will serve as the starting point of the optimization process."
  />
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
    <div class="message">
      Press Run to start the optimization process. Successive generations of
      instructions will be generated by repeatedly applying the “mutating”
      meta-instructions. The best sets of instructions of each generation
      survive to the next generation. The graph illustrates which set of
      instructions is a mutation of which. At the end of the process, the best
      set of instructions and its accuracy are output.
    </div>
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
    <GeneticResult {population} />
  </section>
  <Process bind:this={process} bind:results />
  <section>
    <div class="section-title">Results</div>
    {#if population.length > 0}
      <div class="results">
        Best instructions:
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
  .message {
    display: block;
  }
</style>
