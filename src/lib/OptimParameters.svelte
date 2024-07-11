<script lang="ts">
  import { models } from "./stores";

  let metaprompt: string =
    "Generate a variation of the following instruction while keeping the semantic meaning and the output format:\n\n" +
    "{prompt}\n\n" +
    "Output only the new instruction.";
  $: metaprompt_valid = metaprompt.includes("{prompt}");

  let model = "gpt-3.5-turbo";

  let max_prompt_tokens: number = 100;
  $: max_prompt_tokens_invalid =
    !Number.isInteger(max_prompt_tokens) || max_prompt_tokens < 0;

  let pop_size = 2;
  $: pop_size_invalid = !Number.isInteger(pop_size) || pop_size < 0;

  let gen_multiplier = 3;
  $: gen_multiplier_invalid =
    !Number.isInteger(gen_multiplier) || gen_multiplier < 0;

  let generations = 8;
  $: generations_invalid = !Number.isInteger(generations) || generations < 0;

  let temperature = 1.0;
  $: temperature_invalid = temperature < 0 || temperature > 1;

  export let params;
  $: params = {
    metaprompt,
    model,
    max_prompt_tokens,
    pop_size,
    gen_multiplier,
    generations,
    temperature,
  };
  export let valid;
  $: valid =
    metaprompt_valid &&
    !max_prompt_tokens_invalid &&
    !pop_size_invalid &&
    !gen_multiplier_invalid &&
    !generations_invalid &&
    !temperature_invalid;
</script>

<main>
  <section id="parameters">
    <div class="section-title">Parameters</div>
    <label for="metaprompt">Metaprompt</label>
    <textarea
      id="metaprompt"
      bind:value={metaprompt}
      class:invalid={!metaprompt_valid}
    />
    <div>
      <label for="model" style="display: inline-block;">Model name</label
      ><select id="model" bind:value={model}>
        {#each models as m}
          <option value={m}>{m}</option>
        {/each}
      </select>
    </div>

    <div class="input">
      <label for="max-prompt-tokens">Max prompt tokens</label><input
        type="number"
        id="max-prompt-tokens"
        bind:value={max_prompt_tokens}
        class:invalid={max_prompt_tokens_invalid}
      />
    </div>
    <div class="input">
      <label for="popsize">Population size</label><input
        type="number"
        id="popsize"
        bind:value={pop_size}
        class:invalid={pop_size_invalid}
      />
    </div>
    <div class="input">
      <label for="genmultiplier">Generation multiplier</label><input
        type="number"
        id="genmultiplier"
        bind:value={gen_multiplier}
        class:invalid={gen_multiplier_invalid}
      />
    </div>
    <div class="input">
      <label for="generations">Generations</label><input
        type="number"
        id="generations"
        bind:value={generations}
        class:invalid={generations_invalid}
      />
    </div>
    <div class="input">
      <label for="temperature">Temperature</label><input
        type="number"
        id="temperature"
        bind:value={temperature}
        class:invalid={temperature_invalid}
      />
    </div>
  </section>
</main>

<style>
  @import "../app.css";
  textarea {
    width: 50%;
  }
  label {
    min-width: 11em;
  }
  input {
    width: 2em;
  }
  select {
    margin-bottom: 3px;
    padding: 4px;
  }
</style>
