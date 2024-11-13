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
  let running: false;

  $: done = data && data.length > 0 && results.length == data.length;
  $: displayProgress = running || done;
</script>

<main>
  <section id="help">
    <p>
      Upload a dataset in the Dataset section, enter labelling instructions in
      the Instructions section and make the LLM apply those instructions in the
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
      (no need for an OpenAI API key to process this example).
    </div>
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
    <div>
      <p>
        Press Run to make the LLM execute your instructions and label the
        dataset (requires an OpenAI API key).
        <br /> This outputs a new dataset comprising the entries of the initial
        dataset and the labels produced by the LLM.
        <br /> If the initial dataset was already labelled, the two sets of labels
        are compared and the accuracy of the new labels is computed.
      </p>
    </div>
    <Process bind:this={process} bind:results bind:running />
    {#if displayProgress}
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
      <div class="results">
        Accuracy: {process.accuracy(results)} / {results.length} =
        {process.accuracy(results) / results.length}
      </div>
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
  #help > p {
    /* margin: 8px; */
  }
  #new {
    margin-bottom: 10px;
  }
</style>
