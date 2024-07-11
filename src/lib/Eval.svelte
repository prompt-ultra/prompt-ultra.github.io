<script lang="ts">
  import Data from "./Data.svelte";
  import Prompt from "./Prompt.svelte";
  import Download from "./Download.svelte";
  import Process from "./Process.svelte";

  let dataEl: Data;
  let promptEl: Prompt;

  let fileName: string = "";
  let data: any[];
  $: baseName = fileName.split(".")[0];

  let prompt_params: any;
  let prompt_valid: any;
  let results: any[];

  let process: Process;

  $: done = data && data.length > 0 && results.length == data.length;
</script>

<main>
  <section>
    <b>New here?</b>
    <button
      class="smallbutton"
      on:click={() => {
        dataEl.loadExample();
        promptEl.loadExample();
      }}
      >Load Example
    </button>
  </section>
  <Data bind:fileName bind:data bind:this={dataEl} />
  <Prompt
    bind:params={prompt_params}
    bind:valid={prompt_valid}
    bind:this={promptEl}
  />

  <section>
    <div class="section-title">Process</div>
    <button
      class="button"
      id="process-run"
      on:click={() => process.process(data, prompt_params, dataEl.isFake)}
      disabled={fileName === "" || !prompt_valid || process.running}>Run</button
    >
    <Process bind:this={process} bind:results />
    {#if (process && process.running) || done}
      <div class="progress">
        <progress id="progress-bar" value={results.length} max={data.length}
        ></progress>
        <div class="progress-message">{results.length}/{data.length}</div>
      </div>
    {/if}
  </section>
  <section>
    <div class="section-title">Results</div>
    <Download
      fileName={`${baseName}-results.jsonl`}
      data={results}
      canDownload={done}
    />
    {#if done}
      <div class="results">Accuracy: {process.accuracy(results)}</div>
    {/if}
  </section>
</main>

<style>
  @import "../app.css";
  label {
    min-width: 5em;
  }
  input {
    width: 1.5em;
  }
  .results {
    font-weight: bold;
    font-family: sans-serif;
  }

  .smallbutton {
    padding: 5px 10px;
  }
</style>
