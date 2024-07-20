<script lang="ts">
  import seedrandom from "seedrandom";
  import Data from "./Data.svelte";
  import Download from "./Download.svelte";

  const sample = (n: number, k: number, seed: string = "") => {
    if (k > n) k = n;
    let rng = seedrandom(seed);
    let available = new Set(Array.from({ length: n }, (_, i) => i));
    let selected = new Set<number>();
    for (let i = 0; i < k; i++) {
      let index = Math.floor(rng() * available.size);
      let value = Array.from(available)[index];
      available.delete(value);
      selected.add(value);
    }
    return [Array.from(selected).sort(), Array.from(available).sort()];
  };

  let data: Data;
  let fileName = "";
  let seed = "";
  let k = 0;
  $: k_invalid = !Number.isInteger(k) || k < 0;

  let data1: any[] = [];
  let data2: any[] = [];
  $: baseName = fileName.split(".")[0];
</script>

<main>
  <section id="help">
    This tab provides a convenient way to randomly split a dataset in two.
    Upload a (labelled or unlabelled) dataset and input the number of samples
    that should belong to the first of the two resulting datasets.
  </section>
  <Data bind:this={data} bind:fileName />
  <section id="parameters">
    <div class="section-title">Parameters</div>
    <div class="input">
      <label for="k">Number of samples</label><input
        type="number"
        id="k"
        bind:value={k}
        class:invalid={k_invalid}
      />
    </div>
    <div class="input">
      <label for="seed">Random seed</label><input
        type="text"
        id="seed"
        bind:value={seed}
      />
    </div>
  </section>
  <section>
    <div class="section-title">Split</div>
    <button
      class="button"
      on:click={() => {
        let [split1, split2] = sample(data.data.length, k, seed);
        data1 = split1.map((i) => data.data[i]);
        data2 = split2.map((i) => data.data[i]);
      }}
      disabled={fileName === "" || k_invalid}>Run</button
    >
  </section>
  <section>
    <div class="section-title">Results</div>
    <Download fileName={`${baseName}-split1.jsonl`} data={data1} />
    <Download fileName={`${baseName}-split2.jsonl`} data={data2} />
  </section>
</main>

<style>
  @import "../app.css";

  label {
    min-width: 11em;
  }
  input {
    width: 5em;
  }
</style>
