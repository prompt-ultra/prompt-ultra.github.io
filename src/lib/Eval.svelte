<script lang="ts">
  import Data from "./Data.svelte";
  import Prompt from "./Prompt.svelte";
  import Download from "./Download.svelte";
  import Process from "./Process.svelte";

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
  <Data bind:fileName bind:data />
  <Prompt bind:params={prompt_params} bind:valid={prompt_valid} />
  <section>
    <div class="section-title">Process</div>
    <button
      class="button"
      id="process-run"
      on:click={() => process.process(data, prompt_params)}
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
</style>
