<script lang="ts">
  import { local } from "d3";
  import Welcome from "./lib/Welcome.svelte";
  import Eval from "./lib/Eval.svelte";
  import Optim from "./lib/Optim.svelte";
  import Split from "./lib/Split.svelte";
  import { apiKey } from "./lib/stores";

  let selectedTab = 0;
  function selectTab(index: number) {
    selectedTab = index;
  }
  let tabs = [
    { name: "wilköm", phon: "/ˈwɛlkəm/", component: Welcome },
    { name: "evål", phon: "/ɪˈvæl/", component: Eval },
    { name: "øptim", phon: "/ˈɒptɪm/", component: Optim },
    { name: "splët", phon: "/splɪt/", component: Split },
  ];
</script>

<header class="tabs">
  {#each tabs as tab, index}
    <button
      class="tab {selectedTab == index ? 'selected' : ''}"
      on:click={() => selectTab(index)}
    >
      {tab.name}<br /><span class="phonetics">{tab.phon}</span>
    </button>
  {/each}
  <button
    style="flex: 0.2; font-size: 16px;"
    class="tab"
    on:click={async () => {
      const key = $apiKey;
      localStorage.clear();
      localStorage.setItem("apiKey", key);
    }}
  >
    klear cäche
  </button>
  {#if $apiKey}
    <button
      style="flex: 0.25; font-size: 16px; white-space: nowrap;"
      class="tab"
      on:click={() => {
        $apiKey = "";
      }}>d.skönnect</button
    >
  {/if}
</header>
<main>
  <svelte:component this={tabs[selectedTab].component} />
</main>

<style>
  @import "app.css";

  header {
    margin-bottom: 20px;
    font-size: 20px;
  }

  .tabs {
    display: flex;
    font-size: 20px;
  }

  .tab {
    flex: 1;
    text-align: center;
    cursor: pointer;
    border: 2px solid black;
    border-right: 0;
    transition:
      background-color 0.3s,
      color 0.3s;
    font-family: inherit;
    font-size: inherit;
    background-color: var(--secondary-color);
    color: var(--background-color);
  }
  .tab:last-child {
    border-right: 2px solid black;
  }
  .tab:hover {
    background-color: var(--tertiary-color);
    color: #000;
  }
  .tab.selected {
    background-color: var(--tertiary-color);
    color: #000;
    font-weight: bold;
  }
  .phonetics {
    text-transform: none;
    font-size: 14px;
    font-weight: normal;
  }
</style>
