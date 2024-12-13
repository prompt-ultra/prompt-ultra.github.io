<svelte:options accessors />

<script lang="ts">
  import { models } from "./stores";

  let prompt = "";

  export const loadExample = () => {
    prompt =
      "Describe the emotion expressed in the following message as joy, anger, sadness or optimism. Output only “joy”, “anger”, “sadness” or “optimism” without quotes.";
  };

  export let message =
    "Enter instructions asking the LLM to label the dataset.";

  let showAdvanced = false;

  let max_tokens = 20;
  $: max_tokens_invalid = !Number.isInteger(max_tokens) || max_tokens < 1;

  let model = "gpt-4o-mini";

  let temperature = 0.1;
  $: temp_invalid = temperature < 0 || temperature > 1;

  let ppchoice: string = "none";
  let pp: Record<string, string> = {
    none: "return s;",
    trim: "return s.trim();",
    last: `// get last word
s = s.split(/\\s+/).slice(-1)[0];
// convert to lowercase
s = s.toLowerCase();
// remove punctuation at the end
s = s.replace(/[.,;]+$/g, "");
return s;`,
    custom: `// your code here
// return null to note an invalid input
return s;`,
  };
  let postprocess = pp[ppchoice];
  let changedByMenu = false;
  $: {
    if (changedByMenu) {
      postprocess = pp[ppchoice];
    }
    changedByMenu = false;
  }
  const make_fun = (expr: string) => {
    let f;
    try {
      f = new Function("s", expr);
    } catch (e) {
      return null;
    }
    return f;
  };
  $: postprocess_fun = make_fun(postprocess);

  let default_class = "";

  let enable_wl = false;
  let whitelist_txt = "";
  $: whitelist = whitelist_txt
    ? whitelist_txt.split("\n").map((x) => x.trim())
    : null;
  $: wl_invalid = enable_wl && whitelist === null;

  let retries = 1;
  $: retries_invalid = !Number.isInteger(retries) || retries < 1;

  let threads = 4;
  $: threads_invalid = !Number.isInteger(threads) || threads < 1;

  export let params;
  $: params = {
    prompt,
    model,
    maxTokens: max_tokens,
    temperature,
    postprocess_fun,
    default_class,
    whitelist,
    retries,
    threads,
  };
  export let valid;
  $: valid =
    prompt !== "" &&
    !max_tokens_invalid &&
    !temp_invalid &&
    postprocess_fun !== null &&
    !wl_invalid &&
    !retries_invalid &&
    !threads_invalid;
</script>

<section>
  <div class="section-title">Instructions</div>
  <button
    on:click={() => {
      showAdvanced = !showAdvanced;
    }}>{showAdvanced ? "Hide" : "Show"} advanced options</button
  >
  <div class="message">
    {message}
  </div>
  <div class="prompt">
    <label for="prompt">Instructions</label>
    <textarea
      id="prompt"
      bind:value={prompt}
      class:invalid={!prompt}
      placeholder="Classify this text as ..."
    />
  </div>
  {#if showAdvanced}
    <div>
      <label for="model" style="display: inline-block;">Model name</label
      ><select id="model" bind:value={model}>
        {#each models as m}
          <option value={m}>{m}</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="max-tokens">Max tokens</label><input
        type="number"
        id="max-tokens"
        bind:value={max_tokens}
        class:invalid={!Number.isInteger(max_tokens) || max_tokens < 1}
      />
    </div>
    <div>
      <label for="temperature">Temperature</label><input
        type="number"
        id="temperature"
        bind:value={temperature}
        class:invalid={temp_invalid}
      />
    </div>
    <div>
      <label for="post-processing" style="display: inline-block;"
        >Post processing function</label
      ><select
        id="postprocessing"
        bind:value={ppchoice}
        on:input={() => {
          changedByMenu = true;
        }}
      >
        <option value="none">None</option>
        <option value="trim">Trim</option>
        <option value="last">Last word</option>
        <option value="custom">Custom</option>
      </select>
      {#if ppchoice !== "none"}
        <textarea
          id="post-processing"
          bind:value={postprocess}
          on:input={() => {
            let value = postprocess;
            ppchoice = "custom";
            postprocess = value;
          }}
          class:invalid={postprocess_fun === null}
        ></textarea>
      {/if}
    </div>
    <div class="default-class">
      <label for="default-class">Default class</label><input
        type="text"
        id="default-class"
        bind:value={default_class}
        style="width: 6em"
      />
    </div>
    <div class="whitelist" style="user-select: none">
      <label for="enable-wl">Label whitelist </label><input
        type="checkbox"
        id="enable-wl"
        bind:checked={enable_wl}
      />
      {#if enable_wl}
        (one label per line)
        <textarea
          id="whitelist"
          bind:value={whitelist_txt}
          class:invalid={wl_invalid}
        ></textarea>
      {/if}
    </div>
    <div>
      <label for="retries">Retries</label><input
        type="number"
        id="retries"
        bind:value={retries}
        class:invalid={retries_invalid}
      />
    </div>
    <div>
      <label for="threads">Threads</label><input
        type="number"
        id="threads"
        bind:value={threads}
        class:invalid={threads_invalid}
      />
    </div>
  {/if}
</section>

<style>
  @import "../app.css";
  .prompt {
    max-width: 100%;
    width: 600px;
  }
  .whitelist {
    max-width: 100%;
    width: 600px;
  }
  /* inline mode for radio inputs */
  input[type="radio"] {
    display: inline;
  }
  .mode > label {
    display: inline;
  }
  label {
    min-width: 13em;
  }
  select {
    margin-bottom: 3px;
    padding: 4px;
  }
  input {
    width: 2em;
  }
  .message {
    display: block;
    padding-top: 0px;
    padding-bottom: 10px;
  }
</style>
