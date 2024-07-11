<svelte:options accessors />

<script lang="ts">
  import * as Papa from "papaparse";

  export let fileName: string = "";
  export let hasLabel = false;
  export let data: any[] = [];
  export let requireLabel = false;

  let showTable = false;
  let fileContent: string | undefined = undefined;

  const fileUpload = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target) return;
        fileContent = <string>e.target.result;
        if (!fileContent) return;
        let records;
        try {
          if (file.name.endsWith(".csv") || file.name.endsWith(".tsv")) {
            records = Papa.parse(fileContent, {
              delimiter: file.name.endsWith(".csv") ? "," : "\t",
              header: true,
            }).data;
          } else if (
            file.name.endsWith(".json") ||
            file.name.endsWith(".jsonl")
          ) {
            if (file.name.endsWith(".json")) {
              records = JSON.parse(fileContent);
            } else {
              const lines = fileContent.split("\n");
              records = lines
                .filter((line) => line.trim())
                .map((line) => JSON.parse(line));
            }
          }
        } catch (e) {
          message = `Error: ${e}`;
          return;
        }
        if (!records) {
          message = "Error: empty file";
          return;
        }
        if (!records[0].text) {
          message = 'Error: CSV file must have a "text" column';
          return;
        }
        hasLabel = records[0].label !== undefined;
        if (hasLabel) {
          data = records.map((row: any) => ({
            text: row.text,
            label: row.label,
          }));
        } else {
          if (requireLabel) {
            message = 'Error: CSV file must have a "label" column';
            return;
          }
          data = records.map((row: any) => ({ text: row.text }));
        }
        fileName = file.name;
      };
      reader.readAsText(file);
    }
  };
  $: message = fileName
    ? `${data.length} records read from ${fileName}`
    : `No file uploaded, please upload a CSV, TSV, JSON, or JSONL file with a "text" ` +
      `and ${requireLabel ? "a" : "an optional"} "label" column.`;
</script>

<section>
  <div class="section-title">Data</div>
  <input
    type="file"
    id="fileInput"
    style="display: none;"
    accept=".csv, .tsv, .json, .jsonl"
    on:change={fileUpload}
  />
  <button
    class="button"
    id="data-upload"
    on:click={() => {
      const fileInput = document.getElementById("fileInput");
      if (fileInput) {
        // Your code here
      }
      if (fileInput) {
        fileInput.click();
      }
    }}>Upload</button
  >
  <button
    class="button"
    id="data-show"
    on:click={() => {
      if (showTable || data.length) {
        showTable = !showTable;
      }
    }}
    disabled={!(showTable || data.length)}>{showTable ? "Hide" : "Show"}</button
  >
  <div class="message">{message}</div>
  {#if showTable}
    <div class="table">
      <table>
        <thead>
          <tr>
            <th>Text</th>
            {#if hasLabel}
              <th>Label</th>
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
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<style>
  @import "../app.css";

  #data-show {
    width: 90px;
  }
</style>
