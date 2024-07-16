<script lang="ts">
  export let fileName = "";
  export let data: any[] = [];
  export let canDownload = true;
  let showTable = false;
  $: hasLabel = data.length > 0 && "label" in data[0];
  $: hasPred = data.length > 0 && "prediction" in data[0];
</script>

<main>
  {#if data.length}
    <section class="download">
      <button
        on:click={() => {
          const blob = new Blob(
            [data.map((row) => JSON.stringify(row)).join("\n")],
            {
              type: "text/plain",
            }
          );
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
        }}
        disabled={!canDownload}>Download</button
      >
      <button
        class="button"
        id="data-show"
        on:click={() => {
          if (showTable || data.length) {
            showTable = !showTable;
          }
        }}
        disabled={!(showTable || data.length)}
        >{showTable ? "Hide" : "Show"}</button
      >
      <span>{fileName}: {data.length} records</span>
    </section>
    {#if showTable}
      <div class="table">
        <table>
          <thead>
            <tr>
              <th>Text</th>
              {#if hasLabel}
                <th>Label</th>
              {/if}
              {#if hasPred}
                <th>Prediction</th>
              {/if}
            </tr>
          </thead>
          <tbody>
            {#each data as row}
              <tr>
                <td>{row.text}</td>
                {#if hasLabel}
                  <td>{row.label}</td>
                {/if}
                {#if hasPred}
                  <td>{row.prediction}</td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</main>

<style>
  @import "../app.css";

  span {
    display: inline-block;
  }
  #data-show {
    width: 90px;
  }
  .download {
    display: inline-block;
    margin-top: 10px;
    margin-bottom: 10px;
  }
</style>
